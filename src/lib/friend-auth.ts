import type { Friend } from "@prisma/client";
import jwt, { type Secret } from "jsonwebtoken";

function getJWTSecret(): Secret {
  const rawSecret = process.env.FRIEND_JWT_SECRET;
  if (!rawSecret) {
    throw new Error("缺少环境变量: FRIEND_JWT_SECRET");
  }
  return rawSecret;
}

export interface FriendJWTPayload {
  friendId: string;
  iat: number;
  exp: number;
}

export const FRIEND_COOKIE_CONFIG = {
  name: "friendAuth",
  maxAge: 30 * 24 * 60 * 60,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function generateFriendToken(friend: Friend): string {
  return jwt.sign(
    {
      friendId: friend.id,
    },
    getJWTSecret(),
    {
      algorithm: "HS256",
      expiresIn: "30d",
    }
  );
}

export function verifyFriendToken(token: string): FriendJWTPayload | null {
  try {
    const payload = jwt.verify(token, getJWTSecret(), {
      algorithms: ["HS256"],
    });

    if (!payload || typeof payload === "string") {
      return null;
    }

    if (typeof (payload as Record<string, unknown>).friendId !== "string") {
      return null;
    }

    return payload as FriendJWTPayload;
  } catch (error) {
    console.error("朋友 Token 验证失败", error);
    return null;
  }
}

export function decodeFriendToken(token: string): FriendJWTPayload | null {
  try {
    return jwt.decode(token) as FriendJWTPayload;
  } catch (error) {
    console.error("朋友 Token 解码失败", error);
    return null;
  }
}
