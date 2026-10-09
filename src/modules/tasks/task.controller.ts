import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { createTaskSchema, updateTaskSchema } from "./task.schema.js";
import { createTask, deleteTask, getTaskById, getTasks, updateTask } from "./task.service.js";

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

export const getOne = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  const task = await getTaskById(
    taskId,
    req.user!.userId
  );

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: task,
  });
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  const data = updateTaskSchema.parse(req.body);

  const task = await updateTask(
    taskId,
    req.user!.userId,
    data
  );

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: task,
  });
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }
  
  const deleted = await deleteTask(
    taskId,
    req.user!.userId
  );

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
};