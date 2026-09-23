"use client";

import { useState, useEffect } from "react";
import {
  X,
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { requestOtpAction, verifyAndResetPasswordAction } from "@/actions/auth";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEmail?: string;
  prefillOtp?: string;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = "",
  prefillOtp = "",
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"REQUEST_OTP" | "VERIFY_RESET">("REQUEST_OTP");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(prefillOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes

  const [prevInitialEmail, setPrevInitialEmail] = useState(initialEmail);
  if (initialEmail !== prevInitialEmail) {
    setPrevInitialEmail(initialEmail);
    if (initialEmail) setEmail(initialEmail);
  }

  const [prevPrefillOtp, setPrevPrefillOtp] = useState(prefillOtp);
  if (prefillOtp !== prevPrefillOtp) {
    setPrevPrefillOtp(prefillOtp);
    if (prefillOtp) setOtp(prefillOtp);
  }

  // Countdown timer for OTP validity (10 minutes)
  useEffect(() => {
    if (step !== "VERIFY_RESET" || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await requestOtpAction({ email });
      if (res.success) {
        setSuccessMsg(res.message);
        setStep("VERIFY_RESET");
        setTimerSeconds(600); // reset 10 mins
        if (res.data?.devOtpPreview) {
          setOtp(res.data.devOtpPreview);
        }
      } else {
        setErrorMsg(res.message);
        if (res.errors) setFieldErrors(res.errors);
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await verifyAndResetPasswordAction({
        email,
        otp,
        password,
        confirmPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      } else {
        setErrorMsg(res.message);
        if (res.errors) setFieldErrors(res.errors);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการตรวจสอบ OTP กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-t-[28px] sm:rounded-2xl bg-white p-5 sm:p-8 shadow-2xl border border-slate-200/80 max-h-[92vh] overflow-y-auto pb-8 sm:pb-8">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden flex justify-center pt-0.5 pb-3 -mt-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <KeyRound className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-center text-xl font-bold text-slate-900">
            {step === "REQUEST_OTP" ? "ลืมรหัสผ่าน (Forgot Password)" : "ยืนยัน OTP & ตั้งรหัสผ่านใหม่"}
          </h3>
          <p className="mt-1 text-center text-xs text-slate-500">
            {step === "REQUEST_OTP"
              ? "ระบบจะส่งรหัสความปลอดภัย OTP 6 หลักไปยังอีเมลของคุณ"
              : `กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยัง ${email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === "REQUEST_OTP" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                อีเมลที่ลงทะเบียนไว้ (Email Address)
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 pl-10 pr-3 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-200/70 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>ความปลอดภัยตามมาตรฐานความปลอดภัยสูง (Security Engine):</span>
              </div>
              <p>&bull; รหัส OTP สุ่มเชิงคริปโตกราฟิก 6 หลัก (Cryptographically Secure)</p>
              <p>&bull; จัดเก็บเฉพาะค่า SHA-256 Hash ในฐานข้อมูล</p>
              <p>&bull; จำกัดการกรอกผิดไม่เกิน 5 ครั้ง และหมดอายุใน 10 นาที</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all min-h-[44px]"
            >
              {loading ? "กำลังสร้างและส่งรหัส OTP..." : "ขอรหัส OTP (Request OTP)"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            {/* OTP countdown indicator */}
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 border border-amber-200">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>อายุรหัส OTP:</span>
              </div>
              <span className="font-mono font-bold">{formatTimer(timerSeconds)} นาที</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                รหัส OTP 6 หลัก (6-digit OTP Code)
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 px-3 font-mono text-center text-2xl font-bold tracking-widest text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {fieldErrors.otp && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.otp[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                รหัสผ่านใหม่ (New Password)
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="ขั้นต่ำ 8 ตัว (พิมพ์ใหญ่, เล็ก, สัญลักษณ์/ตัวเลข)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 pl-10 pr-3 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.password[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                ยืนยันรหัสผ่านใหม่ (Confirm Password)
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 pl-10 pr-3 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.confirmPassword[0]}</p>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              * เมื่อรีเซ็ตสำเร็จ เซสชันและโทเค็นเดิมทั้งหมดจะถูกเพิกถอนทันที (Revoke all active sessions)
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("REQUEST_OTP")}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={loading || timerSeconds === 0}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {loading ? "กำลังรีเซ็ตรหัสผ่าน..." : "ยืนยันและรีเซ็ตรหัสผ่าน"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
