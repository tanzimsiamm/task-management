import prisma from "../../lib/prisma.js";
import type { CreateTaskInput, GetTasksQuery, UpdateTaskInput } from "./task.schema.js";

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

export const getTasks = async (
  userId: number,
  query: GetTasksQuery
) => {
  const { page, limit, status, priority, sortBy, order } = query;

  const where = {
    project: {
      ownerId: userId,
    },
    ...(status !== undefined && { status }),
    ...(priority !== undefined && { priority }),
  };

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTaskById = async (
  taskId: number,
  userId: number
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        ownerId: userId,
      },
    },
  });

  return task;
};

export const updateTask = async (
  taskId: number,
  userId: number,
  data: UpdateTaskInput
) => {
const result = await prisma.task.updateMany({
  where: {
    id: taskId,
    project: {
      ownerId: userId,
    },
  },
  data: {
    ...(data.title !== undefined && {
      title: data.title,
    }),
    ...(data.description !== undefined && {
      description: data.description,
    }),
    ...(data.status !== undefined && {
      status: data.status,
    }),
    ...(data.priority !== undefined && {
      priority: data.priority,
    }),
  },
});

  if (result.count === 0) {
    return null;
  }

  return prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        ownerId: userId,
      },
    },
  });
};

export const deleteTask = async (
  taskId: number,
  userId: number
) => {
  const result = await prisma.task.deleteMany({
    where: {
      id: taskId,
      project: {
        ownerId: userId,
      },
    },
  });

  return result.count > 0;
};

