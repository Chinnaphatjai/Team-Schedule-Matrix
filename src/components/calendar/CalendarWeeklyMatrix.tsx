"use client";

import { useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import {
  Sun,
  Sunset,
  Moon,
  Clock,
  Plus,
  CalendarCheck,
  ArrowRightLeft,
  Calendar,
  Table as TableIcon,
} from "lucide-react";
import {
  AvailabilityItem,
  TimeSlot,
  getTimeSlotDisplay,
  SessionUser,
} from "@/lib/types";

interface CalendarWeeklyMatrixProps {
  currentDate: Date;
  availabilities: AvailabilityItem[];
  teamMembers: Array<{ id: string; name: string; role: string; email: string }>;
  currentUser: SessionUser | null;
  bestMeetingDate?: string | null;
  onSelectCell: (dateStr: string, slot?: TimeSlot) => void;
}

const THAI_DAY_SHORT: Record<string, string> = {
  Mon: "จ.",
  Tue: "อ.",
  Wed: "พ.",
  Thu: "พฤ.",
  Fri: "ศ.",
  Sat: "ส.",
  Sun: "อา.",
};

export default function CalendarWeeklyMatrix({
  currentDate,
  availabilities,
  teamMembers,
  currentUser,
  bestMeetingDate,
  onSelectCell,
}: CalendarWeeklyMatrixProps) {
  const [activeTooltip, setActiveTooltip] = useState<{
    item: AvailabilityItem;
    x: number;
    y: number;
  } | null>(null);

  // Generate 7 days of the active week (Monday to Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Mobile navigation state
  const [selectedMobileDayStr, setSelectedMobileDayStr] = useState<string>(() => {
    return format(currentDate, "yyyy-MM-dd");
  });
  const [mobileMode, setMobileMode] = useState<"DAILY" | "TABLE">("DAILY");

  const getSlotIcon = (slot: TimeSlot) => {
    switch (slot) {
      case "MORNING":
        return <Sun className="h-3 w-3 text-amber-500" />;
      case "AFTERNOON":
        return <Sunset className="h-3 w-3 text-orange-500" />;
      case "EVENING":
        return <Moon className="h-3 w-3 text-indigo-500" />;
      default:
        return <Clock className="h-3 w-3 text-blue-500" />;
    }
  };

  // Selected Day Items for Mobile Day Cards View
  const selectedDayAvailabilities = availabilities.filter(
    (item) => item.date === selectedMobileDayStr
  );

  return (
    <div className="space-y-3">
      {/* MOBILE SEGMENTED CONTROL (< sm) */}
      <div className="sm:hidden flex items-center justify-between rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => setMobileMode("DAILY")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
            mobileMode === "DAILY"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>รายวัน (Daily Cards)</span>
        </button>
        <button
          onClick={() => setMobileMode("TABLE")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
            mobileMode === "TABLE"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <TableIcon className="h-3.5 w-3.5" />
          <span>ตารางสัปดาห์เต็ม (Table)</span>
        </button>
      </div>

      {/* MOBILE DAILY CARDS VIEW (< sm and mode === "DAILY") */}
      {mobileMode === "DAILY" && (
        <div className="block sm:hidden space-y-3">
          {/* Horizontal Weekday Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isSelected = selectedMobileDayStr === dateStr;
              const isCurrentToday = isToday(day);
              const isBestDay = bestMeetingDate === dateStr;
              const engDay = format(day, "EEE");
              const thaiDay = THAI_DAY_SHORT[engDay] || engDay;

              // Count available on this day
              const dayItems = availabilities.filter((i) => i.date === dateStr);
              const availCount = dayItems.filter((i) => i.status === "AVAILABLE").length;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedMobileDayStr(dateStr)}
                  className={`flex flex-col items-center justify-center shrink-0 min-w-[50px] py-2 px-1 rounded-2xl border transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/30"
                      : isBestDay
                      ? "border-amber-300 bg-amber-50/70 text-amber-900"
                      : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold ${
                      isSelected ? "text-blue-100" : isCurrentToday ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {thaiDay}
                  </span>
                  <span className="text-sm font-extrabold mt-0.5">{format(day, "d")}</span>
                  {availCount > 0 && (
                    <span
                      className={`text-[9px] font-bold mt-1 px-1 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {availCount} ว่าง
                    </span>
                  )}
                  {isBestDay && (
                    <CalendarCheck
                      className={`h-3 w-3 mt-0.5 ${
                        isSelected ? "text-amber-200" : "text-amber-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Member Availability List on Selected Day */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  ความพร้อมประจำวัน
                </p>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {new Date(selectedMobileDayStr).toLocaleDateString("th-TH", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>

              <button
                onClick={() => onSelectCell(selectedMobileDayStr)}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ลงเวลานี้</span>
              </button>
            </div>

            {/* Members cards */}
            <div className="space-y-2">
              {teamMembers.map((member) => {
                const memberEntries = selectedDayAvailabilities.filter(
                  (i) => i.userId === member.id
                );
                const isMe = currentUser?.id === member.id;

                return (
                  <div
                    key={member.id}
                    onClick={() => {
                      if (isMe) onSelectCell(selectedMobileDayStr);
                    }}
                    className={`rounded-xl p-3 border text-xs transition-colors ${
                      isMe ? "bg-blue-50/30 border-blue-200/80 cursor-pointer" : "bg-white border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 border border-slate-200">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5 leading-tight">
                            <span>{member.name}</span>
                            {isMe && (
                              <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">
                                คุณ
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {memberEntries.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          ยังไม่ได้บันทึก
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {memberEntries.map((item) => {
                            const isAvailable = item.status === "AVAILABLE";
                            const slotDisplay = getTimeSlotDisplay(item.timeSlot);
                            return (
                              <span
                                key={item.id}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                                  isAvailable
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-rose-50 text-rose-800 border-rose-200"
                                }`}
                              >
                                {getSlotIcon(item.timeSlot as TimeSlot)}
                                <span>{slotDisplay.th}</span>
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Reasons list */}
                    {memberEntries.some((i) => i.reason) && (
                      <div className="mt-2 space-y-1">
                        {memberEntries
                          .filter((i) => i.reason)
                          .map((i) => (
                            <div
                              key={i.id}
                              className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700 border border-slate-200"
                            >
                              <span className="font-semibold text-slate-500">
                                {getTimeSlotDisplay(i.timeSlot).th}:{" "}
                              </span>
                              <span>{i.reason}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FULL MATRIX TABLE (Always visible on >= sm, or on mobile when mode === "TABLE") */}
      <div
        className={`${
          mobileMode === "TABLE" ? "block" : "hidden sm:block"
        } rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden`}
      >
        {/* Mobile Swipe Guidance Banner */}
        <div className="sm:hidden px-3 py-2 bg-blue-50/80 border-b border-blue-100 text-[11px] text-blue-700 flex items-center justify-center gap-1.5 font-medium">
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>ปัดซ้าย-ขวาเพื่อเลื่อนดูวันทั้งหมดในสัปดาห์</span>
        </div>

        <div className="overflow-x-auto relative">
          <table className="w-full border-collapse text-left">
            {/* Table Header: Days of the week */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {/* Pinned / Sticky Member Column */}
                <th className="sticky left-0 bg-slate-50 z-20 py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-slate-700 w-36 sm:w-48 shadow-r border-r border-slate-200">
                  สมาชิกทีม (Member)
                </th>
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const currentToday = isToday(day);
                  const isBestDay = bestMeetingDate === dateStr;

                  return (
                    <th
                      key={dateStr}
                      className={`py-2 px-1.5 sm:px-2 text-center text-xs font-semibold min-w-[110px] sm:min-w-[130px] border-l border-slate-200 ${
                        currentToday
                          ? "bg-blue-50/60 text-blue-700"
                          : isBestDay
                          ? "bg-amber-50/50 text-amber-900"
                          : "text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] sm:text-[11px] text-slate-500">
                          {format(day, "EEE")}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold ${
                              currentToday
                                ? "bg-blue-600 text-white shadow-2xs"
                                : isBestDay
                                ? "bg-amber-200 text-amber-900"
                                : "text-slate-900"
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                          {isBestDay && (
                            <span title="Best Day to Meet">
                              <CalendarCheck className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: Team Members and their slots */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {teamMembers.map((member) => {
                const isCurrentSessionUser = currentUser?.id === member.id;

                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isCurrentSessionUser ? "bg-blue-50/20" : ""
                    }`}
                  >
                    {/* Sticky Member Info Cell */}
                    <td className="sticky left-0 bg-white z-10 py-2.5 px-3 sm:px-4 border-r border-slate-200 shadow-r">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 border border-slate-200 shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="truncate font-semibold text-slate-800 leading-tight">
                            {member.name}
                            {isCurrentSessionUser && (
                              <span className="ml-1 rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">
                                คุณ
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells for this member */}
                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const memberItems = availabilities.filter(
                        (i) => i.userId === member.id && i.date === dateStr
                      );

                      return (
                        <td
                          key={dateStr}
                          onClick={() => onSelectCell(dateStr)}
                          className="p-1 sm:p-1.5 border-l border-slate-100 align-top cursor-pointer hover:bg-blue-50/40 active:bg-blue-100/40 transition-colors"
                        >
                          {memberItems.length === 1 && memberItems[0].timeSlot === "ALL_DAY" ? (
                            <div
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveTooltip({
                                  item: memberItems[0],
                                  x: rect.left,
                                  y: rect.bottom + 4,
                                });
                              }}
                              onMouseLeave={() => setActiveTooltip(null)}
                              className={`rounded-lg p-1.5 text-center text-xs font-semibold border ${
                                memberItems[0].status === "AVAILABLE"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              <span className="block text-[10px] sm:text-[11px] font-bold">
                                <span className="inline-flex items-center gap-1">
                                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${memberItems[0].status === "AVAILABLE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                  <span>{memberItems[0].status === "AVAILABLE" ? "ว่างทั้งวัน" : "ลาทั้งวัน"}</span>
                                </span>
                              </span>
                            </div>
                          ) : memberItems.length > 0 ? (
                            <div className="space-y-1">
                              {memberItems.map((item) => {
                                const isAvailable = item.status === "AVAILABLE";
                                const slotDisplay = getTimeSlotDisplay(item.timeSlot);

                                return (
                                  <div
                                    key={item.id}
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setActiveTooltip({
                                        item,
                                        x: rect.left,
                                        y: rect.bottom + 4,
                                      });
                                    }}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                    className={`flex items-center justify-between rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium border ${
                                      isAvailable
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 truncate">
                                      {getSlotIcon(item.timeSlot as TimeSlot)}
                                      <span className="truncate">{slotDisplay.th}</span>
                                    </div>
                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex h-10 items-center justify-center text-slate-300">
                              <span className="text-[10px]">-</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Popover tooltip */}
        {activeTooltip && (
          <div
            style={{
              position: "fixed",
              left: Math.min(activeTooltip.x, window.innerWidth - 300),
              top: activeTooltip.y,
              zIndex: 9999,
            }}
            className="pointer-events-none w-72 rounded-xl bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md border border-slate-700 animate-in fade-in duration-150"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">
                  {activeTooltip.item.user.name}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeTooltip.item.date}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTooltip.item.status === "AVAILABLE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${activeTooltip.item.status === "AVAILABLE" ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span>{activeTooltip.item.status === "AVAILABLE" ? "สะดวก" : "ไม่ว่าง"}</span>
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-300">
              <span className="text-slate-400">ช่วงเวลา:</span>{" "}
              <span className="font-semibold text-slate-100">
                {getTimeSlotDisplay(activeTooltip.item.timeSlot).th} (
                {getTimeSlotDisplay(activeTooltip.item.timeSlot).time})
              </span>
            </div>

            {activeTooltip.item.status === "BUSY" && (
              <div className="mt-2 rounded-lg bg-slate-800/90 p-2 text-xs border border-slate-700">
                <span className="font-semibold text-rose-400">เหตุผล (Reason):</span>
                <p className="mt-0.5 text-slate-200">
                  {activeTooltip.item.reason || "ไม่ได้ระบุเหตุผล"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
