import { Router } from "express";
import { chat } from "../controllers/aiController";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();
router.post("/chat", authenticate, requireRole("MANAGER", "ADMIN"), chat);

export default router;