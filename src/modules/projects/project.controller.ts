import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { createProjectSchema } from "./project.schema.js";
import { createProject } from "./project.service.js";

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
