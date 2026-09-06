import { z } from "zod";
const hours = z.number().finite().min(0).default(0);
const description = z.object({ description: z.string().trim().min(1) });
export const reportSchema = z
  .object({
    weekStart: z.iso.date(),
    weekEnd: z.iso.date(),
    projectId: z.string().uuid(),
    nextWeekPlans: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tasks: z
      .array(
        z.object({
          taskName: z.string().trim().min(1),
          priority: z
            .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
            .default("MEDIUM"),
          status: z
            .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"])
            .default("NOT_STARTED"),
          plannedPercent: z.number().int().min(0).max(100).default(0),
          actualPercent: z.number().int().min(0).max(100).default(0),
          plannedHours: hours,
          actualHours: hours,
          output: z.string().nullable().optional(),
        }),
      )
      .default([]),
    blockers: z.array(description).default([]),
    achievements: z.array(description).default([]),
    workHours: z
      .array(
        z.object({
          workType: z.enum([
            "DEVELOPMENT",
            "TESTING",
            "MEETING",
            "RESEARCH",
            "DOCUMENTATION",
            "OTHER",
          ]),
          hours,
          notes: z.string().nullable().optional(),
        }),
      )
      .default([]),
  })
  .refine((data) => data.weekEnd >= data.weekStart, {
    message: "Week end must be on or after week start",
    path: ["weekEnd"],
  });
export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6).max(72),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1).max(100),
});
export const projectSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().max(5000).nullable().optional(),
});
