import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
});

export type CreateProjectInput = z.infer<
  typeof createProjectSchema
>;

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateProjectInput = z.infer<
  typeof updateProjectSchema
>;