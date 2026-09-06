import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
import express from "express";
import cors from "cors";

import cookieParser from "cookie-parser";
import prisma from "./config/prisma";
import authRoutes from "./routes/authRoutes";
import { authenticate, AuthRequest } from "./middleware/authMiddleware";

import { requireRole } from "./middleware/roleMiddleware";
import reportRoutes from "./routes/reportRoutes";

import projectRoutes from "./routes/projectRoutes";
import aiRoutes from "./routes/aiRoutes";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    message: "Weekly Report System API is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "success",
    message: "Backend is connected successfully",
  });
});

const PORT = process.env.PORT || 5000;
app.get("/api/db-test", async (_req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.json({
      status: "success",
      message: "Database connected successfully",
      userCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});
app.use("/api/auth", authRoutes);
app.get("/api/protected", authenticate, (req: AuthRequest, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user,
  });
});

app.get(
  "/api/manager-only",
  authenticate,
  requireRole("MANAGER", "ADMIN"),
  (req: AuthRequest, res) => {
    res.json({
      message: "Welcome Manager/Admin",
      user: req.user,
    });
  },
);
app.use("/api/reports", reportRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);
export default app;
