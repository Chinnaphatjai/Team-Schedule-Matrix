import { z } from "zod";

// Password regex: min 8 characters, at least 1 uppercase, 1 lowercase, and 1 number or special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;

export const RegisterSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร (Name must be at least 2 chars)"),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง (Invalid email address)"),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร (Password must be at least 8 characters)")
    .regex(
      passwordRegex,
      "รหัสผ่านต้องประกอบด้วยตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, และตัวเลขหรือสัญลักษณ์ (Password must include uppercase, lowercase, and a number or symbol)"
    ),
  role: z.enum(["MEMBER", "LEAD", "ADMIN"]).default("MEMBER"),
});

export const LoginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง (Invalid email address)"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน (Password is required)"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง (Invalid email address)"),
});

export const ResetPasswordSchema = z
  .object({
    email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง (Invalid email address)"),
    otp: z
      .string()
      .length(6, "รหัส OTP ต้องเป็นตัวเลข 6 หลัก (OTP must be exactly 6 digits)")
      .regex(/^\d{6}$/, "รหัส OTP ต้องเป็นตัวเลขเท่านั้น (OTP must contain only numbers)"),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร (Password must be at least 8 characters)")
      .regex(
        passwordRegex,
        "รหัสผ่านต้องประกอบด้วยตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, และตัวเลขหรือสัญลักษณ์"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านยืนยันไม่ตรงกัน (Passwords do not match)",
    path: ["confirmPassword"],
  });

export const AvailabilitySchema = z
  .object({
    id: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
    timeSlot: z.string().min(1, "กรุณาระบุช่วงเวลา"),
    status: z.enum(["AVAILABLE", "BUSY"]),
    reason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === "BUSY") {
        return !!data.reason && data.reason.trim().length > 0;
      }
      return true;
    },
    {
      message: "กรุณาระบุเหตุผลกรณีที่ไม่ว่าง (Reason is mandatory when marked as Busy)",
      path: ["reason"],
    }
  );

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type AvailabilityInput = z.infer<typeof AvailabilitySchema>;
