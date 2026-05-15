import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(error);
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
}
