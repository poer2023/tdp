import crypto from "crypto";
import type { Friend } from "@prisma/client";

/**
 * 根据错误口令生成一致的假 Friend ID
 * 同一个错误口令总是生成相同的假 ID
 */
export function generateFakeFriendId(passphrase: string): string {
  const hash = crypto.createHash("sha256").update(passphrase).digest("hex");
  return `fake_${hash.slice(0, 20)}`;
}

/**
 * 生成假 Friend 数据
 */
export function generateFakeFriend(passphrase: string): Friend {
  const fakeId = generateFakeFriendId(passphrase);

  return {
    id: fakeId,
    name: "神秘访客",
    accessToken: "",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mystery",
    description: "这是一个神秘的朋友空间",
    createdAt: new Date(),
    updatedAt: new Date(),
    cover: null,
  };
}

/**
 * 检查是否是假 Friend ID
 */
export function isFakeFriendId(friendId: string): boolean {
  return friendId.startsWith("fake_");
}

/**
 * 生成假 Moments 数据（可选，用于显示假内容）
 */
export function generateFakeMoments() {
  return [
    {
      id: "fake_moment_1",
      content: "今天天气真不错，适合出去走走。",
      images: null,
      friendVisibility: "PUBLIC" as const,
      happenedAt: new Date(Date.now() - 86400000 * 2),
      createdAt: new Date(Date.now() - 86400000 * 2),
      location: null,
      tags: [],
      author: {
        id: "system",
        name: "系统",
      },
    },
    {
      id: "fake_moment_2",
      content: "分享一首喜欢的歌。",
      images: null,
      friendVisibility: "PUBLIC" as const,
      happenedAt: new Date(Date.now() - 86400000 * 5),
      createdAt: new Date(Date.now() - 86400000 * 5),
      location: null,
      tags: [],
      author: {
        id: "system",
        name: "系统",
      },
    },
  ];
}
