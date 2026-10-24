
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

describe("Task list integration tests", () => {
  const suffix = randomUUID();
  const email = `task-list-${suffix}@example.com`;
  const password = "TestPassword123!";

  let projectId: number | undefined;

  afterAll(async () => {
    if (projectId !== undefined) {
      await prisma.task.deleteMany({ where: { projectId } });
      await prisma.project.deleteMany({ where: { id: projectId } });
    }

    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("supports pagination, filtering, sorting, and validation", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ name: "Task Tester", email, password });

    expect(register.status).toBe(201);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(login.status).toBe(200);

    const token = login.body.data.accessToken as string;

    const project = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Task List Project" });

    expect(project.status).toBe(201);
    projectId = project.body.data.id;

    for (const task of [
      { title: "High Priority Task", priority: "HIGH" },
      { title: "Low Priority Task", priority: "LOW" },
      { title: "Medium Priority Task", priority: "MEDIUM" },
    ]) {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...task, projectId });

      expect(response.status).toBe(201);
    }

    const allTasks = await request(app)
      .get("/api/tasks?limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(allTasks.status).toBe(200);
    expect(allTasks.body.success).toBe(true);
    expect(allTasks.body.data).toHaveLength(3);

    const page1 = await request(app)
      .get("/api/tasks?page=1&limit=1")
      .set("Authorization", `Bearer ${token}`);

    const page2 = await request(app)
      .get("/api/tasks?page=2&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.data).toHaveLength(1);
    expect(page2.body.data).toHaveLength(1);
    expect(page1.body.data[0].id).not.toBe(page2.body.data[0].id);

    const highPriority = await request(app)
      .get("/api/tasks?priority=HIGH")
      .set("Authorization", `Bearer ${token}`);

    expect(highPriority.status).toBe(200);
    expect(highPriority.body.data.length).toBeGreaterThan(0);
    expect(
      highPriority.body.data.every(
        (task: { priority: string }) => task.priority === "HIGH",
      ),
    ).toBe(true);

    const invalidFilter = await request(app)
      .get("/api/tasks?priority=INVALID")
      .set("Authorization", `Bearer ${token}`);

    expect(invalidFilter.status).toBe(400);
  });
});
