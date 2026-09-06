import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import { generateToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "../validation/schemas";
import { sendError } from "../utils/errors";
import { AuthRequest } from "../middleware/authMiddleware";
const select = { id: true, name: true, email: true, role: true } as const;
const isProduction = process.env.NODE_ENV === "production";
const sameSite: "none" | "lax" = isProduction ? "none" : "lax";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite,
  path: "/",
};
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: "Invalid email or password" });
    res.cookie("token", generateToken(user.id, user.role), {
      ...cookieOptions,
      maxAge: 86400000,
    });
    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "MEMBER",
      },
      select,
    });
    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (error) {
    return sendError(res, error);
  }
};
export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", cookieOptions);
  return res.json({ message: "Logged out" });
};
export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select,
    });
    if (!user)
      return res.status(401).json({ message: "User no longer exists" });
    return res.json({ user });
  } catch (error) {
    return sendError(res, error);
  }
};
