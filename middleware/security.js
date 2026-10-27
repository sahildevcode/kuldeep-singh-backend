import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

export function setupHelmet() {
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false, // APIs return JSON; don't break SSE text/event-stream or images
  });
}

export function setupCors() {
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const defaultAllowedOrigins = [
    'https://artistkuldeepsingh.com',
    'https://www.artistkuldeepsingh.com',
    'https://artistadmin.artistkuldeepsingh.com',
    'https://artist-kuldeep-singh.vercel.app',
    'https://kuldeep-singh-admin.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:5000'
  ];

  const allowedOriginsSet = new Set([...defaultAllowedOrigins, ...envOrigins]);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOriginsSet.has(origin)) {
        return callback(null, true);
      }

      // Check specific trusted preview subdomains if needed (e.g. *.vercel.app for kuldeep-singh-admin)
      if (/^https:\/\/kuldeep-singh-admin.*\.vercel\.app$/.test(origin) ||
          /^https:\/\/artist-kuldeep-singh.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not permitted by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
  });
}

// Rate Limiter for Login Challenges (Prevents Credential Stuffing)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 login requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please wait 15 minutes before trying again.'
  }
});

// Rate Limiter for OTP Requests (Prevents Resend Spam)
export const otpRequestRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // max 5 OTP requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP requests. Please wait a few minutes before requesting another code.'
  }
});

// Rate Limiter for OTP Verification (Prevents Brute Force)
export const otpVerifyRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // max 10 verification attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification attempts. Please request a new code or try again later.'
  }
});

// General API Rate Limiter
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});
