"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AvailabilitySchema, AvailabilityInput } from "@/lib/validations";
import {
  AvailabilityItem,
  DaySummary,
  TeamStats,
  TimeSlot,
  AvailabilityStatus,
} from "@/lib/types";
import { ActionResult } from "./auth";

/**
 * Fetch all availabilities within a date range with optional filtering
 * STRICTLY SCOPED to the selected groupId
 */
export async function getAvailabilitiesAction(params?: {
  groupId?: string;
  startDate?: string;
  endDate?: string;
  memberId?: string;
  timeSlot?: string;
  status?: string;
}): Promise<{
  availabilities: AvailabilityItem[];
  stats: TeamStats;
}> {
  const { groupId, startDate, endDate, memberId, timeSlot, status } = params || {};

  // If groupId is provided, fetch members of this group only
  let allowedUserIds: string[] = [];
  if (groupId) {
    const groupMemberships = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    allowedUserIds = groupMemberships.map((m) => m.userId);

    // If group has no members, return empty
    if (allowedUserIds.length === 0) {
      return {
        availabilities: [],
        stats: {
          totalMembers: 0,
          availableTodayCount: 0,
          busyTodayCount: 0,
          availabilityRateToday: 0,
          bestMeetingDay: null,
        },
      };
    }
  }

  const whereClause: any = {};

  // Filter by allowed group members
  if (allowedUserIds.length > 0) {
    if (memberId && memberId !== "ALL") {
      whereClause.userId = allowedUserIds.includes(memberId) ? memberId : "NO_MATCH";
    } else {
      whereClause.userId = { in: allowedUserIds };
    }
  } else if (memberId && memberId !== "ALL") {
    whereClause.userId = memberId;
  }

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  if (timeSlot && timeSlot !== "ALL") {
    whereClause.timeSlot = timeSlot;
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  // Fetch raw availabilities
  const records = await prisma.availability.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
  });

  const availabilities: AvailabilityItem[] = records.map((rec) => ({
    id: rec.id,
    userId: rec.userId,
    user: rec.user,
    date: rec.date,
    timeSlot: rec.timeSlot as TimeSlot,
    status: rec.status as AvailabilityStatus,
    reason: rec.reason,
    createdAt: rec.createdAt.toISOString(),
    updatedAt: rec.updatedAt.toISOString(),
  }));

  // Calculate team stats for this group
  const totalMembers = allowedUserIds.length > 0
    ? allowedUserIds.length
    : await prisma.user.count({ where: { status: "ACTIVE" } });

  // Calculate today's stats for this group
  const todayStr = new Date().toISOString().split("T")[0];
  const todayWhere: any = { date: todayStr };
  if (allowedUserIds.length > 0) {
    todayWhere.userId = { in: allowedUserIds };
  }

  const todayRecords = await prisma.availability.findMany({
    where: todayWhere,
  });

  // Distinct member counts for today's summary
  const availableUserIds = new Set(
    todayRecords.filter((r) => r.status === "AVAILABLE").map((r) => r.userId)
  );
  const busyUserIds = new Set(
    todayRecords.filter((r) => r.status === "BUSY").map((r) => r.userId)
  );

  const availableTodayCount = availableUserIds.size;
  const busyTodayCount = busyUserIds.size;

  const availabilityRateToday =
    totalMembers > 0
      ? Math.round((availableTodayCount / totalMembers) * 100)
      : 0;

  // Compute "Best Meeting Day" indicator across this group's members
  const dateCounts: Record<string, { available: number; busy: number }> = {};
  for (const item of availabilities) {
    if (!dateCounts[item.date]) {
      dateCounts[item.date] = { available: 0, busy: 0 };
    }
    if (item.status === "AVAILABLE") {
      dateCounts[item.date].available += 1;
    } else {
      dateCounts[item.date].busy += 1;
    }
  }

  let bestMeetingDay: TeamStats["bestMeetingDay"] = null;
  let maxAvailable = -1;

  for (const [date, counts] of Object.entries(dateCounts)) {
    if (counts.available > maxAvailable && counts.available > 0) {
      maxAvailable = counts.available;
      bestMeetingDay = {
        date,
        availableCount: counts.available,
        totalAvailableSlots: counts.available,
      };
    }
  }

  const stats: TeamStats = {
    totalMembers,
    availableTodayCount,
    busyTodayCount,
    availabilityRateToday,
    bestMeetingDay,
  };

  return { availabilities, stats };
}

/**
 * Save or update availability entry
 * Supports multiple entries per day per user
 * If id is passed -> updates existing item
 * If id is not passed -> creates a new item
 */
export async function saveAvailabilityAction(
  rawInput: AvailabilityInput
): Promise<ActionResult<AvailabilityItem>> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return {
        success: false,
        message: "กรุณาเข้าสู่ระบบก่อนบันทึกสถานะ (Unauthorized)",
      };
    }

    const validated = AvailabilitySchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบเหตุผลเมื่อเลือกสถานะไม่ว่าง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { id, date, timeSlot, status, reason } = validated.data;

    let result;
    if (id) {
      // Verify ownership before updating
      const existing = await prisma.availability.findUnique({
        where: { id },
      });

      if (!existing) {
        return {
          success: false,
          message: "ไม่พบรายการที่ต้องการแก้ไข",
        };
      }

      if (existing.userId !== session.id && session.role === "MEMBER") {
        return {
          success: false,
          message: "คุณไม่มีสิทธิ์แก้ไขรายการของสมาชิกท่านอื่น",
        };
      }

      result = await prisma.availability.update({
        where: { id },
        data: {
          date,
          timeSlot,
          status,
          reason: status === "BUSY" ? reason?.trim() : reason?.trim() || null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    } else {
      // Create new entry (allows multiple entries on the same day)
      result = await prisma.availability.create({
        data: {
          userId: session.id,
          date,
          timeSlot,
          status,
          reason: status === "BUSY" ? reason?.trim() : reason?.trim() || null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    }

    return {
      success: true,
      message: id
        ? "อัปเดตรายการเรียบร้อยแล้ว"
        : "เพิ่มรายการใหม่สำเร็จ",
      data: {
        id: result.id,
        userId: result.userId,
        user: result.user,
        date: result.date,
        timeSlot: result.timeSlot as TimeSlot,
        status: result.status as AvailabilityStatus,
        reason: result.reason,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Save availability error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกสถานะ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Delete availability entry
 */
export async function deleteAvailabilityAction(
  id: string
): Promise<ActionResult> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
    }

    const item = await prisma.availability.findUnique({
      where: { id },
    });

    if (!item) {
      return { success: false, message: "ไม่พบรายการที่ต้องการลบ" };
    }

    // Allow user to delete their own, or admin/lead to manage
    if (item.userId !== session.id && session.role === "MEMBER") {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ลบรายการของสมาชิกท่านอื่น",
      };
    }

    await prisma.availability.delete({
      where: { id },
    });

    return { success: true, message: "ลบรายการเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("Delete availability error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบรายการ" };
  }
}

/**
 * Fetch registered team members for filter selectors (scoped by group if provided)
 */
export async function getTeamMembersAction(groupId?: string) {
  if (groupId) {
    const memberships = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });
    return memberships.map((m) => m.user);
  }

  return prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });
}
