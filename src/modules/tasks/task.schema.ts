import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  projectId: z.number().int().positive(),
  assigneeId: z.number().int().positive().optional(),
});

export type CreateTaskInput = z.infer<
  typeof createTaskSchema
>;

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z
      .enum(["TODO", "IN_PROGRESS", "DONE"])
      .optional(),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH"])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateTaskInput = z.infer<
  typeof updateTaskSchema
>;