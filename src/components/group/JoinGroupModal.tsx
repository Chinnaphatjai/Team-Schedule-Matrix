"use client";

import { useState } from "react";
import { X, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { joinGroupByCodeAction } from "@/actions/group";
import { GroupItem } from "@/lib/types";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupJoined: (group: GroupItem) => void;
}

export default function JoinGroupModal({
  isOpen,
  onClose,
  onGroupJoined,
}: JoinGroupModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await joinGroupByCodeAction(code);
      if (res.success && res.data) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onGroupJoined(res.data!);
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเข้าร่วมกลุ่ม กรุณาลองใหม่");
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

        <div className="mb-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <KeyRound className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-center text-xl font-bold text-slate-900">
            เข้าร่วมกลุ่มด้วยรหัส (Join Group)
          </h3>
          <p className="mt-1 text-center text-xs text-slate-500">
            กรอกรหัสกลุ่มที่ได้รับจากเพื่อนร่วมทีมเพื่อเข้าร่วมตารางงาน
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              รหัสกลุ่ม (Group Code) *
            </label>
            <input
              type="text"
              required
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              placeholder="ENG-01"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-3 px-3 font-mono text-center text-2xl font-bold tracking-widest text-slate-900 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[44px]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 rounded-xl bg-blue-600 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span>{loading ? "กำลังค้นหากลุ่ม..." : "เข้าร่วมกลุ่ม"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
