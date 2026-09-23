"use client";

import { useState } from "react";
import { X, Users, Copy, Check, ShieldCheck } from "lucide-react";
import { createGroupAction } from "@/actions/group";
import { GroupItem } from "@/lib/types";
import { stripEmojis } from "@/lib/utils";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: GroupItem) => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdGroup, setCreatedGroup] = useState<GroupItem | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await createGroupAction({ name, description });
      if (res.success && res.data) {
        setCreatedGroup(res.data);
        onGroupCreated(res.data);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("ไม่สามารถสร้างกลุ่มได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdGroup) return;
    navigator.clipboard.writeText(createdGroup.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setCreatedGroup(null);
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-t-[28px] sm:rounded-2xl bg-white p-5 sm:p-8 shadow-2xl border border-slate-200/80 max-h-[92vh] overflow-y-auto pb-8 sm:pb-8">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden flex justify-center pt-0.5 pb-3 -mt-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        <button
          onClick={handleFinish}
          aria-label="ปิดหน้าต่าง"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!createdGroup ? (
          <>
            <div className="mb-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-center text-xl font-bold text-slate-900">
                สร้างกลุ่มใหม่ (Create Group)
              </h3>
              <p className="mt-1 text-center text-xs text-slate-500">
                จับกลุ่มทีมของคุณเองเพื่อแชร์ปฏิทินเฉพาะคนในกลุ่ม
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  ชื่อกลุ่ม (Group Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ทีม Frontend, Project Alpha, แผนกออกแบบ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 px-3 text-base sm:text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  คำอธิบายกลุ่ม (Description - Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุข้อมูลเพิ่มเติมเกี่ยวกับกลุ่มนี้ (ถ้ามี)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-200/70 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>ระบบความปลอดภัยกลุ่ม (Private Group Matrix):</span>
                </div>
                <p>&bull; ปฏิทินและคิวว่างจะแสดงเฉพาะสมาชิกในกลุ่มนี้เท่านั้น</p>
                <p>&bull; สมาชิกคนอื่นสามารถเข้าร่วมได้ผ่านรหัสกลุ่ม (Group Code)</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 rounded-xl bg-blue-600 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all min-h-[44px]"
                >
                  {loading ? "กำลังสร้างกลุ่ม..." : "สร้างกลุ่ม (Create)"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-2 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                สร้างกลุ่ม &ldquo;{stripEmojis(createdGroup.name)}&rdquo; สำเร็จ!
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                แชร์รหัสเข้าร่วมกลุ่มนี้ให้เพื่อนร่วมทีมของคุณ
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                รหัสสำหรับเข้าร่วมกลุ่ม (Group Code)
              </span>
              <div className="mt-1 flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-bold tracking-widest text-emerald-400">
                  {createdGroup.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="คัดลอกรหัสกลุ่ม"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="mt-1 text-[11px] text-emerald-400">คัดลอกรหัสแล้ว!</p>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="w-full rounded-xl bg-blue-600 py-3 sm:py-2.5 text-base sm:text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all min-h-[44px]"
            >
              เปิดปฏิทินกลุ่มทันที
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
