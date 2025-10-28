import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { Friend, Prisma } from "@prisma/client";

export interface CreateFriendInput {
  name: string;
  slug: string;
  password: string;
  avatar?: string | null;
  description?: string | null;
}

export interface UpdateFriendInput {
  name?: string;
  avatar?: string | null;
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
 * 创建朋友并存储密码哈希
 */
export async function createFriend(input: CreateFriendInput): Promise<Friend> {
  const existing = await prisma.friend.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new Error(`Slug "${input.slug}" 已被使用`);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  return prisma.friend.create({
    data: {
      name: input.name,
      slug: input.slug,
      accessToken: hashedPassword,
      avatar: input.avatar,
      description: input.description,
    },
  });
}

/**
 * 根据 slug 获取朋友信息
 */
export function getFriendBySlug(slug: string): Promise<Friend | null> {
  return prisma.friend.findUnique({ where: { slug } });
}

/**
 * 根据 ID 获取朋友信息
 */
export function getFriendById(id: string): Promise<Friend | null> {
  return prisma.friend.findUnique({ where: { id } });
}

/**
 * 列出所有朋友
 */
export function listFriends(): Promise<Friend[]> {
  return prisma.friend.findMany({ orderBy: { createdAt: "desc" } });
}

/**
 * 更新朋友信息
 */
export function updateFriend(id: string, input: UpdateFriendInput): Promise<Friend> {
  return prisma.friend.update({ where: { id }, data: input });
}

/**
 * 更新朋友密码
 */
export async function updateFriendPassword(id: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.friend.update({ where: { id }, data: { accessToken: hashedPassword } });
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
 * 验证朋友密码
 */
export async function verifyFriendPassword(
  slug: string,
  password: string
): Promise<{ success: boolean; friend?: Friend }> {
  const friend = await prisma.friend.findUnique({ where: { slug } });
  if (!friend) {
    return { success: false };
  }
  const isValid = await bcrypt.compare(password, friend.accessToken);
  if (!isValid) {
    return { success: false };
  }
  return { success: true, friend };
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
 * 生成随机密码
 */
export function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}
