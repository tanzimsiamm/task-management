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