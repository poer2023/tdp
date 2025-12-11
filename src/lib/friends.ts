import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Friend, Prisma } from "@prisma/client";

export interface CreateFriendInput {
  name: string;
  passphrase: string;
  avatar?: string | null;
  cover?: string | null;
  description?: string | null;
}

export interface UpdateFriendInput {
  name?: string;
  avatar?: string | null;
  cover?: string | null;
  description?: string | null;
}

export interface FriendMomentsOptions {
  limit?: number;
  cursor?: string | null;
  lang?: string | null;
}

type FriendMomentSelect = {
  id: string;
  content: string;
  images: unknown | null;
  friendVisibility: "PUBLIC" | "FRIEND_ONLY" | "PRIVATE";
  happenedAt: Date | null;
  createdAt: Date;
  location: unknown | null;
  tags: string[];
  author: {
    id: string;
    name: string | null;
  };
};

/**
 * 创建朋友并存储口令哈希
 */
export async function createFriend(input: CreateFriendInput): Promise<Friend> {
  const hashedPassphrase = await bcrypt.hash(input.passphrase, 12);

  return prisma.friend.create({
    data: {
      name: input.name,
      accessToken: hashedPassphrase,
      avatar: input.avatar,
      cover: input.cover,
      description: input.description,
    },
  });
}

/**
 * 根据 ID 获取朋友信息
 */
export function getFriendById(id: string): Promise<Friend | null> {
  return prisma.friend.findUnique({ where: { id } });
}

/**
 * 列出所有朋友（包含私密时刻数量统计）
 */
export async function listFriends() {
  const friends = await prisma.friend.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          privateMoments: true,
        },
      },
    },
  });

  return friends;
}

/**
 * 更新朋友信息
 */
export function updateFriend(id: string, input: UpdateFriendInput): Promise<Friend> {
  return prisma.friend.update({ where: { id }, data: input });
}

/**
 * 更新朋友口令
 */
export async function updateFriendPassphrase(id: string, newPassphrase: string): Promise<void> {
  const hashedPassphrase = await bcrypt.hash(newPassphrase, 12);
  await prisma.friend.update({ where: { id }, data: { accessToken: hashedPassphrase } });
}

/**
 * 删除朋友并清理关联故事
 */
export async function deleteFriend(id: string): Promise<void> {
  await prisma.moment.updateMany({
    where: { friendId: id },
    data: { friendId: null },
  });
  await prisma.friend.delete({ where: { id } });
}

/**
 * 验证口令并返回对应的朋友
 */
export async function verifyPassphrase(
  passphrase: string
): Promise<{ success: boolean; friend?: Friend }> {
  const allFriends = await prisma.friend.findMany();

  for (const friend of allFriends) {
    const isValid = await bcrypt.compare(passphrase, friend.accessToken);
    if (isValid) {
      return { success: true, friend };
    }
  }

  return { success: false };
}

/**
 * 获取朋友可见的故事列表
 */
export async function getFriendMoments(
  friendId: string,
  options: FriendMomentsOptions = {}
): Promise<{ moments: FriendMomentSelect[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = options.limit ?? 20;
  const cursor = options.cursor ?? null;
  const where: Prisma.MomentWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
    OR: [{ friendVisibility: "PUBLIC" }, { friendVisibility: "FRIEND_ONLY", friendId }],
  };
  if (options.lang) {
    where.lang = options.lang;
  }

  const result = await prisma.moment.findMany({
    where,
    take: limit + 1,
    orderBy: [{ happenedAt: "desc" }, { createdAt: "desc" }],
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      content: true,
      images: true,
      friendVisibility: true,
      happenedAt: true,
      createdAt: true,
      location: true,
      tags: true,
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const hasMore = result.length > limit;
  const moments = hasMore ? result.slice(0, limit) : result;
  const nextCursor = hasMore ? (moments[moments.length - 1]?.id ?? null) : null;

  return { moments: moments as FriendMomentSelect[], nextCursor, hasMore };
}

/**
 * 生成随机口令
 */
export function generateRandomPassphrase(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let passphrase = "";
  for (let i = 0; i < length; i += 1) {
    passphrase += chars[Math.floor(Math.random() * chars.length)];
  }
  return passphrase;
}
