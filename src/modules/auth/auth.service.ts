import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { generateRefreshToken, hashRefreshToken } from "./refresh-token.js";
import prisma from "../../lib/prisma.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function registerUser(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function refreshAccessToken(token: string) {
  const tokenHash = hashRefreshToken(token);

  return prisma.$transaction(
    async (tx) => {
      // Lock the token row until this transaction finishes.
      const rows = await tx.$queryRaw<
        { id: number; userId: number; expiresAt: Date }[]
      >`
        SELECT "id", "userId", "expiresAt"
        FROM "RefreshToken"
        WHERE "tokenHash" = ${tokenHash}
        FOR UPDATE
      `;

      const storedToken = rows[0];

      if (!storedToken || storedToken.expiresAt <= new Date()) {
        if (storedToken) {
          await tx.refreshToken.delete({
            where: { id: storedToken.id },
          });
        }

        throw new AppError(401, "Invalid or expired refresh token");
      }

      const user = await tx.user.findUnique({
        where: { id: storedToken.userId },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new AppError(401, "Invalid refresh token");
      }

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" },
      );

      const newRefreshToken = generateRefreshToken();

      await tx.refreshToken.delete({
        where: { id: storedToken.id },
      });

      await tx.refreshToken.create({
        data: {
          tokenHash: hashRefreshToken(newRefreshToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    },
    {
      isolationLevel: "ReadCommitted",
    },
  );
}

export async function logoutUser(token: string) {
  const tokenHash = hashRefreshToken(token);

  await prisma.refreshToken.deleteMany({
    where: { tokenHash },
  });

  return { message: "Logged out successfully" };
}
