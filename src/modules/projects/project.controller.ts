import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { createProjectSchema } from "./project.schema.js";
import { createProject, getProjectById, getProjects } from "./project.service.js";

export const create = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = createProjectSchema.parse(req.body);

  const project = await createProject(
    data,
    req.user!.userId
  );

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
};

export const getAll = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const projects = await getProjects(req.user!.userId);

  res.status(200).json({
    success: true,
    data: projects,
  });
};

export const getOne = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const projectId = Number(req.params.id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID",
    });
  }

  const project = await getProjectById(
    projectId,
    req.user!.userId
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: project,
  });
};
