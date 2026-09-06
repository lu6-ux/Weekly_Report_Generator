import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendError } from "../utils/errors";
import { answerTeamQuestion } from "../services/aiService";

const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000, "Message is too long"),
});

export async function chat(req: AuthRequest, res: Response) {
  try {
    const { message } = chatSchema.parse(req.body);
    const answer = await answerTeamQuestion(message);
    return res.json({ answer });
  } catch (error) {
    if (error instanceof Error && error.name === "AI_NOT_CONFIGURED") {
      return res.status(503).json({ message: "AI Assistant is temporarily unavailable. Please try again." });
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      return res.status(504).json({ message: "AI Assistant is temporarily unavailable. Please try again." });
    }
    if (error instanceof z.ZodError) return sendError(res, error);
    console.error("AI assistant request failed", error instanceof Error ? error.message : "Unknown error");
    return res.status(503).json({ message: "AI Assistant is temporarily unavailable. Please try again." });
  }
}