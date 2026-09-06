import { Router } from "express";
import prisma from "../config/prisma";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { projectSchema } from "../validation/schemas";
import { sendError } from "../utils/errors";
const router = Router();
router.use(authenticate);
router.get("/", async (_req, res) => {
  try {
    return res.json({
      projects: await prisma.project.findMany({ orderBy: { name: "asc" } }),
    });
  } catch (error) {
    return sendError(res, error);
  }
});
router.use(requireRole("MANAGER", "ADMIN"));
router.post("/", async (req, res) => {
  try {
    return res
      .status(201)
      .json({
        project: await prisma.project.create({
          data: projectSchema.parse(req.body),
        }),
      });
  } catch (error) {
    return sendError(res, error);
  }
});
router.put("/:id", async (req, res) => {
  try {
    return res.json({
      project: await prisma.project.update({
        where: { id: String(req.params.id) },
        data: projectSchema.parse(req.body),
      }),
    });
  } catch (error) {
    return sendError(res, error);
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    if (await prisma.report.count({ where: { projectId: id } }))
      return res
        .status(409)
        .json({ message: "This project has reports and cannot be deleted." });
    await prisma.project.delete({ where: { id } });
    return res.json({ message: "Project deleted" });
  } catch (error) {
    return sendError(res, error);
  }
});
export default router;
