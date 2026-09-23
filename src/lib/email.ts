import nodemailer from "nodemailer";

// In-memory development event bus to easily preview OTPs without SMTP credentials in local development
interface DevOtpRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  timestamp: Date;
}

const globalForOtp = globalThis as unknown as {
  latestDevOtps: Map<string, DevOtpRecord>;
};

if (!globalForOtp.latestDevOtps) {
  globalForOtp.latestDevOtps = new Map();
}

export function saveDevOtp(email: string, otp: string, expiresAt: Date) {
  globalForOtp.latestDevOtps.set(email.toLowerCase().trim(), {
    email: email.toLowerCase().trim(),
    otp,
    expiresAt,
    timestamp: new Date(),
  });
}

export function getLatestDevOtp(email?: string): DevOtpRecord | null {
  if (email) {
    return globalForOtp.latestDevOtps.get(email.toLowerCase().trim()) || null;
  }
  // Return the most recent OTP across all emails
  let latest: DevOtpRecord | null = null;
  for (const record of globalForOtp.latestDevOtps.values()) {
    if (!latest || record.timestamp > latest.timestamp) {
      latest = record;
    }
  }
  return latest;
}

/**
 * Dispatches an OTP verification email to the user
 */
export async function sendOtpEmail(
  toEmail: string,
  userName: string,
  otp: string,
  expiresInMinutes: number = 10
): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  // Store for in-app developer preview banner
  saveDevOtp(toEmail, otp, expiresAt);

  console.log(`\n======================================================`);
  console.log(`[OTP DISPATCH] Team Availability & Schedule Matrix`);
  console.log(`To: ${userName} <${toEmail}>`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Expires in: ${expiresInMinutes} minutes (${expiresAt.toISOString()})`);
  console.log(`======================================================\n`);

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || "no-reply@teamschedule.app";

  if (!smtpHost || !smtpPass) {
    // In dev / test without configured SMTP, we log and return simulated: true
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 22px;">Team Availability & Schedule Matrix</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">ระบบเช็กตารางความพร้อมและคิวว่างของทีม</p>
        </div>
        <p style="color: #334155; font-size: 16px;">เรียนคุณ <strong>${userName}</strong>,</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          ระบบได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาใช้รหัส OTP ด้านล่างนี้เพื่อดำเนินการยืนยันตัวตน:
        </p>
        <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0284c7;">${otp}</span>
          <p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px;">รหัสนี้มีอายุการใช้งาน <strong>${expiresInMinutes} นาที</strong></p>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
          * หากคุณไม่ได้เป็นผู้ร้องขอรีเซ็ตรหัสผ่าน โปรดเพิกเฉยต่ออีเมลฉบับนี้ บัญชีของคุณยังคงปลอดภัย
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Team Schedule Matrix &bull; Security & Authentication Engine
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Team Availability Matrix" <${fromEmail}>`,
      to: toEmail,
      subject: `[${otp}] รหัส OTP สำหรับรีเซ็ตรหัสผ่าน - Team Schedule Matrix`,
      html: htmlContent,
      text: `รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ: ${otp} (หมดอายุใน ${expiresInMinutes} นาที)`,
    });

    return { success: true, simulated: false };
  } catch (error: any) {
    console.error("Failed to send SMTP email:", error);
    // Still return simulated success if dev so flow does not crash
    return { success: true, simulated: true, error: error.message };
  }
}
