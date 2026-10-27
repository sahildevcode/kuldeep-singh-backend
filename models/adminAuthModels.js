import mongoose from 'mongoose';
import { hash, verify } from '@node-rs/argon2';
import crypto from 'crypto';

/**
 * Hash password using modern Argon2id with recommended OWASP parameters
 */
export async function hashPasswordArgon2(password) {
  return await hash(password, {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verify password against Argon2id or legacy PBKDF2 hash (transparent migration)
 */
export async function verifyUserPassword(plainPassword, passwordHash, passwordSalt) {
  if (!plainPassword || !passwordHash) return false;

  // 1. Check if hash is Argon2 format ($argon2id$ or $argon2i$)
  if (passwordHash.startsWith('$argon2')) {
    try {
      return await verify(passwordHash, plainPassword);
    } catch {
      return false;
    }
  }

  // 2. Legacy fallback: PBKDF2 with SHA-512
  try {
    if (!passwordSalt) return false;
    const checkHash = crypto.pbkdf2Sync(plainPassword, passwordSalt, 1000, 64, 'sha512').toString('hex');
    const matches = checkHash === passwordHash;
    return matches;
  } catch {
    return false;
  }
}

/**
 * Admin OTP Challenge Schema for MongoDB Atlas
 * Single-use, 5-minute expiry, max 5 attempts, with keyed hash
 */
export const AdminOtpChallengeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otpHashed: { type: String, required: true },
  salt: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  expiresAt: { type: Date, required: true, index: { expires: '10m' } }, // MongoDB TTL auto-cleanup
  lastSentAt: { type: Date, default: Date.now },
  isUsed: { type: Boolean, default: false }
}, { timestamps: true });

export const AdminSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true, index: true },
  adminEmail: { type: String, required: true, lowercase: true, trim: true },
  adminName: { type: String, default: 'Kuldeep Singh Admin' },
  role: { type: String, default: 'admin' },
  ip: { type: String },
  userAgent: { type: String },
  expiresAt: { type: Date, required: true, index: { expires: '7d' } },
  isRevoked: { type: Boolean, default: false }
}, { timestamps: true });

export const AdminAuditLogSchema = new mongoose.Schema({
  adminEmail: { type: String, default: 'system' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  ip: { type: String },
  status: { type: String, enum: ['SUCCESS', 'FAILURE', 'DENIED'], default: 'SUCCESS' },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const AdminOtpChallengeModel = mongoose.models.AdminOtpChallenge || mongoose.model('AdminOtpChallenge', AdminOtpChallengeSchema);
export const AdminSessionModel = mongoose.models.AdminSession || mongoose.model('AdminSession', AdminSessionSchema);
export const AdminAuditLogModel = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', AdminAuditLogSchema);
