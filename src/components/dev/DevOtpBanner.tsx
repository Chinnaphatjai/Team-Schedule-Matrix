"use client";

import { useEffect, useState } from "react";
import { KeyRound, X, Copy, Check } from "lucide-react";
import { getDevLatestOtpAction } from "@/actions/auth";

interface DevOtpBannerProps {
  onFillOtp?: (otp: string) => void;
}

export default function DevOtpBanner({ onFillOtp }: DevOtpBannerProps) {
  const [latestOtp, setLatestOtp] = useState<{
    email: string;
    otp: string;
    expiresAt: Date;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOtp = async () => {
      try {
        const otpRecord = await getDevLatestOtpAction();
        if (otpRecord) {
          setLatestOtp({
            email: otpRecord.email,
            otp: otpRecord.otp,
            expiresAt: new Date(otpRecord.expiresAt),
          });
        }
      } catch {
        // Ignore
      }
    };

    checkOtp();
    const interval = setInterval(checkOtp, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!latestOtp || dismissed) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(latestOtp.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-14 sm:top-auto sm:bottom-5 right-3 sm:right-5 left-3 sm:left-auto z-50 max-w-sm rounded-2xl bg-slate-900/95 p-3.5 sm:p-4 text-white shadow-2xl backdrop-blur-md border border-slate-700/80 animate-in fade-in slide-in-from-top-3 sm:slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
          <KeyRound className="h-4 w-4" />
          <span>Dev Simulation OTP Preview</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white transition-colors"
          title="ปิดการแจ้งเตือน"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 text-xs text-slate-300">
        รหัส OTP ล่าสุดสำหรับ <span className="font-mono text-cyan-300">{latestOtp.email}</span>:
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-800/90 px-3 py-2 border border-slate-700">
        <span className="font-mono text-2xl font-bold tracking-[0.25em] text-emerald-400">
          {latestOtp.otp}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
          {onFillOtp && (
            <button
              onClick={() => onFillOtp(latestOtp.otp)}
              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              กรอกอัตโนมัติ
            </button>
          )}
        </div>
      </div>
      <div className="mt-1.5 text-[10px] text-slate-400">
        * ระบบเข้ารหัส SHA-256 ในฐานข้อมูล และมีอายุการใช้งาน 10 นาที
      </div>
    </div>
  );
}
