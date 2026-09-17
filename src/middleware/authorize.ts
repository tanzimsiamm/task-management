import type {
  NextFunction,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "./auth.js";

export const authorize = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden",
      });
    }

    next();
  };
};