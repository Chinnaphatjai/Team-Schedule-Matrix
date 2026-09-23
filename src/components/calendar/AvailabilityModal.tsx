"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Sun,
  Sunset,
  Moon,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Pencil,
  Plus,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  SessionUser,
  StandardTimeSlot,
  AvailabilityStatus,
  AvailabilityItem,
  TIME_SLOT_LABELS,
  getTimeSlotDisplay,
} from "@/lib/types";
import {
  saveAvailabilityAction,
  deleteAvailabilityAction,
} from "@/actions/availability";

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SessionUser | null;
  initialDate: string; // YYYY-MM-DD
  existingItems: AvailabilityItem[];
  onSaved: () => void;
  onOpenAuth: () => void;
}

const PRESET_TIME_SLOTS: Array<{
  id: StandardTimeSlot;
  label: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "ALL_DAY", label: "ทั้งวัน (All Day)", time: "09:00 - 18:00+", icon: Clock },
  { id: "MORNING", label: "ช่วงเช้า (Morning)", time: "09:00 - 12:00", icon: Sun },
  { id: "AFTERNOON", label: "ช่วงบ่าย (Afternoon)", time: "13:00 - 17:00", icon: Sunset },
  { id: "EVENING", label: "ช่วงค่ำ (Evening)", time: "18:00 เป็นต้นไป", icon: Moon },
];

const QUICK_TIME_PRESETS = [
  "08:30 - 09:30",
  "09:30 - 11:00",
  "10:00 - 11:30",
  "13:00 - 14:30",
  "14:00 - 15:30",
  "15:30 - 17:00",
  "19:00 - 20:30",
];

