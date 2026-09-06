import request from "supertest";
import { randomUUID } from "crypto";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { generateToken } from "../src/utils/jwt";
const run = randomUUID();
let memberId: string,
  otherId: string,
  managerId: string,
  projectId: string,
  reportId: string;
let member: string, other: string, manager: string;
const body = () => ({
  weekStart: "2026-08-03",
  weekEnd: "2026-08-09",
  projectId,
  notes: "Test notes",
  nextWeekPlans: "Next sprint",
  tasks: [
    {
      taskName: "Implement API",
      priority: "HIGH",
      status: "COMPLETED",
      plannedPercent: 100,
      actualPercent: 100,
      plannedHours: 5,
      actualHours: 4,
      output: "Working API",
    },
  ],
  blockers: [{ description: "Waiting on review" }],
  achievements: [{ description: "API complete" }],
  workHours: [{ workType: "DEVELOPMENT", hours: 4, notes: "API work" }],
});
beforeAll(async () => {
  const createUser = (name: string, role: "MEMBER" | "MANAGER") =>
    prisma.user.create({
      data: {
        name,
        email: `${name}-${run}@example.com`,
        passwordHash: "unused-test-hash",
        role,
      },
    });
  memberId = (await createUser("member", "MEMBER")).id;
  otherId = (await createUser("other", "MEMBER")).id;
  managerId = (await createUser("manager", "MANAGER")).id;
  projectId = (
    await prisma.project.create({ data: { name: `integration-${run}` } })
  ).id;
  member = `token=${generateToken(memberId, "MEMBER")}`;
  other = `token=${generateToken(otherId, "MEMBER")}`;
  manager = `token=${generateToken(managerId, "MANAGER")}`;
});
afterAll(async () => {
  // Delete only records created by this test run, including nested records via cascade.
  if (projectId) {
    await prisma.report.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
  }
  await prisma.user.deleteMany({
    where: { email: { endsWith: `${run}@example.com` } },
  });
  await prisma.$disconnect();
});
test("protected route returns 401 without a cookie", async () => {
  await request(app).get("/api/reports/my").expect(401);
});
test("member cannot access manager report list", async () => {
  await request(app).get("/api/reports/all").set("Cookie", member).expect(403);
});
test("manager cannot create a member report", async () => {
  await request(app)
    .post("/api/reports")
    .set("Cookie", manager)
    .send(body())
    .expect(403);
});
test("AI chat is manager-only and handles missing provider configuration", async () => {
  await request(app)
    .post("/api/ai/chat")
    .set("Cookie", member)
    .send({ message: "What did the team work on?" })
    .expect(403);
  await request(app)
    .post("/api/ai/chat")
    .set("Cookie", manager)
    .send({ message: "" })
    .expect(400);

  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await request(app)
      .post("/api/ai/chat")
      .set("Cookie", manager)
      .send({ message: "What did the team work on?" })
      .expect(503)
      .expect(({ body: responseBody }) => {
        expect(responseBody.message).toBe(
          "AI Assistant is temporarily unavailable. Please try again.",
        );
      });
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
test("CORS allows credentialed localhost requests", async () => {
  const r = await request(app)
    .options("/api/reports")
    .set("Origin", "http://localhost:3000")
    .set("Access-Control-Request-Method", "POST")
    .expect(204);
  expect(r.headers["access-control-allow-origin"]).toBe(
    "http://localhost:3000",
  );
  expect(r.headers["access-control-allow-credentials"]).toBe("true");
});
test("create persists every nested collection and excludes password hashes", async () => {
  const r = await request(app)
    .post("/api/reports")
    .set("Cookie", member)
    .send(body())
    .expect(201);
  reportId = r.body.report.id;
  for (const key of ["tasks", "blockers", "achievements", "workHours"])
    expect(r.body.report[key]).toHaveLength(1);
  expect(r.body.report.user.passwordHash).toBeUndefined();
});
test("member cannot edit or view another member's report or versions", async () => {
  await request(app)
    .put(`/api/reports/${reportId}`)
    .set("Cookie", other)
    .send(body())
    .expect(403);
  await request(app)
    .get(`/api/reports/${reportId}`)
    .set("Cookie", other)
    .expect(403);
  await request(app)
    .get(`/api/reports/${reportId}/versions`)
    .set("Cookie", other)
    .expect(403);
});
test("invalid dates, percentages, hours, and enums are rejected", async () => {
  for (const change of [
    { weekEnd: "2026-08-01" },
    { weekStart: "2026-02-30" },
    { tasks: [{ ...body().tasks[0], actualPercent: 101 }] },
    { workHours: [{ workType: "OTHER", hours: -1 }] },
    { tasks: [{ taskName: " ", priority: "INVALID" }] },
  ]) {
    await request(app)
      .put(`/api/reports/${reportId}`)
      .set("Cookie", member)
      .send({ ...body(), ...change })
      .expect(400);
  }
});
test("DRAFT submits with a complete version-one snapshot", async () => {
  const r = await request(app)
    .patch(`/api/reports/${reportId}/submit`)
    .set("Cookie", member)
    .expect(200);
  expect(r.body.report.status).toBe("SUBMITTED");
  const v = await request(app)
    .get(`/api/reports/${reportId}/versions`)
    .set("Cookie", member)
    .expect(200);
  expect(v.body.versions[0].versionNo).toBe(1);
  expect(v.body.versions[0].snapshot.tasks[0].taskName).toBe("Implement API");
});
test("submitted report cannot be edited, resubmitted, or approved by a member", async () => {
  await request(app)
    .put(`/api/reports/${reportId}`)
    .set("Cookie", member)
    .send(body())
    .expect(400);
  await request(app)
    .patch(`/api/reports/${reportId}/submit`)
    .set("Cookie", member)
    .expect(400);
  await request(app)
    .patch(`/api/reports/${reportId}/approve`)
    .set("Cookie", member)
    .send({ comment: "Approve" })
    .expect(403);
});
test("correction requires a comment and links review to version one", async () => {
  await request(app)
    .patch(`/api/reports/${reportId}/request-correction`)
    .set("Cookie", manager)
    .send({ comment: " " })
    .expect(400);
  const r = await request(app)
    .patch(`/api/reports/${reportId}/request-correction`)
    .set("Cookie", manager)
    .send({ comment: "Correct hours" })
    .expect(200);
  expect(r.body.report.status).toBe("NEEDS_CORRECTION");
  expect(r.body.report.reviews[0].reportVersionId).toBeTruthy();
});
test("edit replaces collections, preserves omitted fields, and resubmits version two", async () => {
  const r = await request(app)
    .put(`/api/reports/${reportId}`)
    .set("Cookie", member)
    .send({
      tasks: [{ ...body().tasks[0], actualHours: 6 }],
      blockers: [],
      achievements: [{ description: "Corrected" }],
      workHours: [{ workType: "TESTING", hours: 6 }],
    })
    .expect(200);
  expect(r.body.report.tasks).toHaveLength(1);
  expect(r.body.report.blockers).toHaveLength(0);
  expect(r.body.report.notes).toBe("Test notes");
  await request(app)
    .patch(`/api/reports/${reportId}/submit`)
    .set("Cookie", member)
    .expect(200);
  const v = await request(app)
    .get(`/api/reports/${reportId}/versions`)
    .set("Cookie", manager)
    .expect(200);
  expect(
    v.body.versions.map((x: { versionNo: number }) => x.versionNo),
  ).toEqual([2, 1]);
  expect(v.body.versions[1].snapshot.tasks[0].actualHours).toBe(4);
  expect(v.body.versions[0].snapshot.tasks[0].actualHours).toBe(6);
  expect(v.body.versions[1].reviews[0].comment).toBe("Correct hours");
});
test("manager approves submitted report and cannot edit approved report", async () => {
  const r = await request(app)
    .patch(`/api/reports/${reportId}/approve`)
    .set("Cookie", manager)
    .send({ comment: "Good work" })
    .expect(200);
  expect(r.body.report.status).toBe("APPROVED");
  await request(app)
    .put(`/api/reports/${reportId}`)
    .set("Cookie", member)
    .send(body())
    .expect(400);
  await request(app)
    .patch(`/api/reports/${reportId}/approve`)
    .set("Cookie", manager)
    .expect(400);
  const v = await request(app)
    .get(`/api/reports/${reportId}/versions`)
    .set("Cookie", member)
    .expect(200);
  expect(v.body.versions[0].reviews[0].comment).toBe("Good work");
});
test("public registration ignores elevated roles, login/me/logout work", async () => {
  const email = `registered-${run}@example.com`;
  const r = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Public member",
      email,
      password: "password123",
      role: "ADMIN",
    })
    .expect(201);
  expect(r.body.user.role).toBe("MEMBER");
  const agent = request.agent(app);
  const login = await agent
    .post("/api/auth/login")
    .send({ email, password: "password123" })
    .expect(200);
  expect(login.headers["set-cookie"][0]).toContain("HttpOnly");
  await agent.get("/api/auth/me").expect(200);
  await agent.post("/api/auth/logout").expect(200);
  await agent.get("/api/auth/me").expect(401);
});
test("project CRUD is manager-only and referenced projects cannot be deleted", async () => {
  await request(app)
    .post("/api/projects")
    .set("Cookie", member)
    .send({ name: "Denied" })
    .expect(403);
  await request(app)
    .delete(`/api/projects/${projectId}`)
    .set("Cookie", manager)
    .expect(409);
  const r = await request(app)
    .post("/api/projects")
    .set("Cookie", manager)
    .send({ name: `crud-${run}` })
    .expect(201);
  try {
    await request(app)
      .put(`/api/projects/${r.body.project.id}`)
      .set("Cookie", manager)
      .send({ name: `updated-${run}` })
      .expect(200);
  } finally {
    await request(app)
      .delete(`/api/projects/${r.body.project.id}`)
      .set("Cookie", manager)
      .expect(200);
  }
});
