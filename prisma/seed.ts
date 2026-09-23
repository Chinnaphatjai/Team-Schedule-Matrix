import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Team Availability & Schedule Matrix database...");

  // Clean existing data
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = "Password123!"; // Min 8 chars, uppercase, lowercase, number/symbol
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Create Team Users
  const usersData = [
    {
      name: "Apinya S. (Tech Lead)",
      email: "apinya@team.com",
      role: "LEAD",
      status: "ACTIVE",
    },
    {
      name: "Somchai D. (Senior Backend)",
      email: "somchai@team.com",
      role: "MEMBER",
      status: "ACTIVE",
    },
    {
      name: "Nattapong P. (Frontend Dev)",
      email: "nattapong@team.com",
      role: "MEMBER",
      status: "ACTIVE",
    },
    {
      name: "Ploypailin K. (UI/UX Designer)",
      email: "ploy@team.com",
      role: "MEMBER",
      status: "ACTIVE",
    },
    {
      name: "Kornkanok M. (QA Lead)",
      email: "kornkanok@team.com",
      role: "MEMBER",
      status: "ACTIVE",
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        ...u,
        passwordHash,
        tokenVersion: 1,
        failedAttempts: 0,
      },
    });
    createdUsers.push(user);
    console.log(`Created user: ${user.name} (${user.email})`);
  }

  // 2. Create Sample Groups for Self-Organized Teams
  // Group 1: Core Engineering (Apinya, Somchai, Nattapong)
  const group1 = await prisma.group.create({
    data: {
      name: "Core Engineering (ทีมพัฒนาหลัก)",
      code: "ENG-01",
      description: "ทีมพัฒนา Backend, Cloud Infrastructure, และ Frontend",
      createdById: createdUsers[0].id, // Apinya
      members: {
        create: [
          { userId: createdUsers[0].id, role: "OWNER" },
          { userId: createdUsers[1].id, role: "MEMBER" },
          { userId: createdUsers[2].id, role: "MEMBER" },
        ],
      },
    },
  });
  console.log(`Created Group 1: ${group1.name} (Code: ${group1.code})`);

  // Group 2: Product & Design (Ploypailin, Kornkanok, Apinya)
  const group2 = await prisma.group.create({
    data: {
      name: "Product & Design (ทีมออกแบบและทดสอบ)",
      code: "DES-02",
      description: "ทีม UI/UX Design, User Research, และ QA Testing",
      createdById: createdUsers[3].id, // Ploypailin
      members: {
        create: [
          { userId: createdUsers[3].id, role: "OWNER" },
          { userId: createdUsers[4].id, role: "MEMBER" },
          { userId: createdUsers[0].id, role: "MEMBER" }, // Apinya joins this group too
        ],
      },
    },
  });
  console.log(`Created Group 2: ${group2.name} (Code: ${group2.code})`);

  // Helper for generating dates relative to today
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const getDateOffset = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return formatDate(d);
  };

  // 3. Create Sample Availabilities across different time slots and days
  const sampleAvailabilities = [
    // Today
    {
      userIndex: 0, // Apinya
      date: getDateOffset(0),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 0,
      date: getDateOffset(0),
      timeSlot: "AFTERNOON",
      status: "BUSY",
      reason: "ติดประชุม Stakeholders Sprint Review (13:30 - 15:30)",
    },
    {
      userIndex: 1, // Somchai
      date: getDateOffset(0),
      timeSlot: "ALL_DAY",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 2, // Nattapong
      date: getDateOffset(0),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 2,
      date: getDateOffset(0),
      timeSlot: "AFTERNOON",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 3, // Ploypailin
      date: getDateOffset(0),
      timeSlot: "AFTERNOON",
      status: "BUSY",
      reason: "ทำ User Research Interview กับลูกค้านอกสถานที่",
    },
    {
      userIndex: 4, // Kornkanok
      date: getDateOffset(0),
      timeSlot: "ALL_DAY",
      status: "AVAILABLE",
      reason: null,
    },

    // Tomorrow (offset +1)
    {
      userIndex: 0,
      date: getDateOffset(1),
      timeSlot: "ALL_DAY",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 1,
      date: getDateOffset(1),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 1,
      date: getDateOffset(1),
      timeSlot: "AFTERNOON",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 2,
      date: getDateOffset(1),
      timeSlot: "ALL_DAY",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 3,
      date: getDateOffset(1),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 4,
      date: getDateOffset(1),
      timeSlot: "ALL_DAY",
      status: "AVAILABLE",
      reason: null,
    },

    // Day after tomorrow (offset +2)
    {
      userIndex: 0,
      date: getDateOffset(2),
      timeSlot: "MORNING",
      status: "BUSY",
      reason: "พบทันตแพทย์ตามนัด",
    },
    {
      userIndex: 1,
      date: getDateOffset(2),
      timeSlot: "MORNING",
      status: "BUSY",
      reason: "Focus Time: ออกแบบ Database Migration",
    },
    {
      userIndex: 2,
      date: getDateOffset(2),
      timeSlot: "AFTERNOON",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 3,
      date: getDateOffset(2),
      timeSlot: "AFTERNOON",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 4,
      date: getDateOffset(2),
      timeSlot: "EVENING",
      status: "BUSY",
      reason: "ติดเรียนคอร์ส Automation Test",
    },

    // Best Meeting Day candidate (offset +3: all 5 available!)
    {
      userIndex: 0,
      date: getDateOffset(3),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 1,
      date: getDateOffset(3),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 2,
      date: getDateOffset(3),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 3,
      date: getDateOffset(3),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 4,
      date: getDateOffset(3),
      timeSlot: "MORNING",
      status: "AVAILABLE",
      reason: null,
    },

    // Next week entries
    {
      userIndex: 0,
      date: getDateOffset(5),
      timeSlot: "ALL_DAY",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 1,
      date: getDateOffset(5),
      timeSlot: "AFTERNOON",
      status: "AVAILABLE",
      reason: null,
    },
    {
      userIndex: 2,
      date: getDateOffset(5),
      timeSlot: "EVENING",
      status: "BUSY",
      reason: "ติดธุระส่วนตัว",
    },
  ];

  for (const item of sampleAvailabilities) {
    const user = createdUsers[item.userIndex];
    await prisma.availability.create({
      data: {
        userId: user.id,
        date: item.date,
        timeSlot: item.timeSlot,
        status: item.status,
        reason: item.reason,
      },
    });
  }

  console.log(`Seeded ${sampleAvailabilities.length} availability records.`);
  console.log(`Default login password for all seeded users: ${defaultPassword}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
