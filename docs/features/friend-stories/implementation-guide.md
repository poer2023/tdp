# 朋友故事功能 - 详细实施指南

> 本文档提供从零开始实施"朋友故事页面"功能的详细步骤，包含完整代码示例和验证方法。

## 📋 目录

- [准备工作](#准备工作)
- [Phase 1: 数据库和后端基础](#phase-1-数据库和后端基础)
- [Phase 2: 认证和中间件](#phase-2-认证和中间件)
- [Phase 3: 前端页面开发](#phase-3-前端页面开发)
- [Phase 4: 管理后台扩展](#phase-4-管理后台扩展)
- [Phase 5: 测试和优化](#phase-5-测试和优化)
- [常见问题](#常见问题)

---

## 准备工作

### 环境要求

- ✅ Node.js >= 22.0.0
- ✅ PostgreSQL 数据库运行中
- ✅ 项目已安装所有依赖

### 安装额外依赖

```bash
# 安装 bcrypt（密码加密）
npm install bcrypt
npm install -D @types/bcrypt

# 安装 jsonwebtoken（JWT）
npm install jsonwebtoken
npm install -D @types/jsonwebtoken

# 安装 lru-cache（速率限制）
npm install lru-cache
```

### 配置环境变量

在 `.env.local` 文件中添加：

```bash
# 生成随机密钥
FRIEND_JWT_SECRET=$(openssl rand -base64 32)
```

或手动生成：

```bash
# 运行命令生成密钥
openssl rand -base64 32

# 将输出复制到 .env.local
FRIEND_JWT_SECRET=your-generated-secret-key-here
```

---

## Phase 1: 数据库和后端基础

### 步骤 1.1: 更新 Prisma Schema

**文件**: `prisma/schema.prisma`

#### 1.1.1 添加 FriendVisibility 枚举

在文件末尾添加：

```prisma
// === 朋友故事功能：新增枚举 ===
enum FriendVisibility {
  PUBLIC       // 所有朋友可见
  FRIEND_ONLY  // 仅特定朋友可见
  PRIVATE      // 完全私密
}
```

#### 1.1.2 创建 Friend 模型

```prisma
// === 朋友故事功能：Friend 模型 ===
model Friend {
  id           String   @id @default(cuid())
  name         String   // 朋友昵称
  accessToken  String   @unique  // bcrypt 加密的密码
  slug         String   @unique  // URL 标识（如 "alice"）
  avatar       String?  // 头像 URL
  description  String?  // 关系描述
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关联：专属故事
  privateMoments Moment[] @relation("FriendPrivateMoments")

  // 索引
  @@index([slug])
  @@index([accessToken])
}
```

#### 1.1.3 扩展 Moment 模型

找到现有的 `model Moment`，在其中添加新字段：

```prisma
model Moment {
  // ... 现有字段保持不变 ...

  // === 新增字段 ===
  friendVisibility  FriendVisibility @default(PUBLIC)
  friendId          String?
  happenedAt        DateTime?  // 故事实际发生时间

  // === 新增关系 ===
  friend Friend? @relation("FriendPrivateMoments", fields: [friendId], references: [id])

  // === 新增索引 ===
  @@index([friendVisibility, friendId])
  @@index([happenedAt])
}
```

#### 1.1.4 验证 Schema

```bash
# 验证语法
npx prisma format

# 检查是否有错误
npx prisma validate
```

### 步骤 1.2: 运行数据库迁移

```bash
# 创建并应用迁移
npx prisma migrate dev --name add_friend_stories

# 预期输出：
# ✔ Generated Prisma Client
# ✔ Applied migration 20250115xxxxxx_add_friend_stories
```

#### 1.2.1 验证迁移成功

```bash
# 检查数据库表
npx prisma studio

# 在浏览器中验证：
# 1. Friend 表已创建
# 2. Moment 表有新字段：friendVisibility, friendId, happenedAt
```

### 步骤 1.3: 创建朋友管理业务逻辑

**文件**: `src/lib/friends.ts`（新建）

```typescript
/**
 * 朋友管理业务逻辑
 */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Friend, Prisma } from "@prisma/client";

// ===== 类型定义 =====

export interface CreateFriendInput {
  name: string;
  slug: string;
  password: string;
  avatar?: string;
  description?: string;
}

export interface UpdateFriendInput {
  name?: string;
  avatar?: string;
  description?: string;
}

// ===== 朋友 CRUD =====

/**
 * 创建朋友
 */
export async function createFriend(input: CreateFriendInput): Promise<Friend> {
  // 验证 slug 唯一性
  const existing = await prisma.friend.findUnique({
    where: { slug: input.slug },
  });

  if (existing) {
    throw new Error(`Slug "${input.slug}" 已被使用`);
  }

  // 加密密码（cost=12）
  const hashedPassword = await bcrypt.hash(input.password, 12);

  // 创建朋友
  const friend = await prisma.friend.create({
    data: {
      name: input.name,
      slug: input.slug,
      accessToken: hashedPassword,
      avatar: input.avatar,
      description: input.description,
    },
  });

  return friend;
}

/**
 * 根据 slug 获取朋友信息
 */
export async function getFriendBySlug(slug: string): Promise<Friend | null> {
  return await prisma.friend.findUnique({
    where: { slug },
  });
}

/**
 * 根据 ID 获取朋友信息
 */
export async function getFriendById(id: string): Promise<Friend | null> {
  return await prisma.friend.findUnique({
    where: { id },
  });
}

/**
 * 获取所有朋友列表
 */
export async function listFriends(): Promise<Friend[]> {
  return await prisma.friend.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 更新朋友信息
 */
export async function updateFriend(id: string, input: UpdateFriendInput): Promise<Friend> {
  return await prisma.friend.update({
    where: { id },
    data: input,
  });
}

/**
 * 更新朋友密码
 */
export async function updateFriendPassword(id: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.friend.update({
    where: { id },
    data: { accessToken: hashedPassword },
  });
}

/**
 * 删除朋友（硬删除）
 */
export async function deleteFriend(id: string): Promise<void> {
  // 先删除相关的专属故事（设置 friendId 为 NULL）
  await prisma.moment.updateMany({
    where: { friendId: id },
    data: { friendId: null },
  });

  // 删除朋友
  await prisma.friend.delete({
    where: { id },
  });
}

// ===== 密码验证 =====

/**
 * 验证朋友密码
 */
export async function verifyFriendPassword(
  slug: string,
  password: string
): Promise<{ success: boolean; friend?: Friend }> {
  // 查找朋友
  const friend = await prisma.friend.findUnique({
    where: { slug },
  });

  if (!friend) {
    return { success: false };
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, friend.accessToken);

  if (!isValid) {
    return { success: false };
  }

  return { success: true, friend };
}

// ===== 朋友故事查询 =====

/**
 * 获取朋友可见的故事列表
 */
export async function getFriendMoments(
  friendId: string,
  options: {
    limit?: number;
    cursor?: string;
    lang?: string;
  } = {}
) {
  const { limit = 20, cursor, lang } = options;

  const moments = await prisma.moment.findMany({
    where: {
      // 公共故事或专属故事
      OR: [{ friendVisibility: "PUBLIC" }, { friendVisibility: "FRIEND_ONLY", friendId }],
      // 已发布且未删除
      status: "PUBLISHED",
      deletedAt: null,
      // 语言筛选
      ...(lang ? { lang } : {}),
    },
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
    orderBy: [
      { happenedAt: "desc" }, // 优先按故事发生时间排序
      { createdAt: "desc" }, // 其次按创建时间
    ],
    take: limit + 1, // 多取一条判断是否还有更多
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  // 判断是否还有更多
  const hasMore = moments.length > limit;
  const result = hasMore ? moments.slice(0, limit) : moments;

  return {
    moments: result,
    nextCursor: hasMore ? result[result.length - 1].id : null,
    hasMore,
  };
}

/**
 * 生成随机密码
 */
export function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}
```

#### 1.3.1 验证业务逻辑

创建测试文件 `src/lib/__tests__/friends.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createFriend, verifyFriendPassword, generateRandomPassword } from "../friends";
import { prisma } from "../prisma";

describe("朋友管理功能", () => {
  beforeEach(async () => {
    // 清理测试数据
    await prisma.friend.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
  });

  it("应该成功创建朋友", async () => {
    const friend = await createFriend({
      name: "测试朋友",
      slug: "test-alice",
      password: "password123",
      description: "测试用户",
    });

    expect(friend.name).toBe("测试朋友");
    expect(friend.slug).toBe("test-alice");
    expect(friend.accessToken).not.toBe("password123"); // 已加密
  });

  it("应该正确验证密码", async () => {
    await createFriend({
      name: "测试朋友",
      slug: "test-bob",
      password: "correctpass",
    });

    // 正确密码
    const valid = await verifyFriendPassword("test-bob", "correctpass");
    expect(valid.success).toBe(true);
    expect(valid.friend).toBeDefined();

    // 错误密码
    const invalid = await verifyFriendPassword("test-bob", "wrongpass");
    expect(invalid.success).toBe(false);
  });

  it("应该生成随机密码", () => {
    const password = generateRandomPassword(16);
    expect(password).toHaveLength(16);
    expect(/^[A-Za-z0-9]+$/.test(password)).toBe(true);
  });
});
```

运行测试：

```bash
npm test -- friends.test.ts
```

### 步骤 1.4: 创建 JWT 认证辅助函数

**文件**: `src/lib/friend-auth.ts`（新建）

```typescript
/**
 * 朋友认证 JWT 辅助函数
 */
import jwt from "jsonwebtoken";
import { Friend } from "@prisma/client";

// JWT 密钥（从环境变量读取）
const JWT_SECRET = process.env.FRIEND_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("缺少环境变量: FRIEND_JWT_SECRET");
}

// ===== 类型定义 =====

export interface FriendJWTPayload {
  friendId: string;
  slug: string;
  iat: number;
  exp: number;
}

// ===== Cookie 配置 =====

export const FRIEND_COOKIE_CONFIG = {
  name: "friendAuth",
  maxAge: 30 * 24 * 60 * 60, // 30 天（秒）
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/m/friends",
};

// ===== JWT 操作 =====

/**
 * 生成朋友访问 Token
 */
export function generateFriendToken(friend: Friend): string {
  const now = Math.floor(Date.now() / 1000);

  const payload: Omit<FriendJWTPayload, "iat" | "exp"> = {
    friendId: friend.id,
    slug: friend.slug,
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "30d", // 30 天
  });
}

/**
 * 验证朋友访问 Token
 */
export function verifyFriendToken(token: string): FriendJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as FriendJWTPayload;

    return decoded;
  } catch (error) {
    // Token 无效或过期
    return null;
  }
}

/**
 * 从 Token 中提取 friendId（不验证签名）
 * 仅用于日志等非安全场景
 */
export function decodeFriendToken(token: string): FriendJWTPayload | null {
  try {
    return jwt.decode(token) as FriendJWTPayload;
  } catch {
    return null;
  }
}
```

#### 1.4.1 验证 JWT 功能

创建测试文件 `src/lib/__tests__/friend-auth.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import { generateFriendToken, verifyFriendToken } from "../friend-auth";
import { Friend } from "@prisma/client";

describe("朋友认证 JWT", () => {
  const mockFriend: Friend = {
    id: "cm1test123",
    name: "Alice",
    slug: "alice",
    accessToken: "hashed",
    avatar: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("应该生成有效的 JWT Token", () => {
    const token = generateFriendToken(mockFriend);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT 格式
  });

  it("应该验证有效的 Token", () => {
    const token = generateFriendToken(mockFriend);
    const payload = verifyFriendToken(token);

    expect(payload).toBeTruthy();
    expect(payload?.friendId).toBe("cm1test123");
    expect(payload?.slug).toBe("alice");
  });

  it("应该拒绝无效的 Token", () => {
    const invalidToken = "invalid.token.here";
    const payload = verifyFriendToken(invalidToken);

    expect(payload).toBeNull();
  });
});
```

运行测试：

```bash
npm test -- friend-auth.test.ts
```

### 步骤 1.5: 创建速率限制器

**文件**: `src/lib/rate-limiter.ts`（新建）

```typescript
/**
 * 速率限制器（防止暴力破解）
 */
import { LRUCache } from "lru-cache";

// 缓存配置
const cache = new LRUCache<string, number>({
  max: 1000, // 最多存储 1000 个 IP
  ttl: 60 * 60 * 1000, // 1 小时 TTL
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * 检查速率限制
 */
export function checkRateLimit(key: string, maxAttempts = 10): RateLimitResult {
  const attempts = cache.get(key) || 0;

  if (attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 小时后重置
    };
  }

  // 增加尝试次数
  cache.set(key, attempts + 1);

  return {
    allowed: true,
    remaining: maxAttempts - attempts - 1,
    resetAt: new Date(Date.now() + 60 * 60 * 1000),
  };
}

/**
 * 重置速率限制（成功登录后）
 */
export function resetRateLimit(key: string): void {
  cache.delete(key);
}

/**
 * 获取剩余尝试次数
 */
export function getRemainingAttempts(key: string, maxAttempts = 10): number {
  const attempts = cache.get(key) || 0;
  return Math.max(0, maxAttempts - attempts);
}
```

### 步骤 1.6: 创建认证 API 接口

**文件**: `src/app/api/friends/auth/route.ts`（新建）

```typescript
/**
 * 朋友密码认证 API
 * POST /api/friends/auth
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyFriendPassword } from "@/lib/friends";
import { generateFriendToken, FRIEND_COOKIE_CONFIG } from "@/lib/friend-auth";
import { checkRateLimit, resetRateLimit, getRemainingAttempts } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { slug, password } = body;

    // 验证参数
    if (!slug || !password) {
      return NextResponse.json({ error: "缺少必需参数" }, { status: 400 });
    }

    // 获取客户端 IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `friend-auth:${ip}:${slug}`;

    // 检查速率限制
    const rateLimit = checkRateLimit(rateLimitKey, 10);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "尝试次数过多，请稍后再试",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // 验证密码
    const result = await verifyFriendPassword(slug, password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "密码错误",
          attemptsRemaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // 密码正确，重置速率限制
    resetRateLimit(rateLimitKey);

    // 生成 JWT Token
    const token = generateFriendToken(result.friend!);

    // 创建响应
    const response = NextResponse.json({
      success: true,
      friend: {
        id: result.friend!.id,
        name: result.friend!.name,
        slug: result.friend!.slug,
        avatar: result.friend!.avatar,
        description: result.friend!.description,
      },
    });

    // 设置 Cookie
    response.cookies.set({
      name: FRIEND_COOKIE_CONFIG.name,
      value: token,
      maxAge: FRIEND_COOKIE_CONFIG.maxAge,
      httpOnly: FRIEND_COOKIE_CONFIG.httpOnly,
      secure: FRIEND_COOKIE_CONFIG.secure,
      sameSite: FRIEND_COOKIE_CONFIG.sameSite,
      path: FRIEND_COOKIE_CONFIG.path,
    });

    return response;
  } catch (error) {
    console.error("朋友认证失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
```

### 步骤 1.7: 创建退出登录 API

**文件**: `src/app/api/friends/logout/route.ts`（新建）

```typescript
/**
 * 朋友退出登录 API
 * POST /api/friends/logout
 */
import { NextResponse } from "next/server";
import { FRIEND_COOKIE_CONFIG } from "@/lib/friend-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // 清除 Cookie（设置 maxAge=0）
  response.cookies.set({
    name: FRIEND_COOKIE_CONFIG.name,
    value: "",
    maxAge: 0,
    path: FRIEND_COOKIE_CONFIG.path,
  });

  return response;
}
```

### 步骤 1.8: 创建获取朋友信息 API

**文件**: `src/app/api/friends/[slug]/route.ts`（新建）

```typescript
/**
 * 获取朋友信息 API
 * GET /api/friends/[slug]
 */
import { NextRequest, NextResponse } from "next/server";
import { getFriendBySlug } from "@/lib/friends";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const friend = await getFriendBySlug(params.slug);

    if (!friend) {
      return NextResponse.json({ error: "朋友不存在" }, { status: 404 });
    }

    // 返回公开信息（不包含密码）
    return NextResponse.json({
      id: friend.id,
      name: friend.name,
      slug: friend.slug,
      avatar: friend.avatar,
      description: friend.description,
      createdAt: friend.createdAt,
    });
  } catch (error) {
    console.error("获取朋友信息失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
```

### Phase 1 验证清单

完成 Phase 1 后，验证以下功能：

```bash
# 1. 数据库迁移成功
npx prisma studio
# 检查 Friend 表和 Moment 表的新字段

# 2. 单元测试通过
npm test

# 3. API 测试（使用 curl 或 Postman）
# 创建测试朋友（通过 Prisma Studio）
# 测试认证 API
curl -X POST http://localhost:3000/api/friends/auth \
  -H "Content-Type: application/json" \
  -d '{"slug":"alice","password":"test123"}'

# 预期响应：
# {
#   "success": true,
#   "friend": { ... }
# }
```

---

## Phase 2: 认证和中间件

### 步骤 2.1: 创建认证辅助函数

**文件**: `src/lib/server/get-friend-from-cookie.ts`（新建）

```typescript
/**
 * 从请求 Cookie 中获取朋友信息
 * 用于服务端组件和 API 路由
 */
import { cookies } from "next/headers";
import { verifyFriendToken, FRIEND_COOKIE_CONFIG } from "@/lib/friend-auth";
import { getFriendById } from "@/lib/friends";
import { Friend } from "@prisma/client";

export async function getFriendFromCookie(): Promise<Friend | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(FRIEND_COOKIE_CONFIG.name)?.value;

  if (!token) {
    return null;
  }

  // 验证 JWT
  const payload = verifyFriendToken(token);

  if (!payload) {
    return null;
  }

  // 从数据库获取朋友信息
  const friend = await getFriendById(payload.friendId);

  return friend;
}

/**
 * 验证朋友是否有权限访问特定 slug
 */
export async function verifyFriendAccess(slug: string): Promise<boolean> {
  const friend = await getFriendFromCookie();

  if (!friend) {
    return false;
  }

  return friend.slug === slug;
}
```

### 步骤 2.2: 创建中间件（可选）

**文件**: `src/middleware.ts`（修改或新建）

如果项目已有 `middleware.ts`，在其中添加朋友认证逻辑：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyFriendToken } from "@/lib/friend-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 仅保护 /[locale]/m/friends/[slug] 路径
  const friendSlugMatch = pathname.match(/^\/([^\/]+)\/m\/friends\/([^\/]+)$/);

  if (friendSlugMatch) {
    const [, locale, slug] = friendSlugMatch;

    // 获取 Cookie
    const token = request.cookies.get("friendAuth")?.value;

    if (!token) {
      // 未登录，重定向到密码页面
      const url = new URL(`/${locale}/m/friends`, request.url);
      url.searchParams.set("redirect", slug);
      return NextResponse.redirect(url);
    }

    // 验证 JWT
    const payload = verifyFriendToken(token);

    if (!payload || payload.slug !== slug) {
      // Token 无效或不匹配
      const url = new URL(`/${locale}/m/friends`, request.url);
      url.searchParams.set("error", "invalid-token");
      return NextResponse.redirect(url);
    }

    // 验证通过，添加 friendId 到请求头（可选）
    const response = NextResponse.next();
    response.headers.set("x-friend-id", payload.friendId);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Phase 2 验证清单

```bash
# 1. 测试 Cookie 认证
# 访问 http://localhost:3000/zh/m/friends/alice
# 应该重定向到 /zh/m/friends

# 2. 手动设置 Cookie 后访问
# 使用浏览器开发工具设置 Cookie
# 再次访问应该成功
```

---

## Phase 3: 前端页面开发

### 步骤 3.1: 创建密码验证页面

**文件**: `src/app/[locale]/m/friends/page.tsx`（新建）

```typescript
/**
 * 朋友密码验证页面
 * /[locale]/m/friends
 */
import { Metadata } from 'next'
import { FriendAuthForm } from '@/components/friends/FriendAuthForm'

export const metadata: Metadata = {
  title: '朋友故事 - 密码验证',
  description: '输入密码查看专属故事'
}

export default function FriendsAuthPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          朋友故事
        </h1>
        <p className="text-gray-600 text-center mb-8">
          输入密码查看为你准备的专属回忆
        </p>

        <FriendAuthForm />
      </div>
    </div>
  )
}
```

### 步骤 3.2: 创建密码验证表单组件

**文件**: `src/components/friends/FriendAuthForm.tsx`（新建）

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function FriendAuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectSlug = searchParams.get('redirect')

  const [slug, setSlug] = useState(redirectSlug || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/friends/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('尝试次数过多，请稍后再试')
        } else if (res.status === 401) {
          setError(data.error || '密码错误')
          setAttemptsRemaining(data.attemptsRemaining ?? null)
        } else {
          setError(data.error || '验证失败')
        }
        return
      }

      // 成功，跳转到朋友故事页面
      router.push(`/zh/m/friends/${slug}`)
      router.refresh()
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          {attemptsRemaining !== null && (
            <p className="text-sm mt-1">
              剩余尝试次数: {attemptsRemaining}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-2">
          朋友标识
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="例如: alice"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          请输入你收到的朋友标识
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '验证中...' : '查看故事'}
      </button>
    </form>
  )
}
```

### 步骤 3.3: 创建朋友故事墙页面

**文件**: `src/app/[locale]/m/friends/[slug]/page.tsx`（新建）

```typescript
/**
 * 朋友故事墙页面
 * /[locale]/m/friends/[slug]
 */
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getFriendBySlug, getFriendMoments } from '@/lib/friends'
import { getFriendFromCookie } from '@/lib/server/get-friend-from-cookie'
import { FriendHeader } from '@/components/friends/FriendHeader'
import { FriendMomentTimeline } from '@/components/friends/FriendMomentTimeline'

interface Props {
  params: { slug: string; locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const friend = await getFriendBySlug(params.slug)

  if (!friend) {
    return { title: '朋友不存在' }
  }

  return {
    title: `${friend.name}的故事墙`,
    description: friend.description || `与${friend.name}的回忆`
  }
}

export default async function FriendStoryPage({ params }: Props) {
  const { slug, locale } = params

  // 验证访问权限
  const currentFriend = await getFriendFromCookie()

  if (!currentFriend || currentFriend.slug !== slug) {
    // 未授权，重定向到密码页面
    redirect(`/${locale}/m/friends?redirect=${slug}`)
  }

  // 获取朋友信息
  const friend = await getFriendBySlug(slug)

  if (!friend) {
    notFound()
  }

  // 获取故事列表
  const { moments, nextCursor, hasMore } = await getFriendMoments(friend.id, {
    limit: 20,
    lang: locale
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <FriendHeader friend={friend} />

      <div className="mt-8">
        <FriendMomentTimeline
          friend={friend}
          initialMoments={moments}
          nextCursor={nextCursor}
          hasMore={hasMore}
        />
      </div>
    </div>
  )
}
```

### 步骤 3.4: 创建朋友头部组件

**文件**: `src/components/friends/FriendHeader.tsx`（新建）

```typescript
/**
 * 朋友信息头部组件
 */
'use client'

import { Friend } from '@prisma/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface FriendHeaderProps {
  friend: Friend
}

export function FriendHeader({ friend }: FriendHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/friends/logout', { method: 'POST' })
      router.push('/zh/m/friends')
      router.refresh()
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {friend.avatar && (
          <Image
            src={friend.avatar}
            alt={friend.name}
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{friend.name}的故事墙</h1>
          {friend.description && (
            <p className="text-gray-600 mt-1">{friend.description}</p>
          )}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border hover:bg-gray-50"
      >
        退出登录
      </button>
    </div>
  )
}
```

### 步骤 3.5: 创建故事时间线组件

**文件**: `src/components/friends/FriendMomentTimeline.tsx`（新建）

由于代码较长，请参考 `code-examples.md` 文档中的完整实现。

关键功能：

- 展示公共故事和专属故事
- 使用不同徽章标识可见性
- 支持无限滚动加载
- 响应式布局

---

## Phase 4: 管理后台扩展

### 步骤 4.1: 创建朋友管理列表页面

**文件**: `src/app/admin/friends/page.tsx`（新建）

```typescript
/**
 * 朋友管理列表页面
 * /admin/friends
 */
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listFriends } from '@/lib/friends'
import { FriendManagementTable } from '@/components/admin/FriendManagementTable'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '朋友管理',
  description: '管理朋友和访问权限'
}

export default async function FriendsManagementPage() {
  const session = await auth()

  // 权限检查
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/login')
  }

  // 获取所有朋友
  const friends = await listFriends()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">朋友管理</h1>
        <Link
          href="/admin/friends/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + 创建朋友
        </Link>
      </div>

      <FriendManagementTable friends={friends} />
    </div>
  )
}
```

### 步骤 4.2: 创建朋友管理表格组件

由于篇幅限制，完整的管理后台组件代码请参考 `code-examples.md`。

### Phase 4 验证清单

```bash
# 1. 访问管理后台
# http://localhost:3000/admin/friends

# 2. 创建测试朋友
# 3. 编辑朋友信息
# 4. 重置密码
# 5. 删除朋友
```

---

## Phase 5: 测试和优化

详细的测试用例和优化策略请参考 `security-testing.md` 文档。

---

## 常见问题

### Q1: 数据库迁移失败

**问题**: `prisma migrate dev` 报错

**解决方案**:

```bash
# 检查数据库连接
npx prisma db pull

# 重置数据库（开发环境）
npx prisma migrate reset

# 重新运行迁移
npx prisma migrate dev
```

### Q2: JWT 验证失败

**问题**: Cookie 存在但验证总是失败

**解决方案**:

```bash
# 检查环境变量
echo $FRIEND_JWT_SECRET

# 重新生成密钥
openssl rand -base64 32 > .env.local

# 重启开发服务器
npm run dev
```

### Q3: 密码验证总是失败

**问题**: 输入正确密码仍然提示错误

**调试步骤**:

```typescript
// 在 src/lib/friends.ts 的 verifyFriendPassword 函数中添加日志
console.log("输入密码:", password);
console.log("存储哈希:", friend.accessToken);
console.log("验证结果:", isValid);
```

### Q4: 中间件重定向循环

**问题**: 访问页面时无限重定向

**解决方案**:
检查 `middleware.ts` 中的路径匹配逻辑，确保密码页面 `/m/friends` 不被保护。

---

## 下一步

完成实施后，建议：

1. **性能测试**: 使用 Lighthouse 测试页面性能
2. **安全审计**: 运行安全测试用例
3. **用户测试**: 邀请朋友测试访问流程
4. **监控设置**: 配置访问日志和错误监控

详细的测试指南请参考 `security-testing.md`。
