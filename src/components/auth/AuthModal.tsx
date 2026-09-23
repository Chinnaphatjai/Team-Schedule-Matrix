"use client";

import { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { loginAction, registerAction } from "@/actions/auth";
import { SessionUser } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: SessionUser) => void;
  onOpenForgotPassword: (email: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenForgotPassword,
}: AuthModalProps) {
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"MEMBER" | "LEAD" | "ADMIN">("MEMBER");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await loginAction({
        email: loginEmail,
        password: loginPassword,
      });

      if (res.success && res.data) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess(res.data!);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.message);
        if (res.errors) setFieldErrors(res.errors);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await registerAction({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
      });

      if (res.success && res.data) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess(res.data!);
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message);
        if (res.errors) setFieldErrors(res.errors);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง");
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

        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => {
              setTab("LOGIN");
              setErrorMsg("");
            }}
            className={`flex-1 pb-3 text-center text-sm font-bold transition-colors ${
              tab === "LOGIN"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            เข้าสู่ระบบ (Login)
          </button>
          <button
            onClick={() => {
              setTab("REGISTER");
              setErrorMsg("");
            }}
            className={`flex-1 pb-3 text-center text-sm font-bold transition-colors ${
              tab === "REGISTER"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            สร้างบัญชีใหม่ (Register)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {tab === "LOGIN" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                อีเมล (Email)
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="yourname@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 pl-10 pr-3 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  รหัสผ่าน (Password)
                </label>
                <button
                  type="button"
                  onClick={() => onOpenForgotPassword(loginEmail)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline py-1"
                >
                  ลืมรหัสผ่าน? (Forgot?)
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="รหัสผ่านของคุณ"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 pl-10 pr-10 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.password[0]}</p>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              * ระบบจำกัดการกรอกผิดไม่เกิน 5 ครั้ง หากเกินจะถูกระงับ 15 นาทีเพื่อความปลอดภัย
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all min-h-[44px]"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Sign In)"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                ชื่อ - นามสกุล (Full Name)
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="เช่น สิทธิชัย หรือ John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2 pl-10 pr-3 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                อีเมล (Email)
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2 pl-10 pr-3 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                รหัสผ่าน (Password - min 8 chars with mixed case & symbols)
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="เช่น Password123!"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2 pl-10 pr-10 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.password[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                บทบาทในทีม (Team Role)
              </label>
              <div className="relative mt-1.5">
                <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2 pl-10 pr-3 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="MEMBER">Member (สมาชิกทีมทั่วไป)</option>
                  <option value="LEAD">Lead (หัวหน้าทีม / Tech Lead)</option>
                  <option value="ADMIN">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all mt-2 min-h-[44px]"
            >
              {loading ? "กำลังสร้างบัญชี..." : "ลงทะเบียน (Create Account)"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
