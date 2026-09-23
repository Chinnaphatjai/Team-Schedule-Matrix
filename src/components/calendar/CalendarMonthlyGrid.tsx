"use client";

import { useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  CalendarCheck,
  Clock,
  Sun,
  Sunset,
  Moon,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  AvailabilityItem,
  TimeSlot,
  getTimeSlotDisplay,
  SessionUser,
} from "@/lib/types";

interface CalendarMonthlyGridProps {
  currentDate: Date;
  availabilities: AvailabilityItem[];
  bestMeetingDate?: string | null;
  currentUser: SessionUser | null;
  onSelectDay: (dateStr: string) => void;
  onDeleteEntry: (id: string) => void;
}

const WEEKDAY_NAMES = [
  { th: "จันทร์", en: "Mon", short: "จ" },
  { th: "อังคาร", en: "Tue", short: "อ" },
  { th: "พุธ", en: "Wed", short: "พ" },
  { th: "พฤหัส", en: "Thu", short: "พฤ" },
  { th: "ศุกร์", en: "Fri", short: "ศ" },
  { th: "เสาร์", en: "Sat", short: "ส" },
  { th: "อาทิตย์", en: "Sun", short: "อา" },
];

export default function CalendarMonthlyGrid({
  currentDate,
  availabilities,
  bestMeetingDate,
  currentUser,
  onSelectDay,
  onDeleteEntry,
}: CalendarMonthlyGridProps) {
  // Mobile active selected day (defaults to today)
  const [selectedMobileDateStr, setSelectedMobileDateStr] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  // Active popover details for hovered entry on desktop
  const [activePopover, setActivePopover] = useState<{
    item: AvailabilityItem;
    x: number;
    y: number;
  } | null>(null);

  // Generate calendar days for the monthly grid (starts Monday)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

  // Selected day items for mobile agenda
  const selectedDayItems = availabilities.filter(
    (item) => item.date === selectedMobileDateStr
  );

  const formatMobileDateHeader = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Monthly Grid Container */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-[11px] sm:text-xs font-semibold text-slate-700">
          {WEEKDAY_NAMES.map((w, idx) => (
            <div key={idx} className="py-2 sm:py-2.5">
              <span className="hidden sm:inline">{w.th}</span>
              <span className="sm:hidden font-bold">{w.short}</span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, currentDate);
            const isCurrentToday = isToday(day);
            const isBestDay = bestMeetingDate === dateStr;
            const isSelectedOnMobile = selectedMobileDateStr === dateStr;

            // Filter entries on this day
            const dayItems = availabilities.filter((item) => item.date === dateStr);
            const availableItems = dayItems.filter((i) => i.status === "AVAILABLE");
            const busyItems = dayItems.filter((i) => i.status === "BUSY");

            return (
              <div
                key={dateStr}
                onClick={() => {
                  setSelectedMobileDateStr(dateStr);
                  // On desktop, click opens modal directly
                  if (window.innerWidth >= 640) {
                    onSelectDay(dateStr);
                  }
                }}
                className={`group relative min-h-[52px] sm:min-h-[115px] p-1 sm:p-2 transition-all cursor-pointer select-none active:bg-blue-100/50 ${
                  !inMonth ? "bg-slate-50/40 text-slate-400 opacity-50 sm:opacity-60" : "bg-white"
                } ${
                  isSelectedOnMobile
                    ? "ring-2 ring-blue-600 bg-blue-50/90 rounded-xl z-10 sm:ring-0 sm:bg-white sm:rounded-none"
                    : ""
                } ${isBestDay ? "ring-1 sm:ring-2 ring-amber-400/80 bg-amber-50/20" : ""}`}
              >
                {/* Header inside cell */}
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold ${
                      isCurrentToday
                        ? "bg-blue-600 text-white shadow-xs"
                        : isBestDay
                        ? "bg-amber-100 text-amber-900"
                        : "text-slate-700"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Best Meeting Day Star Pill */}
                    {isBestDay && (
                      <span
                        title="Best Meeting Day! สมาชิกพร้อมมากที่สุด"
                        className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-amber-800 border border-amber-300"
                      >
                        <CalendarCheck className="h-2.5 w-2.5 text-amber-600" />
                        <span className="hidden xl:inline">Best Day</span>
                      </span>
                    )}

                    {/* Add button on hover (desktop) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDay(dateStr);
                      }}
                      className="hidden sm:block opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="เพิ่มหรือแก้ไขสถานะ"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* MOBILE DOT INDICATORS (< sm) */}
                <div className="mt-1 flex sm:hidden items-center justify-center gap-1">
                  {availableItems.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {busyItems.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                  {dayItems.length > 0 && (
                    <span className="text-[9px] font-mono text-slate-500 font-bold">
                      {dayItems.length}
                    </span>
                  )}
                </div>

                {/* DESKTOP BADGES (>= sm) */}
                <div className="hidden sm:block">
                  {/* Status summary pills */}
                  {dayItems.length > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      {availableItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{availableItems.length} สะดวก</span>
                        </span>
                      )}
                      {busyItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>{busyItems.length} ไม่ว่าง</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Badges List with Hover / Popover */}
                  <div className="mt-1.5 space-y-1">
                    {dayItems.slice(0, 3).map((item) => {
                      const isBusy = item.status === "BUSY";
                      const slotDisplay = getTimeSlotDisplay(item.timeSlot);

                      return (
                        <div
                          key={item.id}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActivePopover({
                              item,
                              x: rect.left,
                              y: rect.bottom + 4,
                            });
                          }}
                          onMouseLeave={() => setActivePopover(null)}
                          className={`group/badge relative flex items-center justify-between rounded-md px-1.5 py-0.5 text-[11px] font-medium border transition-colors ${
                            isBusy
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {getSlotIcon(item.timeSlot)}
                            <span className="truncate">{item.user.name}</span>
                          </div>

                          <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                            {slotDisplay.th}
                          </span>
                        </div>
                      );
                    })}

                    {dayItems.length > 3 && (
                      <div className="text-[10px] font-medium text-slate-500 pl-1">
                        +{dayItems.length - 3} คนอื่นๆ...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Hover Popover Tooltip for Desktop */}
        {activePopover && (
          <div
            style={{
              position: "fixed",
              left: Math.min(activePopover.x, window.innerWidth - 300),
              top: activePopover.y,
              zIndex: 9999,
            }}
            className="pointer-events-none hidden sm:block w-72 rounded-xl bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md border border-slate-700 animate-in fade-in duration-150"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">
                  {activePopover.item.user.name}
                </p>
                <span className="inline-block text-[10px] text-slate-400 font-mono">
                  {activePopover.item.user.email}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activePopover.item.status === "AVAILABLE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${activePopover.item.status === "AVAILABLE" ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span>{activePopover.item.status === "AVAILABLE" ? "สะดวก" : "ไม่ว่าง"}</span>
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-300">
              <span className="text-slate-400">ช่วงเวลา:</span>{" "}
              <span className="font-semibold text-slate-100">
                {getTimeSlotDisplay(activePopover.item.timeSlot).th} (
                {getTimeSlotDisplay(activePopover.item.timeSlot).time})
              </span>
            </div>

            {activePopover.item.status === "BUSY" ? (
              <div className="mt-2 rounded-lg bg-slate-800/90 p-2 text-xs border border-slate-700">
                <span className="font-semibold text-rose-400">เหตุผลประกอบ (Reason):</span>
                <p className="mt-0.5 text-slate-200">
                  {activePopover.item.reason || "ไม่ได้ระบุเหตุผล"}
                </p>
              </div>
            ) : (
              activePopover.item.reason && (
                <div className="mt-2 rounded-lg bg-slate-800/90 p-2 text-xs border border-slate-700">
                  <span className="text-slate-400">หมายเหตุ:</span>{" "}
                  <span className="text-slate-200">{activePopover.item.reason}</span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* MOBILE DAY AGENDA DRAWER / CARD (< sm) */}
      <div className="block sm:hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
              ตารางประจำวันที่เลือก (Daily Schedule)
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {formatMobileDateHeader(selectedMobileDateStr)}
            </h3>
          </div>

          <button
            onClick={() => onSelectDay(selectedMobileDateStr)}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ลงเวลา</span>
          </button>
        </div>

        {/* Selected day entries list */}
        <div className="mt-3 space-y-2">
          {selectedDayItems.length > 0 ? (
            selectedDayItems.map((item) => {
              const isAvailable = item.status === "AVAILABLE";
              const slotDisplay = getTimeSlotDisplay(item.timeSlot);
              const isOwner = currentUser?.id === item.userId;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-3 border text-xs transition-colors ${
                    isAvailable
                      ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                      : "border-rose-200 bg-rose-50/40 text-rose-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-xs shadow-2xs">
                        {item.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          {item.user.name}
                          {isOwner && (
                            <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">
                              คุณ
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {slotDisplay.th} ({slotDisplay.time})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isAvailable
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-emerald-600" : "bg-rose-600"}`} />
                        <span>{isAvailable ? "สะดวก" : "ไม่ว่าง"}</span>
                      </span>
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEntry(item.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 transition-colors"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!isAvailable && item.reason && (
                    <div className="mt-2 rounded-lg bg-white/80 p-2 text-[11px] text-slate-700 border border-rose-100">
                      <span className="font-semibold text-rose-700">เหตุผล: </span>
                      {item.reason}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              <CalendarIcon className="mx-auto h-6 w-6 text-slate-300 mb-1" />
              <p>ยังไม่มีสมาชิกบันทึกความพร้อมในวันนี้</p>
              <button
                onClick={() => onSelectDay(selectedMobileDateStr)}
                className="mt-2 text-blue-600 font-semibold underline text-xs"
              >
                กดที่นี่เพื่อเป็นคนแรกที่ลงเวลา
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
