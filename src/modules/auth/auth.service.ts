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

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt <= new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
    }

    throw new AppError(401, "Invalid or expired refresh token");
  }

  const newAccessToken = jwt.sign(
    {
      userId: storedToken.user.id,
      role: storedToken.user.role,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);

  await prisma.$transaction([
    prisma.refreshToken.delete({
      where: { id: storedToken.id },
    }),
    prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}


export async function logoutUser(token: string) {
  const tokenHash = hashRefreshToken(token);

  await prisma.refreshToken.deleteMany({
    where: { tokenHash },
  });

  return { message: "Logged out successfully" };
}
