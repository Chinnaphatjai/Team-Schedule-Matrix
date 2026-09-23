import crypto from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 10;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;
export const OTP_EXPIRY_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Hashes a password using bcrypt with cost factor 10
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateSecureOtp(): string {
  const otpNumber = crypto.randomInt(100000, 1000000); // 100000 to 999999 inclusive
  return otpNumber.toString();
}

/**
 * Creates a SHA-256 hash of the OTP for secure DB storage
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Helper to check if an account is locked due to rate limiting
 */
export function isAccountLocked(lockedUntil: Date | null): {
  isLocked: boolean;
  minutesRemaining: number;
} {
  if (!lockedUntil) return { isLocked: false, minutesRemaining: 0 };

  const now = new Date();
  if (lockedUntil > now) {
    const diffMs = lockedUntil.getTime() - now.getTime();
    const minutesRemaining = Math.ceil(diffMs / (60 * 1000));
    return { isLocked: true, minutesRemaining };
  }

  return { isLocked: false, minutesRemaining: 0 };
}
