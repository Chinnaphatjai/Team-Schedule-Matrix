export type Role = "ADMIN" | "LEAD" | "MEMBER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type StandardTimeSlot = "ALL_DAY" | "MORNING" | "AFTERNOON" | "EVENING";
export type TimeSlot = StandardTimeSlot | string;

export type AvailabilityStatus = "AVAILABLE" | "BUSY";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  tokenVersion: number;
}

export interface GroupItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdById: string;
  memberCount: number;
  userRole?: string; // OWNER, ADMIN, MEMBER
}

export interface GroupMemberItem {
  id: string;
  userId: string;
  groupId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AvailabilityItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  status: AvailabilityStatus;
  reason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DaySummary {
  date: string;
  dayOfWeek: number; // 0-6
  isToday: boolean;
  isCurrentMonth: boolean;
  items: AvailabilityItem[];
  availableCount: number;
  busyCount: number;
  isBestMeetingDay?: boolean;
}

export interface TeamStats {
  totalMembers: number;
  availableTodayCount: number;
  busyTodayCount: number;
  availabilityRateToday: number;
  bestMeetingDay: {
    date: string;
    availableCount: number;
    totalAvailableSlots: number;
  } | null;
}

export const TIME_SLOT_LABELS: Record<
  StandardTimeSlot,
  { th: string; en: string; time: string; iconName: string }
> = {
  ALL_DAY: {
    th: "ทั้งวัน",
    en: "All Day",
    time: "09:00 - 18:00+",
    iconName: "Clock",
  },
  MORNING: {
    th: "เช้า",
    en: "Morning",
    time: "09:00 - 12:00",
    iconName: "Sun",
  },
  AFTERNOON: {
    th: "บ่าย",
    en: "Afternoon",
    time: "13:00 - 17:00",
    iconName: "Sunset",
  },
  EVENING: {
    th: "ค่ำ",
    en: "Evening",
    time: "18:00 เป็นต้นไป",
    iconName: "Moon",
  },
};

export function getTimeSlotDisplay(slot: string): { th: string; time: string } {
  if (slot in TIME_SLOT_LABELS) {
    const s = TIME_SLOT_LABELS[slot as StandardTimeSlot];
    return { th: s.th, time: s.time };
  }
  return { th: slot, time: slot };
}

export const STATUS_LABELS: Record<
  AvailabilityStatus,
  { th: string; en: string; color: string; badgeClass: string }
> = {
  AVAILABLE: {
    th: "สะดวก",
    en: "Available",
    color: "#10b981",
    badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  },
  BUSY: {
    th: "ไม่ว่าง",
    en: "Busy",
    color: "#ef4444",
    badgeClass: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  },
};
