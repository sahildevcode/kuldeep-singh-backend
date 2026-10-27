import { Resend } from 'resend';
import crypto from 'crypto';

let resendClient = null;

export function getResendClient() {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Generate a 6-digit cryptographically secure OTP string
 */
export function generateCryptoOtp() {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Hash an OTP using HMAC-SHA256 with server session secret
 */
export function hashOtp(otp, salt) {
  const secret = process.env.SESSION_SECRET || 'dev_secret_fallback_key_at_least_32_chars';
  return crypto.createHmac('sha256', secret).update(`${otp}:${salt}`).digest('hex');
}

/**
 * Send Admin 2FA OTP Email via Resend
 */
export async function sendAdminOtpEmail({ toEmail, otp, adminName = 'Administrator' }) {
  const resend = getResendClient();
  const fromAddress = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'Kuldeep Studio <onboarding@resend.dev>';
  const subject = `Your Admin Security Verification Code: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; background-color: #0b0d13; color: #f4ede4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #12151e; border: 1px solid #d4af37; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(180deg, #181d2a 0%, #12151e 100%); border-bottom: 1px solid #232838;">
              <h1 style="color: #d4af37; font-size: 24px; letter-spacing: 3px; margin: 0; font-weight: 700; text-transform: uppercase;">Kuldeep Singh</h1>
              <p style="color: #9499ab; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 0;">Studio & Atelier Administrative Portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 40px;">
              <p style="font-size: 15px; color: #e2ddd5; margin: 0 0 18px 0; line-height: 1.5;">
                Hello <strong>${adminName}</strong>,
              </p>
              <p style="font-size: 14px; color: #a5abbd; line-height: 1.6; margin: 0 0 25px 0;">
                A sign-in attempt was initiated for the Studio Control Center. To authenticate your administrator session, enter this 6-digit one-time verification code:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 16px 36px; background-color: #07090e; border: 2px solid #d4af37; border-radius: 8px; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #d4af37; font-family: monospace;">
                  ${otp}
                </div>
              </div>
              <div style="background-color: #181c27; border-left: 3px solid #d4af37; padding: 12px 16px; border-radius: 4px; margin-bottom: 25px;">
                <p style="font-size: 12px; color: #abb1c4; margin: 0; line-height: 1.5;">
                  <strong>Security Notice:</strong> This code is valid for <strong>5 minutes</strong> and can only be used once. If you did not initiate this login, your account password may be compromised. Please reset your password immediately.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #0d0f16; border-top: 1px solid #1f2433; text-align: center; font-size: 11px; color: #697085;">
              &copy; ${new Date().getFullYear()} Artist Kuldeep Singh Atelier. Protected administrative interface.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AUTH-RESEND-DEV] RESEND_API_KEY is not configured in .env. Falling back to local development OTP dispatch.`);
      console.log(`[AUTH-RESEND-DEV] 6-digit OTP generated for ${toEmail}: ${otp}`);
    } else {
      console.error(`[AUTH-RESEND-PROD] ERROR: RESEND_API_KEY is missing in production environment.`);
      throw new Error('Email service is not configured. Please contact the administrator.');
    }
    return { success: true, devMode: true };
  }

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject,
      html,
    });

    if (response.error) {
      console.error(`[AUTH-RESEND] Failed to send email to ${toEmail}:`, response.error.message);
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (err) {
    console.error(`[AUTH-RESEND] Exception during email dispatch:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Password Recovery OTP Email via Resend
 */
export async function sendPasswordResetOtpEmail({ toEmail, otp, adminName = 'Administrator' }) {
  const resend = getResendClient();
  const fromAddress = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'Kuldeep Studio <onboarding@resend.dev>';
  const subject = `Password Reset Verification Code: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; background-color: #0b0d13; color: #f4ede4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #12151e; border: 1px solid #d4af37; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(180deg, #181d2a 0%, #12151e 100%); border-bottom: 1px solid #232838;">
              <h1 style="color: #d4af37; font-size: 24px; letter-spacing: 3px; margin: 0; font-weight: 700; text-transform: uppercase;">Kuldeep Singh</h1>
              <p style="color: #9499ab; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 0;">Studio & Atelier Administrative Security</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 40px;">
              <p style="font-size: 15px; color: #e2ddd5; margin: 0 0 18px 0; line-height: 1.5;">
                Hello <strong>${adminName}</strong>,
              </p>
              <p style="font-size: 14px; color: #a5abbd; line-height: 1.6; margin: 0 0 25px 0;">
                A request was received to reset the master password for your Studio Administrator account. Enter this 6-digit recovery code to verify your identity and set a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 16px 36px; background-color: #07090e; border: 2px solid #d4af37; border-radius: 8px; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #d4af37; font-family: monospace;">
                  ${otp}
                </div>
              </div>
              <div style="background-color: #181c27; border-left: 3px solid #d4af37; padding: 12px 16px; border-radius: 4px; margin-bottom: 25px;">
                <p style="font-size: 12px; color: #abb1c4; margin: 0; line-height: 1.5;">
                  <strong>Important:</strong> This recovery code is valid for <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email. Your current password remains safe and unchanged.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #0d0f16; border-top: 1px solid #1f2433; text-align: center; font-size: 11px; color: #697085;">
              &copy; ${new Date().getFullYear()} Artist Kuldeep Singh Atelier. Protected administrative interface.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AUTH-RESET-DEV] RESEND_API_KEY is not configured in .env. Falling back to local development OTP dispatch.`);
      console.log(`[AUTH-RESET-DEV] 6-digit Password Reset OTP for ${toEmail}: ${otp}`);
    } else {
      console.error(`[AUTH-RESET-PROD] ERROR: RESEND_API_KEY is missing in production environment.`);
      throw new Error('Email service is not configured. Please contact the administrator.');
    }
    return { success: true, devMode: true };
  }

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject,
      html,
    });

    if (response.error) {
      console.error(`[AUTH-RESET] Failed to send email to ${toEmail}:`, response.error.message);
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (err) {
    console.error(`[AUTH-RESET] Exception during password reset email dispatch:`, err.message);
    return { success: false, error: err.message };
  }
}
