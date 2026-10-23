import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

describe("Resource authorization", () => {
  const suffix = randomUUID();
  const emailA = `owner-${suffix}@example.com`;
  const emailB = `other-${suffix}@example.com`;
  const password = "TestPassword123!";

  let projectId: number | undefined;
  let taskId: number | undefined;

  afterAll(async () => {
    if (projectId !== undefined) {
      await prisma.task.deleteMany({
        where: { projectId },
      });

      await prisma.project.deleteMany({
        where: { id: projectId },
      });
    }

    await prisma.user.deleteMany({
      where: { email: { in: [emailA, emailB] } },
    });

    await prisma.$disconnect();
  });

  it("prevents another user from accessing private projects and tasks", async () => {
    const registerA = await request(app)
      .post("/api/auth/register")
      .send({ name: "Owner", email: emailA, password });

    expect(registerA.status).toBe(201);

    const registerB = await request(app)
      .post("/api/auth/register")
      .send({ name: "Other", email: emailB, password });

    expect(registerB.status).toBe(201);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({ email: emailA, password });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({ email: emailB, password });

    expect(loginA.status).toBe(200);
    expect(loginB.status).toBe(200);

    const tokenA = loginA.body.data.accessToken as string;
    const tokenB = loginB.body.data.accessToken as string;

    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Private Project",
        description: "Authorization test",
      });

    expect(projectResponse.status).toBe(201);
    projectId = projectResponse.body.data.id;

    const taskResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Private Task",
        projectId,
      });

    expect(taskResponse.status).toBe(201);
    taskId = taskResponse.body.data.id;

    // User B cannot access User A's project.
    expect(
      (
        await request(app)
          .get(`/api/projects/${projectId}`)
          .set("Authorization", `Bearer ${tokenB}`)
      ).status,
    ).toBe(404);

    expect(
      (
        await request(app)
          .patch(`/api/projects/${projectId}`)
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ name: "Hijacked Project" })
      ).status,
    ).toBe(404);

    expect(
      (
        await request(app)
          .delete(`/api/projects/${projectId}`)
          .set("Authorization", `Bearer ${tokenB}`)
      ).status,
    ).toBe(404);

    // User B cannot access User A's task.
    expect(
      (
        await request(app)
          .get(`/api/tasks/${taskId}`)
          .set("Authorization", `Bearer ${tokenB}`)
      ).status,
    ).toBe(404);

    expect(
      (
        await request(app)
          .patch(`/api/tasks/${taskId}`)
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ title: "Hijacked Task" })
      ).status,
    ).toBe(404);

    expect(
      (
        await request(app)
          .delete(`/api/tasks/${taskId}`)
          .set("Authorization", `Bearer ${tokenB}`)
      ).status,
    ).toBe(404);

    // Owner can still access their own resources.
    expect(
      (
        await request(app)
          .get(`/api/projects/${projectId}`)
          .set("Authorization", `Bearer ${tokenA}`)
      ).status,
    ).toBe(200);

    expect(
      (
        await request(app)
          .get(`/api/tasks/${taskId}`)
          .set("Authorization", `Bearer ${tokenA}`)
      ).status,
    ).toBe(200);
  });
});
