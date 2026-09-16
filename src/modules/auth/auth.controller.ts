import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const user = await registerUser(data);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const result = await loginUser(data);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      userId: req.user!.userId,
      role: req.user!.role,
    },
  });
};
