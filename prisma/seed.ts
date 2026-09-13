import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding DevHayat database...");

  // Users
  const parham = await prisma.user.upsert({
    where: { email: "parham@devhayat.local" },
    update: {},
    create: {
      name: "Parham",
      email: "parham@devhayat.local",
      passwordHash: "TEMP_PASSWORD_HASH",
      role: "ADMIN",
    },
  });

  const ali = await prisma.user.upsert({
    where: { email: "ali@devhayat.local" },
    update: {},
    create: {
      name: "Ali",
      email: "ali@devhayat.local",
      passwordHash: "TEMP_PASSWORD_HASH",
      role: "DEVELOPER",
    },
  });

  const sara = await prisma.user.upsert({
    where: { email: "sara@devhayat.local" },
    update: {},
    create: {
      name: "Sara",
      email: "sara@devhayat.local",
      passwordHash: "TEMP_PASSWORD_HASH",
      role: "DESIGNER",
    },
  });

  const reza = await prisma.user.upsert({
    where: { email: "reza@devhayat.local" },
    update: {},
    create: {
      name: "Reza",
      email: "reza@devhayat.local",
      passwordHash: "TEMP_PASSWORD_HASH",
      role: "DEVELOPER",
    },
  });

  // Projects
  const devhayat = await prisma.project.upsert({
    where: { key: "DEV" },
    update: {},
    create: {
      name: "DevHayat",
      key: "DEV",
      description: "Software Project Management Platform",
      status: "ACTIVE",
      progress: 72,
      ownerId: parham.id,
    },
  });

  const atox = await prisma.project.upsert({
    where: { key: "ATOX" },
    update: {},
    create: {
      name: "Atox",
      key: "ATOX",
      description: "Social networking platform",
      status: "ACTIVE",
      progress: 45,
      ownerId: parham.id,
    },
  });

  const harvardAngels = await prisma.project.upsert({
    where: { key: "HA" },
    update: {},
    create: {
      name: "Harvard Angels",
      key: "HA",
      description: "CS50 final project",
      status: "COMPLETED",
      progress: 100,
      ownerId: parham.id,
    },
  });

  const networkMonitor = await prisma.project.upsert({
    where: { key: "NET" },
    update: {},
    create: {
      name: "Network Monitor",
      key: "NET",
      description: "Network monitoring project",
      status: "PLANNING",
      progress: 20,
      ownerId: parham.id,
    },
  });

  // Project Members
  await prisma.projectMember.createMany({
    data: [
      { userId: parham.id, projectId: devhayat.id },
      { userId: ali.id, projectId: devhayat.id },
      { userId: sara.id, projectId: devhayat.id },
      { userId: reza.id, projectId: devhayat.id },

      { userId: parham.id, projectId: atox.id },
      { userId: ali.id, projectId: atox.id },

      { userId: parham.id, projectId: harvardAngels.id },
      { userId: sara.id, projectId: harvardAngels.id },

      { userId: parham.id, projectId: networkMonitor.id },
      { userId: reza.id, projectId: networkMonitor.id },
    ],
    skipDuplicates: true,
  });

  // Sprint
  const sprint = await prisma.sprint.create({
    data: {
      name: "DevHayat Sprint 1",
      goal: "Build the core project management features",
      status: "ACTIVE",
      projectId: devhayat.id,
      creatorId: parham.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Issues
  await prisma.issue.createMany({
    data: [
      {
        title: "Build authentication system",
        description: "Implement login and registration",
        type: "TASK",
        priority: "HIGH",
        status: "IN_PROGRESS",
        projectId: devhayat.id,
        reporterId: parham.id,
        assigneeId: parham.id,
      },
      {
        title: "Fix mobile sidebar",
        description: "Improve responsive navigation",
        type: "BUG",
        priority: "MEDIUM",
        status: "TODO",
        projectId: devhayat.id,
        reporterId: parham.id,
        assigneeId: ali.id,
      },
      {
        title: "Design dashboard",
        description: "Create dashboard interface",
        type: "STORY",
        priority: "HIGH",
        status: "DONE",
        projectId: devhayat.id,
        reporterId: parham.id,
        assigneeId: sara.id,
      },
      {
        title: "Optimize database queries",
        description: "Improve PostgreSQL query performance",
        type: "TASK",
        priority: "MEDIUM",
        status: "TODO",
        projectId: devhayat.id,
        reporterId: parham.id,
        assigneeId: reza.id,
      },
    ],
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Create project dashboard",
        description: "Implement the main dashboard",
        status: "COMPLETED",
        priority: "HIGH",
        projectId: devhayat.id,
        assigneeId: parham.id,
        sprintId: sprint.id,
      },
      {
        title: "Implement Projects page",
        description: "Connect projects page to database",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: devhayat.id,
        assigneeId: parham.id,
        sprintId: sprint.id,
      },
      {
        title: "Create Issues API",
        description: "Build CRUD API for issues",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: devhayat.id,
        assigneeId: ali.id,
        sprintId: sprint.id,
      },
      {
        title: "Design team page",
        description: "Create team management interface",
        status: "COMPLETED",
        priority: "MEDIUM",
        projectId: devhayat.id,
        assigneeId: sara.id,
        sprintId: sprint.id,
      },
      {
        title: "Database optimization",
        description: "Optimize PostgreSQL database",
        status: "TODO",
        priority: "MEDIUM",
        projectId: devhayat.id,
        assigneeId: reza.id,
        sprintId: sprint.id,
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log(`Users: 4`);
  console.log(`Projects: 4`);
  console.log(`Sprint: 1`);
  console.log(`Issues: 4`);
  console.log(`Tasks: 5`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
