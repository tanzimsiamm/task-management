import prisma from "../../lib/prisma.js";
import type { CreateProjectInput } from "./project.schema.js";

export const createProject = async (
  data: CreateProjectInput,
  userId: number
) => {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ownerId: userId,
    },
  });

  return project;
};

export const getProjects = async (userId: number) => {
  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
};

export const getProjectById = async (
  projectId: number,
  userId: number
) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  return project;
};