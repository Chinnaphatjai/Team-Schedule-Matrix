"use client";

import { Users, CheckCircle2, XCircle, CalendarCheck, Calendar } from "lucide-react";
import { TeamStats } from "@/lib/types";

interface SummaryMetricsProps {
  stats: TeamStats;
  onSelectBestDay?: (date: string) => void;
}

export default function SummaryMetrics({ stats, onSelectBestDay }: SummaryMetricsProps) {
  const {
    totalMembers,
    availableTodayCount,
    busyTodayCount,
    availabilityRateToday,
    bestMeetingDay,
  } = stats;

  const formatBestDayDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 lg:gap-4">
      {/* 1. Total Members */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">
            สมาชิกทั้งหมด
          </span>
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-900">{totalMembers}</span>
          <span className="text-[10px] sm:text-xs text-slate-400">คน</span>
        </div>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-400 truncate">
          ในกลุ่มนี้
        </p>
      </div>

      {/* 2. Available Today */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 truncate">
            สะดวกวันนี้
          </span>
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-emerald-700">
            {availableTodayCount}
          </span>
          <span className="text-[10px] sm:text-xs text-emerald-600/70">/ {totalMembers}</span>
        </div>
        <div className="mt-1.5 sm:mt-2 h-1.5 w-full rounded-full bg-emerald-200/60 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(availabilityRateToday, 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Busy Today */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-rose-800 truncate">
            ไม่ว่างวันนี้
          </span>
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-rose-700">{busyTodayCount}</span>
          <span className="text-[10px] sm:text-xs text-rose-600/70">คน</span>
        </div>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-rose-500 truncate">
          มีเหตุผลบันทึกไว้
        </p>
      </div>

      {/* 4. Best Meeting Day Indicator */}
      <div
        onClick={() => bestMeetingDay && onSelectBestDay?.(bestMeetingDay.date)}
        className={`rounded-2xl border p-3 sm:p-4 shadow-2xs transition-all ${
          bestMeetingDay
            ? "border-amber-200 bg-gradient-to-br from-amber-50/70 to-yellow-50/40 hover:border-amber-300 cursor-pointer active:scale-95"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-800 truncate">
            <CalendarCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
            <span className="truncate">Best Meeting Day</span>
          </div>
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
          <span className="text-sm sm:text-lg font-bold text-amber-900 truncate">
            {bestMeetingDay ? formatBestDayDate(bestMeetingDay.date) : "ยังไม่มีข้อมูล"}
          </span>
        </div>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-amber-700/80 truncate">
          {bestMeetingDay ? `ว่าง ${bestMeetingDay.availableCount} ช่องเวลา` : "ยังไม่มีข้อมูล"}
        </p>
      </div>
    </div>
  );
}
