import { Router } from "express";
import { register, login, logout, me } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";
const router = Router();
router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/me", authenticate, me);
export default router;
