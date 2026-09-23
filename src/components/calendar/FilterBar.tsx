"use client";

import {
  Calendar,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface FilterBarProps {
  currentDate: Date;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
  viewMode: "MONTHLY" | "WEEKLY";
  onViewModeChange: (mode: "MONTHLY" | "WEEKLY") => void;
  selectedMemberId: string;
  onMemberChange: (id: string) => void;
  selectedSlot: string;
  onSlotChange: (slot: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  teamMembers: Array<{ id: string; name: string; role: string }>;
}

export default function FilterBar({
  currentDate,
  onPrevDate,
  onNextDate,
  onToday,
  viewMode,
  onViewModeChange,
  selectedMemberId,
  onMemberChange,
  selectedSlot,
  onSlotChange,
  selectedStatus,
  onStatusChange,
  teamMembers,
}: FilterBarProps) {
  const monthTitle = currentDate.toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs">
      {/* Top row: Navigation & View mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Navigator */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-1">
            <button
              onClick={onPrevDate}
              className="flex items-center justify-center min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 rounded-lg p-2 sm:p-1.5 text-slate-600 hover:bg-white hover:shadow-2xs active:bg-slate-200 transition-all"
              title="ย้อนกลับ"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onToday}
              className="min-h-[38px] sm:min-h-0 px-3 py-2 sm:py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-2xs active:bg-slate-200 rounded-lg transition-all"
            >
              วันนี้
            </button>
            <button
              onClick={onNextDate}
              className="flex items-center justify-center min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 rounded-lg p-2 sm:p-1.5 text-slate-600 hover:bg-white hover:shadow-2xs active:bg-slate-200 transition-all"
              title="ถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
            {monthTitle}
          </h2>
        </div>

        {/* View Toggle (Grid 2 cols on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1 w-full sm:w-auto">
          <button
            onClick={() => onViewModeChange("MONTHLY")}
            className={`flex items-center justify-center gap-1.5 rounded-lg min-h-[42px] sm:min-h-0 py-2 sm:py-1.5 px-3 text-xs font-semibold transition-all ${
              viewMode === "MONTHLY"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 active:bg-slate-200/50"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>ปฏิทินรายเดือน</span>
          </button>
          <button
            onClick={() => onViewModeChange("WEEKLY")}
            className={`flex items-center justify-center gap-1.5 rounded-lg min-h-[42px] sm:min-h-0 py-2 sm:py-1.5 px-3 text-xs font-semibold transition-all ${
              viewMode === "WEEKLY"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 active:bg-slate-200/50"
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5 shrink-0" />
            <span>ตารางสัปดาห์</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filters */}
      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100 sm:grid-cols-3">
        {/* 1. Member Filter */}
        <div className="relative">
          <select
            value={selectedMemberId}
            onChange={(e) => onMemberChange(e.target.value)}
            className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 sm:py-2 text-base sm:text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">สมาชิกทุกคนในกลุ่ม</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Time Slot Filter */}
        <div>
          <select
            value={selectedSlot}
            onChange={(e) => onSlotChange(e.target.value)}
            className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 sm:py-2 text-base sm:text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">ทุกช่วงเวลา (All Slots)</option>
            <option value="ALL_DAY">ทั้งวัน (All Day)</option>
            <option value="MORNING">ช่วงเช้า (09:00 - 12:00)</option>
            <option value="AFTERNOON">ช่วงบ่าย (13:00 - 17:00)</option>
            <option value="EVENING">ช่วงค่ำ (18:00+)</option>
          </select>
        </div>

        {/* 3. Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 sm:py-2 text-base sm:text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">ทุกสถานะ (All Status)</option>
            <option value="AVAILABLE">สะดวก (Available)</option>
            <option value="BUSY">ไม่ว่าง / ติดธุระ (Busy)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
