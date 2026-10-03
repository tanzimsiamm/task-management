import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { createTaskSchema } from "./task.schema.js";
import { createTask, getTasks } from "./task.service.js";

export const create = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = createTaskSchema.parse(req.body);

  const task = await createTask(
    data,
    req.user!.userId
  );

  return res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
};

export const getAll = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const tasks = await getTasks(req.user!.userId);

  return res.status(200).json({
    success: true,
    data: tasks,
  });
};