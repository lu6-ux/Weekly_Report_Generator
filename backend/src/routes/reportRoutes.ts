import { Router } from "express";

import {
  getReport,
  getVersions,
  createReport,
  getMyReports,
  getAllReports,
  updateReport,
  submitReport,
  approveReport,
  requestCorrection,
} from "../controllers/reportController";

import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();

router.post("/", authenticate, createReport);

router.get("/my", authenticate, getMyReports);

router.get(
  "/all",
  authenticate,
  requireRole("MANAGER", "ADMIN"),
  getAllReports,
);

router.get("/:id/versions", authenticate, getVersions);
router.get("/:id", authenticate, getReport);

router.put("/:id", authenticate, updateReport);

router.patch("/:id/submit", authenticate, submitReport);

router.patch(
  "/:id/approve",
  authenticate,
  requireRole("MANAGER", "ADMIN"),
  approveReport,
);

router.patch(
  "/:id/request-correction",
  authenticate,
  requireRole("MANAGER", "ADMIN"),
  requestCorrection,
);

export default router;
