import type { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const message =
    err instanceof Error ? err.message : "Internal server error";

  res.status(400).json({
    success: false,
    message,
  });
};