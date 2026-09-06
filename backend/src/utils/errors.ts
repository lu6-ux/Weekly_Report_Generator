import { Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sendError(res: Response, error: unknown) {
  if (error instanceof HttpError)
    return res.status(error.status).json({ message: error.message });
  if (error instanceof ZodError)
    return res
      .status(400)
      .json({
        message: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return res
        .status(409)
        .json({
          message:
            "This record already exists (report week/project, email, or project name).",
        });
    if (error.code === "P2003")
      return res
        .status(409)
        .json({ message: "The related record is missing or is still in use." });
    if (error.code === "P2025")
      return res.status(404).json({ message: "Record not found" });
    if (error.code === "P2034")
      return res
        .status(409)
        .json({
          message: "Report changed during this request. Refresh and try again.",
        });
  }
  console.error(
    "Request failed",
    error instanceof Error ? error.name : "Unknown error",
  );
  return res
    .status(500)
    .json({ message: "An unexpected server error occurred" });
}
