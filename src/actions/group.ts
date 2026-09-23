"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { GroupItem, GroupMemberItem } from "@/lib/types";
import { stripEmojis } from "@/lib/utils";
import { ActionResult } from "./auth";

/**
 * Generate a friendly 6-character uppercase alphanumeric join code (e.g. ENG-925)
 */
function generateGroupCode(prefix: string = "GRP"): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "GRP";
  const randomNum = crypto.randomInt(100, 999);
  const randomLetter = String.fromCharCode(65 + crypto.randomInt(0, 26));
  return `${cleanPrefix}-${randomNum}${randomLetter}`;
}

/**
 * Fetch all groups that the current user belongs to
 */
export async function getUserGroupsAction(): Promise<GroupItem[]> {
  const session = await getSessionUser();
  if (!session) return [];

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.id },
    include: {
      group: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.group.id,
    name: stripEmojis(m.group.name),
    code: m.group.code,
    description: m.group.description ? stripEmojis(m.group.description) : null,
    createdById: m.group.createdById,
    memberCount: m.group._count.members,
    userRole: m.role,
  }));
}

/**
 * Create a new team group and assign current user as OWNER
 */
export async function createGroupAction(params: {
  name: string;
  description?: string;
}): Promise<ActionResult<GroupItem>> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนสร้างกลุ่ม" };
    }

    const { name, description } = params;
    const cleanName = stripEmojis(name.trim());
    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: "ชื่อกลุ่มต้องมีอย่างน้อย 2 ตัวอักษร" };
    }

    // Generate unique group code
    let code = generateGroupCode(cleanName);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.group.findUnique({ where: { code } });
      if (!existing) break;
      code = generateGroupCode("GRP");
      attempts++;
    }

    const group = await prisma.group.create({
      data: {
        name: cleanName,
        code,
        description: description ? stripEmojis(description.trim()) || null : null,
        createdById: session.id,
        members: {
          create: {
            userId: session.id,
            role: "OWNER",
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return {
      success: true,
      message: `สร้างกลุ่ม "${group.name}" สำเร็จ รหัสกลุ่มคือ: ${group.code}`,
      data: {
        id: group.id,
        name: group.name,
        code: group.code,
        description: group.description,
        createdById: group.createdById,
        memberCount: group._count.members,
        userRole: "OWNER",
      },
    };
  } catch (error: any) {
    console.error("Create group error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างกลุ่ม" };
  }
}

/**
 * Join an existing group using its unique code
 */
export async function joinGroupByCodeAction(
  code: string
): Promise<ActionResult<GroupItem>> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนเข้าร่วมกลุ่ม" };
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return { success: false, message: "กรุณาระบุรหัสกลุ่ม" };
    }

    const group = await prisma.group.findUnique({
      where: { code: normalizedCode },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return {
        success: false,
        message: "ไม่พบกลุ่มตามรหัสนี้ กรุณาตรวจสอบความถูกต้องของรหัสกลุ่ม",
      };
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.id,
        },
      },
    });

    if (existingMembership) {
      return {
        success: false,
        message: `คุณเป็นสมาชิกของกลุ่ม "${group.name}" อยู่แล้ว`,
      };
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.id,
        role: "MEMBER",
      },
    });

    return {
      success: true,
      message: `เข้าร่วมกลุ่ม "${stripEmojis(group.name)}" สำเร็จ!`,
      data: {
        id: group.id,
        name: stripEmojis(group.name),
        code: group.code,
        description: group.description ? stripEmojis(group.description) : null,
        createdById: group.createdById,
        memberCount: group._count.members + 1,
        userRole: "MEMBER",
      },
    };
  } catch (error: any) {
    console.error("Join group error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเข้าร่วมกลุ่ม" };
  }
}

/**
 * Fetch all members of a specific group
 */
export async function getGroupMembersAction(
  groupId: string
): Promise<GroupMemberItem[]> {
  const members = await prisma.groupMember.findMany({
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
    orderBy: { joinedAt: "asc" },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    groupId: m.groupId,
    role: m.role,
    user: m.user,
  }));
}

/**
 * Leave group
 */
export async function leaveGroupAction(groupId: string): Promise<ActionResult> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อน" };
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.id,
        },
      },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!membership) {
      return { success: false, message: "คุณไม่ได้เป็นสมาชิกในกลุ่มนี้" };
    }

    await prisma.groupMember.delete({
      where: { id: membership.id },
    });

    // If no members left in group, delete the group
    if (membership.group._count.members <= 1) {
      await prisma.group.delete({
        where: { id: groupId },
      });
    }

    return { success: true, message: `ออกจากกลุ่ม "${membership.group.name}" เรียบร้อยแล้ว` };
  } catch (error: any) {
    return { success: false, message: "ไม่สามารถออกจากกลุ่มได้ในขณะนี้" };
  }
}
