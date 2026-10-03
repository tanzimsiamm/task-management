import prisma from "../../lib/prisma.js";
import type { CreateTaskInput } from "./task.schema.js";

export const createTask = async (data: CreateTaskInput, userId: number) => {
  const project = await prisma.project.findFirst({
    where: {
      id: data.projectId,
      ownerId: userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (data.assigneeId !== undefined) {
    const assignee = await prisma.user.findUnique({
      where: {
        id: data.assigneeId,
      },
    });

    if (!assignee) {
      throw new Error("Assignee not found");
    }
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.priority !== undefined && {
        priority: data.priority,
      }),
      projectId: data.projectId,
      ...(data.assigneeId !== undefined && {
        assigneeId: data.assigneeId,
      }),
    },
  });

  return task;
};

export const getTasks = async (userId: number) => {
  const tasks = await prisma.task.findMany({
    where: {
      project: {
        ownerId: userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tasks;
};