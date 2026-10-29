
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

describe("API validation and HTTP errors", () => {
  const email = `validation-${randomUUID()}@example.com`;
  const password = "TestPassword123!";
  let token: string;

  afterAll(async () => {
    if (token) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (user) {
        await prisma.refreshToken.deleteMany({
          where: { userId: user.id },
        });
        await prisma.task.deleteMany({
          where: { project: { ownerId: user.id } },
        });
        await prisma.project.deleteMany({
          where: { ownerId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    }

    await prisma.$disconnect();
  });

  it("rejects invalid bodies, IDs, unauthenticated requests, and missing resources", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ name: "Validation Tester", email, password });

    expect(register.status).toBe(201);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(login.status).toBe(200);
    token = login.body.data.accessToken;

    const invalidProjectBody = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: " " });

    expect(invalidProjectBody.status).toBe(400);

    const invalidTaskBody = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "A valid title", projectId: -1 });

    expect(invalidTaskBody.status).toBe(400);

    const invalidProjectId = await request(app)
      .get("/api/projects/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(invalidProjectId.status).toBe(400);

    const invalidTaskId = await request(app)
      .get("/api/tasks/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(invalidTaskId.status).toBe(400);

    const unauthenticated = await request(app).get("/api/tasks");

    expect(unauthenticated.status).toBe(401);

    const missingProject = await request(app)
      .get("/api/projects/2147483647")
      .set("Authorization", `Bearer ${token}`);

    expect(missingProject.status).toBe(404);

    const missingTask = await request(app)
      .get("/api/tasks/2147483647")
      .set("Authorization", `Bearer ${token}`);

    expect(missingTask.status).toBe(404);
  });
});
