"use server";

import { prisma } from "@/lib/prisma";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validations";
import {
  hashPassword,
  verifyPassword,
  generateSecureOtp,
  hashOtp,
  isAccountLocked,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
} from "@/lib/security";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
} from "@/lib/auth";
import { sendOtpEmail, getLatestDevOtp } from "@/lib/email";
import { SessionUser } from "@/lib/types";

export interface ActionResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Register a new user
 */
export async function registerAction(
  rawInput: RegisterInput
): Promise<ActionResult<SessionUser>> {
  try {
    const validated = RegisterSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบฟิลด์ต่างๆ (Validation error)",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { name, email, password, role } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return {
        success: false,
        message: "อีเมลนี้มีอยู่ในระบบแล้ว (Email already registered)",
        errors: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] },
      };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        status: "ACTIVE",
        tokenVersion: 1,
      },
    });

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      status: user.status,
      tokenVersion: user.tokenVersion,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    return {
      success: true,
      message: "ลงทะเบียนและเข้าสู่ระบบสำเร็จ (Registration successful)",
      data: sessionUser,
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Login action with rate limiting (max 5 failed attempts -> 15 min lockout)
 */
export async function loginAction(
  rawInput: LoginInput
): Promise<ActionResult<SessionUser>> {
  try {
    const validated = LoginSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        success: false,
        message: "กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        success: false,
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid credentials)",
      };
    }

    // Check account lockout status
    const lockout = isAccountLocked(user.lockedUntil);
    if (lockout.isLocked) {
      return {
        success: false,
        message: `บัญชีถูกระงับชั่วคราวเนื่องจากพยายามเข้าสู่ระบบผิดเกินกำหนด กรุณารออีก ${lockout.minutesRemaining} นาที (Account locked for 15 minutes)`,
      };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedAttempts + 1;
      let newLockedUntil: Date | null = null;

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        newLockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: newFailedAttempts,
          lockedUntil: newLockedUntil,
        },
      });

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        return {
          success: false,
          message: `คุณใส่รหัสผ่านผิดเกิน 5 ครั้ง บัญชีถูกระงับการเข้าใช้งาน 15 นาทีเพื่อความปลอดภัย (Account locked for 15 mins)`,
        };
      }

      const attemptsLeft = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      return {
        success: false,
        message: `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสอีก ${attemptsLeft} ครั้งก่อนบัญชีจะถูกล็อค)`,
      };
    }

    // Reset failed attempts on successful login
    if (user.failedAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      status: user.status,
      tokenVersion: user.tokenVersion,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    return {
      success: true,
      message: "เข้าสู่ระบบสำเร็จ (Login successful)",
      data: sessionUser,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Logout current user session
 */
export async function logoutAction(): Promise<ActionResult> {
  await clearSessionCookie();
  return { success: true, message: "ออกจากระบบเรียบร้อยแล้ว" };
}

/**
 * Request OTP for password reset
 * Requirement:
 * - Cryptographically secure 6-digit OTP
 * - Store only SHA-256 hash in DB
 * - Generic success response to avoid user/email enumeration
 * - Expires in 10 minutes
 */
export async function requestOtpAction(
  rawInput: ForgotPasswordInput
): Promise<ActionResult<{ devOtpPreview?: string }>> {
  try {
    const validated = ForgotPasswordSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        success: false,
        message: "กรุณาระบุอีเมลให้ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const normalizedEmail = validated.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return a generic success message to prevent user enumeration
    const genericResponse: ActionResult<{ devOtpPreview?: string }> = {
      success: true,
      message:
        "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งรหัส OTP สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย (If this email exists, an OTP has been sent)",
    };

    if (!user) {
      return genericResponse;
    }

    // Invalidate previous active OTPs for this user
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Generate secure 6-digit OTP
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save SHA-256 hash in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        attempts: 0,
        expiresAt,
        isUsed: false,
      },
    });

    // Send email via Nodemailer/Resend
    await sendOtpEmail(normalizedEmail, user.name, otp, OTP_EXPIRY_MINUTES);

    // If running in development, provide OTP preview for frictionless evaluation
    if (process.env.NODE_ENV === "development") {
      genericResponse.data = { devOtpPreview: otp };
    }

    return genericResponse;
  } catch (error: any) {
    console.error("Request OTP error:", error);
    return {
      success: false,
      message: "ไม่สามารถส่งรหัส OTP ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Verify OTP and reset password
 * Requirement:
 * - Max 5 verification attempts per OTP
 * - Store only SHA-256 hash of OTP
 * - Revoke all active user sessions/tokens upon password reset completion
 */
export async function verifyAndResetPasswordAction(
  rawInput: ResetPasswordInput
): Promise<ActionResult> {
  try {
    const validated = ResetPasswordSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบการกรอกข้อมูล",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { email, otp, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Look for the latest unused password reset request for this email
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetRecord) {
      return {
        success: false,
        message: "ไม่พบคำขอรีเซ็ตรหัสผ่าน หรือรหัส OTP ถูกใช้งานไปแล้ว กรุณาขอรหัสใหม่",
      };
    }

    // Check rate limit on OTP verification attempts (max 5)
    if (resetRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      });
      return {
        success: false,
        message: "คุณกรอกรหัส OTP ผิดเกิน 5 ครั้ง รหัสนี้ถูกยกเลิกแล้ว กรุณาขอรหัสใหม่",
      };
    }

    // Check OTP expiration
    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      });
      return {
        success: false,
        message: "รหัส OTP หมดอายุแล้ว (เกิน 10 นาที) กรุณาขอรหัสใหม่",
      };
    }

    // Verify SHA-256 hash
    const inputOtpHash = hashOtp(otp);
    if (inputOtpHash !== resetRecord.otpHash) {
      const newAttempts = resetRecord.attempts + 1;
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { attempts: newAttempts },
      });

      const remaining = MAX_OTP_ATTEMPTS - newAttempts;
      return {
        success: false,
        message: `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสกรอกอีก ${remaining} ครั้ง)`,
      };
    }

    // Hash the new password with bcrypt (cost 10)
    const newPasswordHash = await hashPassword(password);

    // Update password, reset lockout/failed attempts, and INCREMENT tokenVersion to REVOKE ALL ACTIVE SESSIONS!
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash: newPasswordHash,
        failedAttempts: 0,
        lockedUntil: null,
        tokenVersion: { increment: 1 }, // Revokes all previous JWT tokens!
      },
    });

    // Mark OTP record as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { isUsed: true },
    });

    // Clear existing cookie session so user logs in cleanly with new credentials
    await clearSessionCookie();

    return {
      success: true,
      message:
        "รีเซ็ตรหัสผ่านสำเร็จและยกเลิกเซสชันเดิมทั้งหมดแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ (Password reset successfully. All existing sessions revoked.)",
    };
  } catch (error: any) {
    console.error("Reset password error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUserAction(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Quick demo user switcher has been removed for production readiness
 */
export async function switchDemoUserAction(): Promise<ActionResult<SessionUser>> {
  return {
    success: false,
    message: "ฟังก์ชันบัญชีทดสอบถูกนำออกจากระบบแล้วเพื่อความปลอดภัยสำหรับใช้งานจริง",
  };
}

/**
 * Helper to fetch latest development OTP for the preview banner
 */
export async function getDevLatestOtpAction(email?: string) {
  if (process.env.NODE_ENV !== "development") return null;
  return getLatestDevOtp(email);
}
