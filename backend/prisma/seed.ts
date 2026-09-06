import "dotenv/config";
import { PrismaClient, ReportStatus } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
async function main() {
  // Add missing demo accounts; never overwrite an existing user's password or role.
  const accounts = [
    {
      name: "Demo Manager",
      email: "manager@example.com",
      password: "manager123",
      role: "MANAGER" as const,
    },
    {
      name: "Test Member",
      email: "test@example.com",
      password: "password123",
      role: "MEMBER" as const,
    },
    {
      name: "Alex Member",
      email: "alex@example.com",
      password: "password123",
      role: "MEMBER" as const,
    },
    {
      name: "Sam Member",
      email: "sam@example.com",
      password: "password123",
      role: "MEMBER" as const,
    },
  ];
  const users = [];
  for (const account of accounts) {
    users.push(
      await prisma.user.upsert({
        where: { email: account.email },
        update: {},
        create: {
          name: account.name,
          email: account.email,
          role: account.role,
          passwordHash: await bcrypt.hash(account.password, 10),
        },
      }),
    );
  }
  const projects = [];
  for (const name of [
    "Weekly Report System",
    "Customer Portal",
    "Analytics Dashboard",
  ]) {
    projects.push(
      await prisma.project.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name} demonstration project` },
      }),
    );
  }
  const statuses: ReportStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "NEEDS_CORRECTION",
    "APPROVED",
    "SUBMITTED",
    "DRAFT",
  ];
  for (let i = 0; i < statuses.length; i++) {
    const owner = users[1 + (i % 3)]!;
    const project = projects[i % 3]!;
    const weekStart = new Date(Date.UTC(2026, 7, 3 + 7 * Math.floor(i / 3)));
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
    const existing = await prisma.report.findUnique({
      where: {
        userId_weekStart_projectId: {
          userId: owner.id,
          weekStart,
          projectId: project.id,
        },
      },
    });
    if (existing) continue;
    await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          userId: owner.id,
          projectId: project.id,
          weekStart,
          weekEnd,
          nextWeekPlans:
            "Complete integration testing and document the release.",
          notes: "Local demonstration data.",
          tasks: {
            create: [
              {
                taskName: "Build report API",
                priority: "HIGH",
                status: "COMPLETED",
                plannedPercent: 100,
                actualPercent: 100,
                plannedHours: 12,
                actualHours: 10,
                output: "Validated endpoints",
              },
              {
                taskName: "Test dashboard",
                priority: "MEDIUM",
                status: "IN_PROGRESS",
                plannedPercent: 100,
                actualPercent: 60,
                plannedHours: 8,
                actualHours: 5,
                output: "Initial test results",
              },
            ],
          },
          blockers: {
            create: [{ description: "Waiting for stakeholder feedback." }],
          },
          achievements: {
            create: [{ description: "Report submission flow completed." }],
          },
          workHours: {
            create: [
              {
                workType: "DEVELOPMENT",
                hours: 10,
                notes: "API implementation",
              },
              { workType: "TESTING", hours: 5, notes: "Dashboard tests" },
              { workType: "MEETING", hours: 2, notes: "Weekly review" },
            ],
          },
        },
        include: {
          project: true,
          user: { select: { id: true, name: true, email: true } },
          tasks: true,
          blockers: true,
          achievements: true,
          workHours: true,
        },
      });
      const status = statuses[i]!;
      if (status !== "DRAFT") {
        const version = await tx.reportVersion.create({
          data: {
            reportId: report.id,
            versionNo: 1,
            snapshot: JSON.parse(JSON.stringify(report)),
          },
        });
        if (status === "APPROVED" || status === "NEEDS_CORRECTION") {
          await tx.review.create({
            data: {
              reportId: report.id,
              reportVersionId: version.id,
              reviewerId: users[0]!.id,
              action: status,
              comment:
                status === "APPROVED"
                  ? "Approved. Good progress."
                  : "Please clarify the testing hours and remaining work.",
            },
          });
        }
        await tx.report.update({ where: { id: report.id }, data: { status } });
      }
    });
  }
  console.log(
    "Demo seed complete. Existing accounts and reports were preserved.",
  );
}
main()
  .catch(() => {
    console.error("Seed failed. Check database configuration and migrations.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
