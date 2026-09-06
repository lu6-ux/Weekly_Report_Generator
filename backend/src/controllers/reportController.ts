import { Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { reportSchema } from "../validation/schemas";
import { HttpError, sendError } from "../utils/errors";
const basicUser = { id: true, name: true, email: true } as const;
export const reportInclude = {
  project: true,
  user: { select: basicUser },
  tasks: true,
  blockers: true,
  achievements: true,
  workHours: true,
  reviews: {
    include: { reviewer: { select: basicUser } },
    orderBy: { createdAt: "desc" },
  },
  versions: {
    select: {
      id: true,
      versionNo: true,
      createdAt: true,
      reviews: {
        include: { reviewer: { select: basicUser } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.ReportInclude;
const versionInclude = {
  reviews: { include: { reviewer: { select: basicUser } } },
} satisfies Prisma.ReportVersionInclude;
const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};
function user(req: AuthRequest) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  return req.user;
}
function access(
  req: AuthRequest,
  report: { userId: string } | null,
  ownerOnly = false,
) {
  if (!report) throw new HttpError(404, "Report not found");
  const current = user(req);
  if (
    report.userId !== current.userId &&
    (ownerOnly || !["MANAGER", "ADMIN"].includes(current.role))
  )
    throw new HttpError(403, "You can only access your own reports");
}
function editable(status: string) {
  if (!["DRAFT", "NEEDS_CORRECTION"].includes(status))
    throw new HttpError(
      400,
      "Only draft or correction-needed reports can be edited or submitted",
    );
}
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = user(req);
    if (currentUser.role !== "MEMBER") {
      throw new HttpError(403, "Only team members can create reports");
    }
    const { tasks, blockers, achievements, workHours, ...fields } =
      reportSchema.parse(req.body);
    if (!(await prisma.project.findUnique({ where: { id: fields.projectId } })))
      throw new HttpError(404, "Project not found");
    const report = await prisma.report.create({
      data: {
        ...fields,
        weekStart: new Date(fields.weekStart),
        weekEnd: new Date(fields.weekEnd),
        userId: user(req).userId,
        tasks: { create: tasks },
        blockers: { create: blockers },
        achievements: { create: achievements },
        workHours: { create: workHours },
      },
      include: reportInclude,
    });
    return res
      .status(201)
      .json({ message: "Report created successfully", report });
  } catch (error) {
    return sendError(res, error);
  }
};
export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = user(req);
    if (currentUser.role !== "MEMBER") {
      throw new HttpError(403, "Only team members can edit their own reports");
    }
    const id = String(req.params.id);
    const report = await prisma.$transaction(async (tx) => {
      const existing = await tx.report.findUnique({
        where: { id },
        include: reportInclude,
      });
      access(req, existing, true);
      editable(existing!.status);
      // Preserve omitted fields for compatibility with the original basic-field PUT API.
      const input = reportSchema.parse({
        ...existing,
        tasks: existing!.tasks.map((t) => ({
          ...t,
          plannedHours: t.plannedHours ?? 0,
          actualHours: t.actualHours ?? 0,
        })),
        weekStart: existing!.weekStart.toISOString().slice(0, 10),
        weekEnd: existing!.weekEnd.toISOString().slice(0, 10),
        ...req.body,
      });
      const { tasks, blockers, achievements, workHours, ...fields } = input;
      if (!(await tx.project.findUnique({ where: { id: fields.projectId } })))
        throw new HttpError(404, "Project not found");
      await tx.reportTask.deleteMany({ where: { reportId: id } });
      await tx.blocker.deleteMany({ where: { reportId: id } });
      await tx.achievement.deleteMany({ where: { reportId: id } });
      await tx.workHour.deleteMany({ where: { reportId: id } });
      return tx.report.update({
        where: { id },
        data: {
          ...fields,
          weekStart: new Date(fields.weekStart),
          weekEnd: new Date(fields.weekEnd),
          tasks: { create: tasks },
          blockers: { create: blockers },
          achievements: { create: achievements },
          workHours: { create: workHours },
        },
        include: reportInclude,
      });
    }, transactionOptions);
    return res.json({ message: "Report updated successfully", report });
  } catch (error) {
    return sendError(res, error);
  }
};
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    return res.json({
      reports: await prisma.report.findMany({
        where: { userId: user(req).userId },
        include: reportInclude,
        orderBy: { createdAt: "desc" },
      }),
    });
  } catch (error) {
    return sendError(res, error);
  }
};
export const getAllReports = async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      reports: await prisma.report.findMany({
        include: reportInclude,
        orderBy: { createdAt: "desc" },
      }),
    });
  } catch (error) {
    return sendError(res, error);
  }
};
export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: String(req.params.id) },
      include: {
        ...reportInclude,
        versions: { include: versionInclude, orderBy: { versionNo: "desc" } },
      },
    });
    access(req, report);
    return res.json({ report });
  } catch (error) {
    return sendError(res, error);
  }
};
export const getVersions = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    access(req, await prisma.report.findUnique({ where: { id } }));
    return res.json({
      versions: await prisma.reportVersion.findMany({
        where: { reportId: id },
        include: versionInclude,
        orderBy: { versionNo: "desc" },
      }),
    });
  } catch (error) {
    return sendError(res, error);
  }
};
export const submitReport = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = user(req);
    if (currentUser.role !== "MEMBER") {
      throw new HttpError(403, "Only team members can submit their own reports");
    }
    const id = String(req.params.id);
    const report = await prisma.$transaction(async (tx) => {
      const current = await tx.report.findUnique({
        where: { id },
        include: reportInclude,
      });
      access(req, current, true);
      editable(current!.status);
      const latest = await tx.reportVersion.findFirst({
        where: { reportId: id },
        orderBy: { versionNo: "desc" },
      });
      await tx.reportVersion.create({
        data: {
          reportId: id,
          versionNo: (latest?.versionNo ?? 0) + 1,
          snapshot: JSON.parse(JSON.stringify(current)),
        },
      });
      return tx.report.update({
        where: { id },
        data: { status: "SUBMITTED" },
        include: reportInclude,
      });
    }, transactionOptions);
    return res.json({ message: "Report submitted successfully", report });
  } catch (error) {
    return sendError(res, error);
  }
};
function review(action: "APPROVED" | "NEEDS_CORRECTION") {
  return async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = user(req);
      if (!["MANAGER", "ADMIN"].includes(currentUser.role))
        throw new HttpError(403, "Manager access required");
      const { comment } = z
        .object({
          comment:
            action === "NEEDS_CORRECTION"
              ? z.string().trim().min(1, "Correction comment is required")
              : z.string().trim().default(""),
        })
        .parse(req.body ?? {});
      const id = String(req.params.id);
      const report = await prisma.$transaction(async (tx) => {
        const current = await tx.report.findUnique({ where: { id } });
        if (!current) throw new HttpError(404, "Report not found");
        if (current.status !== "SUBMITTED")
          throw new HttpError(400, "Only submitted reports can be reviewed");
        const latest = await tx.reportVersion.findFirst({
          where: { reportId: id },
          orderBy: { versionNo: "desc" },
        });
        await tx.review.create({
          data: {
            reportId: id,
            reviewerId: currentUser.userId,
            reportVersionId: latest?.id ?? null,
            action,
            comment: comment || "Approved.",
          },
        });
        return tx.report.update({
          where: { id },
          data: { status: action },
          include: reportInclude,
        });
      }, transactionOptions);
      return res.json({ message: "Review saved successfully", report });
    } catch (error) {
      return sendError(res, error);
    }
  };
}
export const approveReport = review("APPROVED");
export const requestCorrection = review("NEEDS_CORRECTION");