export default function AvailabilityModal({
  isOpen,
  onClose,
  currentUser,
  initialDate,
  existingItems,
  onSaved,
  onOpenAuth,
}: AvailabilityModalProps) {
  const [date, setDate] = useState(initialDate);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [slotType, setSlotType] = useState<StandardTimeSlot | "CUSTOM">("MORNING");
  const [customSlot, setCustomSlot] = useState("");
  const [status, setStatus] = useState<AvailabilityStatus>("AVAILABLE");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync date when initialDate changes or modal opens without cascading effect
  const [prevInitialDate, setPrevInitialDate] = useState(initialDate);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (initialDate !== prevInitialDate || isOpen !== prevIsOpen) {
    setPrevInitialDate(initialDate);
    setPrevIsOpen(isOpen);
    if (initialDate) {
      setDate(initialDate);
      setEditingId(null);
      setSlotType("MORNING");
      setCustomSlot("");
      setStatus("AVAILABLE");
      setReason("");
      setErrorMsg("");
    }
  }

  // Reset form to "Add New" state
  const resetForm = () => {
    setEditingId(null);
    setSlotType("MORNING");
    setCustomSlot("");
    setStatus("AVAILABLE");
    setReason("");
    setErrorMsg("");
  };

  // Filter items on this date
  const dayItems = existingItems.filter((item) => item.date === date);
  const myItemsOnDate = dayItems.filter((item) => item.userId === currentUser?.id);
  const otherItemsOnDate = dayItems.filter((item) => item.userId !== currentUser?.id);

  if (!isOpen) return null;

  // Handle editing an item
  const handleStartEdit = (item: AvailabilityItem) => {
    setEditingId(item.id);
    setStatus(item.status);
    setReason(item.reason || "");

    if (item.timeSlot in TIME_SLOT_LABELS) {
      setSlotType(item.timeSlot as StandardTimeSlot);
      setCustomSlot("");
    } else {
      setSlotType("CUSTOM");
      setCustomSlot(item.timeSlot);
    }
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Handle delete
  const handleDeleteItem = async (id: string) => {
    if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;
    setDeletingId(id);
    try {
      const res = await deleteAvailabilityAction(id);
      if (res.success) {
        if (editingId === id) {
          resetForm();
        }
        onSaved();
      } else {
        setErrorMsg(res.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const finalSlot = slotType === "CUSTOM" ? customSlot.trim() : slotType;
    if (!finalSlot) {
      setErrorMsg("กรุณาระบุช่วงเวลา (Time slot is required)");
      return;
    }

    if (status === "BUSY" && (!reason || reason.trim().length === 0)) {
      setErrorMsg("กรุณาระบุเหตุผลกรณีที่ไม่ว่าง (Reason is mandatory for Busy status)");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await saveAvailabilityAction({
        id: editingId || undefined,
        date,
        timeSlot: finalSlot,
        status,
        reason: status === "BUSY" ? reason.trim() : reason.trim() || null,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        resetForm();
        onSaved();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case "MORNING":
        return <Sun className="h-3.5 w-3.5 text-amber-500" />;
      case "AFTERNOON":
        return <Sunset className="h-3.5 w-3.5 text-orange-500" />;
      case "EVENING":
        return <Moon className="h-3.5 w-3.5 text-indigo-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-t-[28px] sm:rounded-2xl bg-white p-4 sm:p-7 shadow-2xl border border-slate-200/80 max-h-[92vh] flex flex-col overflow-hidden transition-all pb-6 sm:pb-5">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden flex justify-center pt-0.5 pb-2.5 -mt-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                จัดการตารางประจำวัน
              </h3>
              {myItemsOnDate.length > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {myItemsOnDate.length} รายการของคุณ
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              บันทึกช่วงเวลาสะดวก หรือระบุการติดธุระ/ลาประจำวัน
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Notification Alerts */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200 animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Date Selector Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">วันที่เลือก:</span>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  resetForm();
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-base sm:text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>ผู้บันทึก:</span>
              <span className="font-semibold text-slate-800">
                {currentUser ? currentUser.name : "ยังไม่ได้เข้าสู่ระบบ"}
              </span>
            </div>
          </div>

          {/* LIST OF EXISTING ENTRIES ON THIS DAY */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>รายการของคุณในวันนี้ ({myItemsOnDate.length})</span>
              </h4>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  <span>สลับเป็นเพิ่มรายการใหม่</span>
                </button>
              )}
            </div>

            {myItemsOnDate.length > 0 ? (
              <div className="space-y-2">
                {myItemsOnDate.map((item) => {
                  const isBusy = item.status === "BUSY";
                  const isBeingEdited = editingId === item.id;
                  const slotDisplay = getTimeSlotDisplay(item.timeSlot);

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl p-3 border text-xs transition-all ${
                        isBeingEdited
                          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : isBusy
                          ? "border-rose-200 bg-rose-50/30"
                          : "border-emerald-200 bg-emerald-50/30"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-semibold text-slate-900">
                            {getSlotIcon(item.timeSlot)}
                            <span>{slotDisplay.th}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({slotDisplay.time})
                            </span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isBusy
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isBusy ? "bg-rose-600" : "bg-emerald-600"}`} />
                            <span>{isBusy ? "ไม่ว่าง" : "สะดวก"}</span>
                          </span>
                        </div>

                        {item.reason && (
                          <p className="text-[11px] text-slate-600 pl-4 border-l-2 border-slate-300">
                            {item.reason}
                          </p>
                        )}
                      </div>

                      {/* Action buttons with minimum 40px touch targets */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                          title="แก้ไขรายการนี้"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="flex items-center gap-1 rounded-lg bg-white border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors disabled:opacity-50"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                คุณยังไม่มีรายการในวันนี้ กรุณากรอกแบบฟอร์มด้านล่างเพื่อเพิ่มรายการแรก
              </div>
            )}
          </div>

          {/* Other team members on this date (Read-only summary) */}
          {otherItemsOnDate.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                รายการของเพื่อนร่วมทีมคนอื่นในวันนี้ ({otherItemsOnDate.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {otherItemsOnDate.map((item) => (
                  <span
                    key={item.id}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${
                      item.status === "BUSY"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    <span>{item.user.name}:</span>
                    <span>{getTimeSlotDisplay(item.timeSlot).th}</span>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.status === "BUSY" ? "bg-rose-500" : "bg-emerald-500"}`} />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ADD / EDIT FORM */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  {editingId ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </span>
                <span>
                  {editingId ? "แก้ไขรายการที่เลือก" : "เพิ่มรายการใหม่ในวันนี้"}
                </span>
              </h4>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>ยกเลิกการแก้ไข</span>
                </button>
              )}
            </div>

            {/* Time Slot Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  เลือกช่วงเวลา (Time Slot)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotType("CUSTOM")}
                    className={`text-[11px] sm:text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      slotType === "CUSTOM"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    + กำหนดเวลาเอง (Custom)
                  </button>
                </div>
              </div>

              {/* Standard preset buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_TIME_SLOTS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = slotType === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSlotType(opt.id)}
                      className={`flex flex-col items-start rounded-xl p-2.5 sm:p-2 text-left text-xs transition-all border min-h-[54px] sm:min-h-0 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-2 ring-blue-600/30"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon
                          className={`h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0 ${
                            isSelected ? "text-blue-600" : "text-slate-400"
                          }`}
                        />
                        <span className="leading-tight text-xs sm:text-[11px] font-bold">
                          {opt.label.split(" ")[0]}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[9px] text-slate-400">{opt.time}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Time Slot Input */}
              {slotType === "CUSTOM" && (
                <div className="mt-2.5 rounded-xl border border-blue-200 bg-blue-50/30 p-3 space-y-2">
                  <label className="block text-xs sm:text-[11px] font-semibold text-blue-900">
                    ระบุช่วงเวลาที่ต้องการ (เช่น 09:30 - 11:00, 14:00 - 15:30):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 10:00 - 11:30 หรือ บ่ายโมงถึงบ่ายสาม"
                    value={customSlot}
                    onChange={(e) => setCustomSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 touch-pan-x">
                    <span className="text-[11px] sm:text-[10px] text-slate-500 shrink-0 font-medium">เลือกด่วน:</span>
                    {QUICK_TIME_PRESETS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCustomSlot(t)}
                        className="shrink-0 rounded-lg bg-white border border-slate-200 px-2 py-1 text-xs sm:text-[10px] font-mono text-slate-700 active:bg-blue-50 active:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                สถานะความพร้อม (Status)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("AVAILABLE")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 sm:py-2 px-3 text-xs font-bold transition-all border min-h-[44px] ${
                    status === "AVAILABLE"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>สะดวก (Available)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("BUSY")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 sm:py-2 px-3 text-xs font-bold transition-all border min-h-[44px] ${
                    status === "BUSY"
                      ? "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span>ไม่ว่าง / ติดธุระ (Busy)</span>
                </button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  รายละเอียด / เหตุผล (Reason / Activity)
                  {status === "BUSY" && (
                    <span className="text-rose-600 font-bold ml-1">* บังคับระบุ</span>
                  )}
                </label>
                {status === "AVAILABLE" && (
                  <span className="text-[10px] text-slate-400">(ระบุหรือไม่ก็ได้)</span>
                )}
              </div>
              <textarea
                rows={2}
                required={status === "BUSY"}
                placeholder={
                  status === "BUSY"
                    ? "เช่น ติดประชุม Sprint Review, ตรวจไซต์งาน, ลาพักผ่อน"
                    : "เช่น พร้อมประชุมทีม, สแตนด์บายตอบแชท (ถ้ามี)"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 sm:py-2.5 px-4 text-sm sm:text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all min-h-[44px]"
              >
                {loading ? (
                  <span>กำลังบันทึก...</span>
                ) : editingId ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>บันทึกการแก้ไขรายการ</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>+ บันทึกรายการนี้ลงในวัน</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer / Done Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {myItemsOnDate.length > 0
              ? `มี ${myItemsOnDate.length} รายการบันทึกแล้วในวันที่ ${date}`
              : "กรอกข้อมูลและกดบันทึกเพื่อเพิ่มรายการ"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            เสร็จสิ้น / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
