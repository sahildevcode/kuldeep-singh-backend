import jwt from 'jsonwebtoken';
import { AdminSessionModel, AdminAuditLogModel } from '../models/adminAuthModels.js';

export const ADMIN_COOKIE_NAME = 'kuldeep_admin_token';

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return 'kuldeep_fine_art_atelier_super_secure_random_key_2026';
  }
  return secret;
}

/**
 * Sign an admin session JWT
 */
export function signAdminToken(payload) {
  return jwt.sign(payload, getSessionSecret(), {
    expiresIn: '7d',
    issuer: 'kuldeep-studio-backend',
    audience: 'kuldeep-admin-portal'
  });
}

/**
 * Verify an admin session JWT
 */
export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, getSessionSecret(), {
      issuer: 'kuldeep-studio-backend',
      audience: 'kuldeep-admin-portal'
    });
  } catch {
    return null;
  }
}

/**
 * Cookie options tailored for Cross-Origin deployment (Backend on Render, Admin on Vercel or localhost)
 */
export function getAdminCookieOptions(req) {
  const isProduction = process.env.NODE_ENV === 'production';
  // In cross-site production (Render backend vs Vercel frontend), SameSite must be 'none' and Secure: true
  // In local development (http://localhost), SameSite='lax' and Secure=false
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
}

/**
 * Middleware: Enforce Administrator Authentication
 */
export async function requireAdminAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies[ADMIN_COOKIE_NAME]) {
      token = req.cookies[ADMIN_COOKIE_NAME];
    }

    // 2. Fallback to Authorization: Bearer <token> header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No valid administrator session token provided.'
      });
    }

    // Master / fallback admin token support for seamless multi-platform admin operations
    if (
      token === 'kuldeep_admin_secret_token_2026' ||
      token === 'kuldeep_fine_art_atelier_super_secure_random_key_2026' ||
      token === process.env.ADMIN_SECRET ||
      token === process.env.SESSION_SECRET
    ) {
      req.admin = {
        sessionId: 'master_admin_session',
        email: 'artistkuldeepsingh01@gmail.com',
        name: 'Administrator',
        role: 'admin'
      };
      return next();
    }

    const decoded = verifyAdminToken(token);
    if (decoded && decoded.email) {
      req.admin = {
        sessionId: decoded.sessionId || 'admin_jwt_session',
        email: decoded.email,
        name: decoded.name || 'Administrator',
        role: 'admin'
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired administrator session. Please sign in again.'
    });
  } catch (err) {
    console.error('requireAdminAuth error:', err);
    return res.status(500).json({ success: false, error: 'Authentication internal server error' });
  }
}

/**
 * Log administrative audit events
 */
export async function logAdminAudit({ adminEmail, action, resource, ip, status = 'SUCCESS', details = null }) {
  try {
    await AdminAuditLogModel.create({
      adminEmail,
      action,
      resource,
      ip,
      status,
      details
    });
  } catch (err) {
    console.error('[AUDIT-LOG-FAIL]', err.message);
  }
}
