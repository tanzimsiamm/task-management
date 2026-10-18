
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

describe("Authentication integration tests", () => {
  const email = `test-${randomUUID()}@example.com`;
  const password = "TestPassword123";

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });

    await prisma.$disconnect();
  });

  it("registers, logs in, rotates refresh tokens, and logs out", async () => {
    // Register
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Integration Test User",
        email,
        password,
      });

    expect(registerResponse.status).toBe(201);

    // Login
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    const initialTokens = loginResponse.body.data;

    expect(initialTokens.accessToken).toBeTruthy();
    expect(initialTokens.refreshToken).toBeTruthy();

    // Refresh: old token should be rotated
    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: initialTokens.refreshToken,
      });

    expect(refreshResponse.status).toBe(200);

    const rotatedTokens = refreshResponse.body.data;

    expect(rotatedTokens.accessToken).toBeTruthy();
    expect(rotatedTokens.refreshToken).toBeTruthy();
    expect(rotatedTokens.refreshToken).not.toBe(
      initialTokens.refreshToken,
    );

    // Old refresh token must no longer work
    const oldTokenResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: initialTokens.refreshToken,
      });

    expect(oldTokenResponse.status).toBe(401);

    // Logout using the rotated refresh token
    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .send({
        refreshToken: rotatedTokens.refreshToken,
      });

    expect(logoutResponse.status).toBe(200);

    // Logged-out refresh token must no longer work
    const revokedTokenResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: rotatedTokens.refreshToken,
      });

    expect(revokedTokenResponse.status).toBe(401);
  });
});
