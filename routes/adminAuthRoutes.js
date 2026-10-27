import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import {
  hashPasswordArgon2,
  verifyUserPassword,
  AdminOtpChallengeModel,
  AdminSessionModel,
} from '../models/adminAuthModels.js';
import {
  generateCryptoOtp,
  hashOtp,
  sendAdminOtpEmail,
} from '../services/emailService.js';
import {
  loginRateLimiter,
  otpRequestRateLimiter,
  otpVerifyRateLimiter,
} from '../middleware/security.js';
import {
  ADMIN_COOKIE_NAME,
  signAdminToken,
  getAdminCookieOptions,
  requireAdminAuth,
  logAdminAudit,
} from '../middleware/auth.js';

export function createAdminAuthRouter(UserModel, findUserByEmailOrUsername) {
  const router = express.Router();

  const getAuthorizedAdminEmails = () => {
    const fromEnv = (process.env.ADMIN_EMAILS || 'admin@kuldeepsingh.art,kuldeep@art.com')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    return new Set(fromEnv);
  };

  // Zod Schemas
  const loginChallengeSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  });

  const verifyOtpSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  });

  const forgotPasswordSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
  });

  const resetPasswordSchema = z.object({
    token: z.string().min(10, 'Invalid reset token'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  });

  /**
   * STEP 1: Admin Login Challenge
   * Verifies Admin Email and Password, then dispatches 6-digit Resend OTP
   */
  router.post('/login-challenge', loginRateLimiter, async (req, res) => {
    try {
      const parseResult = loginChallengeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: parseResult.error.errors[0]?.message || 'Validation error',
        });
      }

      const { email, password } = parseResult.data;
      const authorizedAdmins = getAuthorizedAdminEmails();

      // Enforce Admin Authorization
      if (!authorizedAdmins.has(email)) {
        await logAdminAudit({
          adminEmail: email,
          action: 'LOGIN_CHALLENGE_REJECTED',
          resource: '/api/admin/login-challenge',
          ip: req.ip,
          status: 'DENIED',
          details: { reason: 'Unauthorized admin email attempt' }
        });
        // Generic response to prevent email enumeration
        return res.status(401).json({
          success: false,
          error: 'Invalid administrator credentials or unauthorized email.'
        });
      }

      // Check DB user account
      let user = await findUserByEmailOrUsername(email);

      // If user does not exist in DB yet, bootstrap initial authorized admin account
      if (!user) {
        console.log(`[ADMIN-BOOTSTRAP] First time provisioning authorized admin account for ${email}...`);
        const passwordHash = await hashPasswordArgon2('kuldeep2026');
        const newUser = new UserModel({
          id: `admin_${Date.now()}`,
          name: 'Kuldeep Singh',
          email,
          username: 'kuldeep_admin',
          passwordHash,
          passwordSalt: 'argon2id',
          role: 'admin',
          isEmailVerified: true,
        });
        await newUser.save();
        user = newUser.toObject();
      }

      // Verify Password
      const isPasswordValid = await verifyUserPassword(password, user.passwordHash, user.passwordSalt);
      if (!isPasswordValid) {
        await logAdminAudit({
          adminEmail: email,
          action: 'LOGIN_CHALLENGE_FAILED',
          resource: '/api/admin/login-challenge',
          ip: req.ip,
          status: 'FAILURE',
          details: { reason: 'Invalid password' }
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid administrator credentials or unauthorized email.'
        });
      }

      // If password was using legacy PBKDF2, transparently upgrade to Argon2id
      if (!user.passwordHash.startsWith('$argon2')) {
        try {
          const modernHash = await hashPasswordArgon2(password);
          await UserModel.updateOne(
            { email },
            { passwordHash: modernHash, passwordSalt: 'argon2id', plainPassword: '' }
          );
          console.log(`[SECURITY-UPGRADE] Transparently upgraded ${email} password to Argon2id`);
        } catch (upgradeErr) {
          console.warn('[SECURITY-UPGRADE] Could not upgrade password hash:', upgradeErr.message);
        }
      }

      // Check cooldown (60 seconds) on recent OTP challenges
      const recentChallenge = await AdminOtpChallengeModel.findOne({
        email,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (recentChallenge) {
        const timeSinceLastSent = (Date.now() - new Date(recentChallenge.lastSentAt).getTime()) / 1000;
        if (timeSinceLastSent < 60) {
          const waitSeconds = Math.ceil(60 - timeSinceLastSent);
          return res.status(429).json({
            success: false,
            error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
            cooldownRemaining: waitSeconds
          });
        }
      }

      // Generate 6-digit OTP
      const rawOtp = generateCryptoOtp();
      const salt = crypto.randomBytes(16).toString('hex');
      const otpHashed = hashOtp(rawOtp, salt);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Invalidate any older challenges for this email
      await AdminOtpChallengeModel.updateMany({ email, isUsed: false }, { isUsed: true });

      // Save atomic OTP challenge in MongoDB
      await AdminOtpChallengeModel.create({
        email,
        otpHashed,
        salt,
        attempts: 0,
        maxAttempts: 5,
        expiresAt,
        lastSentAt: new Date(),
        isUsed: false,
      });

      // Dispatch Email via Resend
      const emailResult = await sendAdminOtpEmail({
        toEmail: email,
        otp: rawOtp,
        adminName: user.name || 'Studio Administrator'
      });

      if (!emailResult.success && !emailResult.devMode) {
        return res.status(502).json({
          success: false,
          error: 'Failed to deliver OTP email. Please ensure your email domain is verified or contact support.'
        });
      }

      await logAdminAudit({
        adminEmail: email,
        action: 'OTP_DISPATCHED',
        resource: '/api/admin/login-challenge',
        ip: req.ip,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'A 6-digit verification code has been dispatched to your administrator email.',
        email,
        expiresInSeconds: 300,
        cooldownSeconds: 60,
        devMode: Boolean(emailResult.devMode)
      });
    } catch (err) {
      console.error('Admin login-challenge error:', err);
      res.status(500).json({ success: false, error: 'Internal server error processing login challenge' });
    }
  });

  /**
   * STEP 2: Verify 6-digit Admin OTP
   * Atomic single-use verification, max 5 attempts, creates signed HttpOnly session
   */
  router.post('/verify-otp', otpVerifyRateLimiter, async (req, res) => {
    try {
      const parseResult = verifyOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: parseResult.error.errors[0]?.message || 'Validation error'
        });
      }

      const { email, otp } = parseResult.data;

      // Find the active challenge
      const challenge = await AdminOtpChallengeModel.findOne({
        email,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (!challenge) {
        return res.status(400).json({
          success: false,
          error: 'Verification code has expired or was already used. Please request a new code.'
        });
      }

      // Check max attempts
      if (challenge.attempts >= challenge.maxAttempts) {
        challenge.isUsed = true;
        await challenge.save();
        await logAdminAudit({
          adminEmail: email,
          action: 'OTP_MAX_ATTEMPTS_EXCEEDED',
          resource: '/api/admin/verify-otp',
          ip: req.ip,
          status: 'DENIED'
        });
        return res.status(429).json({
          success: false,
          error: 'Maximum verification attempts exceeded. For security, please request a new verification code.'
        });
      }

      // Compare keyed hash
      const computedHash = hashOtp(otp, challenge.salt);
      const isMatch = crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(challenge.otpHashed));

      if (!isMatch) {
        challenge.attempts += 1;
        await challenge.save();
        const attemptsLeft = challenge.maxAttempts - challenge.attempts;

        await logAdminAudit({
          adminEmail: email,
          action: 'OTP_VERIFICATION_FAILED',
          resource: '/api/admin/verify-otp',
          ip: req.ip,
          status: 'FAILURE',
          details: { attemptsLeft }
        });

        return res.status(400).json({
          success: false,
          error: `Incorrect verification code. ${attemptsLeft} attempt(s) remaining.`,
          attemptsRemaining: attemptsLeft
        });
      }

      // Single-use: Mark challenge as used immediately
      challenge.isUsed = true;
      await challenge.save();

      // Retrieve user details
      const user = await findUserByEmailOrUsername(email);
      const sessionId = `admin_sess_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create persistent Admin Session record
      await AdminSessionModel.create({
        sessionId,
        adminEmail: email,
        adminName: user?.name || 'Administrator',
        role: 'admin',
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
        expiresAt,
        isRevoked: false,
      });

      // Generate signed JWT token
      const token = signAdminToken({
        sessionId,
        email,
        name: user?.name || 'Administrator',
        role: 'admin'
      });

      // Set HttpOnly, Secure, SameSite Cookie
      res.cookie(ADMIN_COOKIE_NAME, token, getAdminCookieOptions(req));

      await logAdminAudit({
        adminEmail: email,
        action: 'ADMIN_SESSION_CREATED',
        resource: '/api/admin/verify-otp',
        ip: req.ip,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Administrator authentication successful.',
        admin: {
          email,
          name: user?.name || 'Administrator',
          role: 'admin'
        },
        token // Provided so client can also use Bearer token if cookies are restricted in cross-origin preview
      });
    } catch (err) {
      console.error('Admin verify-otp error:', err);
      res.status(500).json({ success: false, error: 'Internal server error verifying OTP' });
    }
  });

  /**
   * STEP 3: Resend OTP (Rate limited with 60s cooldown)
   */
  router.post('/resend-otp', otpRequestRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const authorizedAdmins = getAuthorizedAdminEmails();
      if (!authorizedAdmins.has(cleanEmail)) {
        return res.status(401).json({ success: false, error: 'Unauthorized email' });
      }

      // Check 60s cooldown
      const existing = await AdminOtpChallengeModel.findOne({
        email: cleanEmail,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (existing) {
        const timeSince = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
        if (timeSince < 60) {
          const waitSeconds = Math.ceil(60 - timeSince);
          return res.status(429).json({
            success: false,
            error: `Please wait ${waitSeconds}s before requesting a new code.`,
            cooldownRemaining: waitSeconds
          });
        }
      }

      // Generate and save new challenge
      const rawOtp = generateCryptoOtp();
      const salt = crypto.randomBytes(16).toString('hex');
      const otpHashed = hashOtp(rawOtp, salt);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await AdminOtpChallengeModel.updateMany({ email: cleanEmail, isUsed: false }, { isUsed: true });
      await AdminOtpChallengeModel.create({
        email: cleanEmail,
        otpHashed,
        salt,
        attempts: 0,
        maxAttempts: 5,
        expiresAt,
        lastSentAt: new Date(),
        isUsed: false,
      });

      const emailResult = await sendAdminOtpEmail({
        toEmail: cleanEmail,
        otp: rawOtp,
      });

      return res.json({
        success: true,
        message: 'A new 6-digit verification code has been dispatched.',
        expiresInSeconds: 300,
        cooldownSeconds: 60,
        devMode: Boolean(emailResult.devMode)
      });
    } catch (err) {
      console.error('Resend OTP error:', err);
      res.status(500).json({ success: false, error: 'Internal server error resending code' });
    }
  });

  /**
   * STEP 4: Session Validation Endpoint
   */
  router.get('/session', requireAdminAuth, async (req, res) => {
    res.json({
      success: true,
      authenticated: true,
      admin: {
        email: req.admin.email,
        name: req.admin.name,
        role: req.admin.role
      }
    });
  });

  /**
   * STEP 5: Secure Logout & Session Revocation
   */
  router.post('/logout', async (req, res) => {
    try {
      const token = req.cookies?.[ADMIN_COOKIE_NAME] || req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.decode(token);
          if (decoded?.sessionId) {
            await AdminSessionModel.updateOne(
              { sessionId: decoded.sessionId },
              { isRevoked: true }
            );
          }
        } catch {}
      }

      res.clearCookie(ADMIN_COOKIE_NAME, {
        ...getAdminCookieOptions(req),
        maxAge: 0
      });

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
