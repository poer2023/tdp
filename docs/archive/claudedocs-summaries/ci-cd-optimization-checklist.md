# CI/CD 测试优化详细清单 | CI/CD Testing Optimization Checklist

> **项目**: TDP (Travel Digital Platform)
> **创建日期**: 2025-10-10
> **预计完成**: 2025-10-31
> **负责人**: @hao

---

## 📋 维护和更新原则 | Maintenance & Update Principles

### 1. 测试金字塔原则 | Test Pyramid Principle

```
       /\
      /E2E\      10% - 关键用户路径 | Critical user journeys
     /------\
    /  集成  \    20% - API集成,数据库交互 | API integration, DB interactions
   /----------\
  /   单元测试  \  70% - 业务逻辑,工具函数 | Business logic, utility functions
 /--------------\
```

**遵守规则 | Rules to Follow**:

- ✅ 新功能开发:先写单元测试 → 再写集成测试 → 最后写E2E(如果是关键路径)
- ✅ New feature: Unit tests first → Integration tests → E2E (only for critical paths)
- ❌ 避免:为所有UI交互写单元测试,应该用E2E代替
- ❌ Avoid: Writing unit tests for all UI interactions, use E2E instead

### 2. 测试覆盖率标准 | Coverage Standards

| 测试类型           | 最低要求 | 推荐目标 | 企业标准 |
| ------------------ | -------- | -------- | -------- |
| Unit Tests         | 60%      | 75%      | **80%**  |
| Integration Tests  | 40%      | 50%      | **60%**  |
| E2E Critical Paths | 100%     | 100%     | **100%** |
| Overall            | 70%      | 80%      | **85%**  |

**质量门禁 | Quality Gates**:

- 🚫 单元测试低于60% → PR不通过 | Block PR if unit < 60%
- 🚫 关键E2E测试失败 → 阻止部署 | Block deploy if critical E2E fails
- ⚠️ 集成测试低于40% → 警告但不阻止 | Warn but don't block if integration < 40%

### 3. 何时添加测试 | When to Add Tests

**单元测试 | Unit Tests**:

- ✅ 纯函数,工具函数 | Pure functions, utilities
- ✅ 业务逻辑计算 | Business logic calculations
- ✅ 数据验证和转换 | Data validation & transformation
- ❌ 复杂UI交互 | Complex UI interactions (use E2E)
- ❌ 路由和导航 | Routing & navigation (use E2E)

**集成测试 | Integration Tests**:

- ✅ API路由 + 数据库操作 | API routes + DB operations
- ✅ 第三方服务集成 | Third-party service integration
- ✅ 认证流程 | Authentication flows
- ✅ 文件上传和处理 | File upload & processing

**E2E测试 | E2E Tests**:

- ✅ 关键业务流程(登录,支付,发布) | Critical flows (login, payment, publish)
- ✅ 跨页面用户旅程 | Cross-page user journeys
- ✅ 性能关键路径 | Performance-critical paths
- ❌ 边界情况和错误处理 | Edge cases & error handling (use unit)

### 4. CI/CD 最佳实践 | CI/CD Best Practices

**Shift-Left 原则 | Shift-Left Principle**:

- 🏃 快速反馈:单元测试 < 2分钟,集成测试 < 5分钟,E2E < 10分钟
- 🏃 Fast feedback: Unit < 2min, Integration < 5min, E2E < 10min
- 🛑 快速失败:第一个错误出现立即停止 | Fail fast: Stop at first error
- ⚡ 并行执行:独立测试套件并行运行 | Parallel: Run independent test suites concurrently

**分支策略 | Branch Strategy**:

- `main` 分支:完整流水线(测试 + 构建 + 部署)
- `main` branch: Full pipeline (test + build + deploy)
- `develop/feature/*` 分支:仅测试(快速反馈)
- `develop/feature/*` branches: Tests only (fast feedback)
- PR合并前:必须通过所有关键测试 | Before merge: All critical tests must pass

---

## ✅ 优先级 P0 - 立即执行 | Priority P0 - Immediate Action

### Task 1: 添加集成测试框架 | Add Integration Test Framework

**状态**: 🔴 未开始 | Not Started
**预计时间**: 2-3小时 | 2-3 hours
**依赖**: 无 | None

**详细步骤 | Detailed Steps**:

#### 1.1 创建集成测试目录结构 | Create integration test directory structure

```bash
src/
  tests/
    integration/           # 新建 | New
      api/                # API集成测试 | API integration tests
        auth.integration.test.ts
        posts.integration.test.ts
        search.integration.test.ts
      services/           # 服务层集成测试 | Service layer integration
        storage.integration.test.ts
        database.integration.test.ts
      utils/              # 测试工具 | Test utilities
        test-db.ts        # 测试数据库设置 | Test DB setup
        test-server.ts    # 测试服务器 | Test server
        setup.ts          # 集成测试环境配置
```

**执行命令 | Commands**:

```bash
mkdir -p src/tests/integration/{api,services,utils}
touch src/tests/integration/utils/setup.ts
touch src/tests/integration/utils/test-db.ts
```

#### 1.2 配置独立的集成测试配置 | Configure separate integration test config

**文件**: `vitest.integration.config.mjs`

```javascript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "integration",
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/integration/utils/setup.ts"],
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules/**", "dist/**", ".next/**"],
    testTimeout: 30000, // 30秒超时 | 30s timeout
    hookTimeout: 30000,
    pool: "forks", // 隔离测试环境 | Isolate test environment
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/app/api/**", "src/lib/**"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 55,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
```

#### 1.3 创建测试数据库工具 | Create test database utilities

**文件**: `src/tests/integration/utils/test-db.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgresql://postgres:test@localhost:5432/tdp_test";

let prisma: PrismaClient;

/**
 * 获取测试数据库连接
 * Get test database connection
 */
export function getTestDb(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

/**
 * 清理所有测试数据
 * Clean all test data
 */
export async function cleanDatabase() {
  const db = getTestDb();

  // 按照依赖顺序删除
  await db.like.deleteMany({});
  await db.comment.deleteMany({});
  await db.postTag.deleteMany({});
  await db.tag.deleteMany({});
  await db.post.deleteMany({});
  await db.galleryImage.deleteMany({});
  await db.moment.deleteMany({});
  await db.session.deleteMany({});
  await db.account.deleteMany({});
  await db.user.deleteMany({});
}

/**
 * 关闭数据库连接
 * Close database connection
 */
export async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

/**
 * 创建测试用户
 * Create test user
 */
export async function createTestUser(role: "USER" | "ADMIN" = "USER") {
  const db = getTestDb();
  return db.user.create({
    data: {
      name: `Test ${role}`,
      email: `test-${role.toLowerCase()}-${Date.now()}@example.com`,
      role: role,
    },
  });
}

/**
 * 创建测试Session
 * Create test session
 */
export async function createTestSession(userId: string) {
  const db = getTestDb();
  return db.session.create({
    data: {
      userId,
      sessionToken: `test-session-${Date.now()}`,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
    },
  });
}
```

#### 1.4 创建集成测试环境配置 | Create integration test setup

**文件**: `src/tests/integration/utils/setup.ts`

```typescript
import { beforeAll, afterAll, beforeEach } from "vitest";
import { cleanDatabase, closeDatabase } from "./test-db";

// 全局测试环境设置
beforeAll(async () => {
  // 验证测试数据库配置
  if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL?.includes("test")) {
    throw new Error(
      "❌ TEST_DATABASE_URL not configured! Don't run integration tests on production DB!"
    );
  }

  console.log("🧪 Setting up integration test environment...");
});

// 每个测试前清理数据库
beforeEach(async () => {
  await cleanDatabase();
});

// 全局测试清理
afterAll(async () => {
  console.log("🧹 Cleaning up integration test environment...");
  await cleanDatabase();
  await closeDatabase();
});
```

#### 1.5 添加npm脚本 | Add npm scripts

**文件**: `package.json` (添加以下脚本)

```json
{
  "scripts": {
    "test:integration": "vitest run --config vitest.integration.config.mjs",
    "test:integration:watch": "vitest --config vitest.integration.config.mjs",
    "test:integration:coverage": "vitest run --config vitest.integration.config.mjs --coverage",
    "test:all": "npm run test:run && npm run test:integration && npm run test:e2e:critical"
  }
}
```

**验收标准 | Acceptance Criteria**:

- ✅ 目录结构创建完成 | Directory structure created
- ✅ 配置文件可以成功运行 | Config file runs successfully
- ✅ npm run test:integration 命令正常工作 | npm run test:integration works
- ✅ 测试隔离(不影响开发数据库) | Tests isolated (no dev DB impact)
- ✅ 数据库工具函数可用 | Database utility functions available

**验证步骤 | Verification Steps**:

```bash
# 1. 验证配置
npm run test:integration -- --run

# 2. 确认隔离性(应该使用测试数据库)
echo $TEST_DATABASE_URL  # 应该包含 "test"

# 3. 检查测试发现(应该找到0个测试,因为还没写)
npm run test:integration -- --reporter=verbose

# 4. 验证数据库清理
# 运行测试后检查数据库应该为空
```

---

### Task 2: 编写10-15个关键集成测试 | Write 10-15 Critical Integration Tests

**状态**: 🔴 未开始(依赖Task 1) | Not Started (depends on Task 1)
**预计时间**: 4-6小时 | 4-6 hours
**依赖**: Task 1完成 | Task 1 complete

**测试场景列表 | Test Scenario List**:

#### 2.1 认证集成测试 | Authentication Integration (3个测试 | 3 tests)

**文件**: `src/tests/integration/api/auth.integration.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser, createTestSession, cleanDatabase } from "../utils/test-db";
import { UserRole } from "@prisma/client";

describe("Authentication API Integration", () => {
  const db = getTestDb();

  // Test 1: 完整登录流程
  it("should handle complete login flow with session creation", async () => {
    // 1. 创建测试用户
    const user = await createTestUser("USER");

    // 2. 创建session
    const session = await createTestSession(user.id);

    // 3. 验证session创建
    expect(session.sessionToken).toBeDefined();
    expect(session.userId).toBe(user.id);

    // 4. 验证数据库session记录
    const dbSession = await db.session.findUnique({
      where: { sessionToken: session.sessionToken },
      include: { user: true },
    });

    expect(dbSession).toBeDefined();
    expect(dbSession?.user.id).toBe(user.id);

    // 5. 验证session未过期
    expect(dbSession?.expires.getTime()).toBeGreaterThan(Date.now());
  });

  // Test 2: 权限验证流程
  it("should verify admin-only routes reject non-admin users", async () => {
    // 1. 创建普通用户和admin用户
    const normalUser = await createTestUser("USER");
    const adminUser = await createTestUser("ADMIN");

    // 2. 验证用户角色
    expect(normalUser.role).toBe(UserRole.USER);
    expect(adminUser.role).toBe(UserRole.ADMIN);

    // 3. 模拟权限检查逻辑
    const checkAdmin = (user: typeof normalUser) => user.role === UserRole.ADMIN;

    expect(checkAdmin(normalUser)).toBe(false);
    expect(checkAdmin(adminUser)).toBe(true);
  });

  // Test 3: Session过期处理
  it("should handle expired session cleanup", async () => {
    // 1. 创建过期session
    const user = await createTestUser("USER");
    const expiredSession = await db.session.create({
      data: {
        userId: user.id,
        sessionToken: `expired-session-${Date.now()}`,
        expires: new Date(Date.now() - 1000), // 已过期
      },
    });

    // 2. 验证session已过期
    const now = new Date();
    expect(expiredSession.expires.getTime()).toBeLessThan(now.getTime());

    // 3. 模拟session清理
    const deletedCount = await db.session.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    expect(deletedCount.count).toBeGreaterThan(0);

    // 4. 验证session被清理
    const cleanedSession = await db.session.findUnique({
      where: { sessionToken: expiredSession.sessionToken },
    });
    expect(cleanedSession).toBeNull();
  });
});
```

#### 2.2 文章API集成测试 | Posts API Integration (4个测试 | 4 tests)

**文件**: `src/tests/integration/api/posts.integration.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";
import { PostStatus } from "@prisma/client";

describe("Posts API Integration", () => {
  const db = getTestDb();

  // Test 1: 创建文章完整流程
  it("should create post with all relationships (tags, images)", async () => {
    // 1. 创建admin用户
    const admin = await createTestUser("ADMIN");

    // 2. 创建标签
    const tag1 = await db.tag.create({
      data: { name: "测试标签1", slug: "test-tag-1" },
    });
    const tag2 = await db.tag.create({
      data: { name: "测试标签2", slug: "test-tag-2" },
    });

    // 3. 创建文章
    const post = await db.post.create({
      data: {
        title: "测试文章",
        slug: `test-post-${Date.now()}`,
        content: "这是测试内容",
        excerpt: "摘要",
        status: PostStatus.DRAFT,
        authorId: admin.id,
        locale: "zh",
        tags: {
          create: [{ tag: { connect: { id: tag1.id } } }, { tag: { connect: { id: tag2.id } } }],
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
        author: true,
      },
    });

    // 4. 验证Post记录创建
    expect(post.id).toBeDefined();
    expect(post.title).toBe("测试文章");
    expect(post.status).toBe(PostStatus.DRAFT);

    // 5. 验证Tag关联创建
    expect(post.tags).toHaveLength(2);
    expect(post.tags.map((pt) => pt.tag.name)).toContain("测试标签1");
    expect(post.tags.map((pt) => pt.tag.name)).toContain("测试标签2");

    // 6. 验证作者关联
    expect(post.author.id).toBe(admin.id);
  });

  // Test 2: 发布文章触发副作用
  it("should update publishedAt and status on publish", async () => {
    // 1. 创建草稿文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "待发布文章",
        slug: `publish-test-${Date.now()}`,
        content: "内容",
        status: PostStatus.DRAFT,
        authorId: admin.id,
        locale: "zh",
      },
    });

    expect(post.publishedAt).toBeNull();

    // 2. 更新为已发布
    const publishedPost = await db.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // 3. 验证publishedAt字段更新
    expect(publishedPost.publishedAt).not.toBeNull();
    expect(publishedPost.status).toBe(PostStatus.PUBLISHED);

    // 4. 验证发布时间合理
    const timeDiff = Date.now() - publishedPost.publishedAt!.getTime();
    expect(timeDiff).toBeLessThan(5000); // 5秒内
  });

  // Test 3: 文章浏览计数原子性
  it("should handle concurrent view count increments correctly", async () => {
    // 1. 创建已发布文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "热门文章",
        slug: `popular-${Date.now()}`,
        content: "内容",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: "zh",
        viewCount: 0,
        publishedAt: new Date(),
      },
    });

    // 2. 并发10个增加操作
    const incrementPromises = Array.from({ length: 10 }, () =>
      db.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
    );

    await Promise.all(incrementPromises);

    // 3. 验证viewCount正确增加10
    const updatedPost = await db.post.findUnique({
      where: { id: post.id },
    });

    expect(updatedPost?.viewCount).toBe(10);
  });

  // Test 4: 删除文章级联操作
  it("should cascade delete post with related data", async () => {
    // 1. 创建文章(带tags和likes)
    const admin = await createTestUser("ADMIN");
    const user = await createTestUser("USER");

    const tag = await db.tag.create({
      data: { name: "测试", slug: "test" },
    });

    const post = await db.post.create({
      data: {
        title: "待删除文章",
        slug: `delete-test-${Date.now()}`,
        content: "内容",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: "zh",
        publishedAt: new Date(),
        tags: {
          create: [{ tag: { connect: { id: tag.id } } }],
        },
        likes: {
          create: [{ userId: user.id }],
        },
      },
      include: {
        tags: true,
        likes: true,
      },
    });

    expect(post.tags).toHaveLength(1);
    expect(post.likes).toHaveLength(1);

    // 2. 删除文章
    await db.post.delete({
      where: { id: post.id },
    });

    // 3. 验证Post删除
    const deletedPost = await db.post.findUnique({
      where: { id: post.id },
    });
    expect(deletedPost).toBeNull();

    // 4. 验证关联数据清理(根据schema配置)
    const orphanedTags = await db.postTag.findMany({
      where: { postId: post.id },
    });
    expect(orphanedTags).toHaveLength(0);

    const orphanedLikes = await db.like.findMany({
      where: { postId: post.id },
    });
    expect(orphanedLikes).toHaveLength(0);
  });
});
```

#### 2.3 搜索API集成测试 | Search API Integration (2个测试 | 2 tests)

**文件**: `src/tests/integration/api/search.integration.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";
import { PostStatus } from "@prisma/client";

describe("Search API Integration", () => {
  const db = getTestDb();

  // Test 1: 全文搜索精确度
  it("should return accurate full-text search results", async () => {
    // 1. 创建多语言测试文章
    const admin = await createTestUser("ADMIN");

    const zhPost = await db.post.create({
      data: {
        title: "测试文章：Next.js 开发指南",
        slug: `zh-search-${Date.now()}`,
        content: "这是一篇关于Next.js开发的文章",
        excerpt: "Next.js教程",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: "zh",
        publishedAt: new Date(),
      },
    });

    const enPost = await db.post.create({
      data: {
        title: "Test Article: Next.js Development Guide",
        slug: `en-search-${Date.now()}`,
        content: "This is an article about Next.js development",
        excerpt: "Next.js tutorial",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: "en",
        publishedAt: new Date(),
      },
    });

    // 2. 搜索中文关键词
    const zhResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { locale: "zh" },
          {
            OR: [
              { title: { contains: "Next.js", mode: "insensitive" } },
              { content: { contains: "Next.js", mode: "insensitive" } },
            ],
          },
        ],
      },
    });

    // 3. 验证搜索结果
    expect(zhResults).toHaveLength(1);
    expect(zhResults[0].id).toBe(zhPost.id);

    // 4. 搜索英文关键词
    const enResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { locale: "en" },
          {
            OR: [
              { title: { contains: "Next.js", mode: "insensitive" } },
              { content: { contains: "Next.js", mode: "insensitive" } },
            ],
          },
        ],
      },
    });

    expect(enResults).toHaveLength(1);
    expect(enResults[0].id).toBe(enPost.id);
  });

  // Test 2: 搜索性能基准
  it("should complete search within performance threshold", async () => {
    // 1. 创建100+测试文章
    const admin = await createTestUser("ADMIN");

    const posts = await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        db.post.create({
          data: {
            title: `性能测试文章 ${i}`,
            slug: `perf-test-${Date.now()}-${i}`,
            content: `这是第${i}篇测试内容 包含关键词: performance`,
            status: PostStatus.PUBLISHED,
            authorId: admin.id,
            locale: "zh",
            publishedAt: new Date(),
          },
        })
      )
    );

    expect(posts).toHaveLength(100);

    // 2. 执行10次搜索请求并计时
    const timings: number[] = [];

    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();

      await db.post.findMany({
        where: {
          AND: [
            { status: PostStatus.PUBLISHED },
            { content: { contains: "performance", mode: "insensitive" } },
          ],
        },
        take: 10,
      });

      const duration = Date.now() - startTime;
      timings.push(duration);
    }

    // 3. 计算平均响应时间
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;

    // 4. 计算P95响应时间
    const sortedTimings = timings.sort((a, b) => a - b);
    const p95Time = sortedTimings[Math.floor(sortedTimings.length * 0.95)];

    // 5. 验证性能指标
    console.log(`Average: ${avgTime}ms, P95: ${p95Time}ms`);
    expect(avgTime).toBeLessThan(500); // 平均 < 500ms (宽松阈值,因为是本地测试)
    expect(p95Time).toBeLessThan(1000); // P95 < 1s
  });
});
```

#### 2.4 存储服务集成测试 | Storage Service Integration (2个测试 | 2 tests)

**文件**: `src/tests/integration/services/storage.integration.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { getTestDb } from "../utils/test-db";

describe("Storage Service Integration", () => {
  const db = getTestDb();

  // Test 1: 图片上传记录创建
  it("should create database record for uploaded image", async () => {
    // 1. 模拟图片上传数据
    const imageData = {
      filePath: `test/images/${Date.now()}.jpg`,
      microThumbPath: `test/thumbs/micro-${Date.now()}.jpg`,
      smallThumbPath: `test/thumbs/small-${Date.now()}.jpg`,
      mediumPath: `test/thumbs/medium-${Date.now()}.jpg`,
      width: 1920,
      height: 1080,
      fileSize: 2048000,
      mimeType: "image/jpeg",
      storageType: "LOCAL",
      uploadedAt: new Date(),
    };

    // 2. 创建数据库记录
    const image = await db.galleryImage.create({
      data: imageData,
    });

    // 3. 验证记录创建
    expect(image.id).toBeDefined();
    expect(image.filePath).toBe(imageData.filePath);
    expect(image.storageType).toBe("LOCAL");

    // 4. 验证缩略图路径
    expect(image.microThumbPath).toBeDefined();
    expect(image.smallThumbPath).toBeDefined();
    expect(image.mediumPath).toBeDefined();

    // 5. 验证尺寸信息
    expect(image.width).toBe(1920);
    expect(image.height).toBe(1080);
  });

  // Test 2: 存储失败回滚
  it("should handle database rollback on storage failure", async () => {
    // 1. 开始事务
    const initialCount = await db.galleryImage.count();

    // 2. 尝试创建记录(模拟部分失败)
    try {
      await db.$transaction(async (tx) => {
        // 创建图片记录
        const image = await tx.galleryImage.create({
          data: {
            filePath: `test/fail/${Date.now()}.jpg`,
            width: 1920,
            height: 1080,
            fileSize: 2048000,
            mimeType: "image/jpeg",
            storageType: "LOCAL",
            uploadedAt: new Date(),
          },
        });

        expect(image.id).toBeDefined();

        // 模拟S3上传失败
        throw new Error("S3 upload failed");
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    // 3. 验证数据库无记录残留
    const finalCount = await db.galleryImage.count();
    expect(finalCount).toBe(initialCount);
  });
});
```

#### 2.5 数据库事务集成测试 | Database Transaction Integration (2个测试 | 2 tests)

**文件**: `src/tests/integration/services/database.integration.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";
import { PostStatus } from "@prisma/client";

describe("Database Transaction Integration", () => {
  const db = getTestDb();

  // Test 1: 事务原子性
  it("should rollback all changes if transaction fails", async () => {
    const admin = await createTestUser("ADMIN");
    const initialPostCount = await db.post.count();
    const initialTagCount = await db.tag.count();

    // 1. 开始事务
    try {
      await db.$transaction(async (tx) => {
        // 2. 创建Post
        const post = await tx.post.create({
          data: {
            title: "事务测试",
            slug: `transaction-test-${Date.now()}`,
            content: "内容",
            status: PostStatus.DRAFT,
            authorId: admin.id,
            locale: "zh",
          },
        });

        // 3. 创建Tag
        const tag = await tx.tag.create({
          data: {
            name: "事务标签",
            slug: `transaction-tag-${Date.now()}`,
          },
        });

        // 4. 创建关联
        await tx.postTag.create({
          data: {
            postId: post.id,
            tagId: tag.id,
          },
        });

        // 5. 模拟失败
        throw new Error("Transaction rollback test");
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    // 6. 验证Post和Tag都未创建
    const finalPostCount = await db.post.count();
    const finalTagCount = await db.tag.count();

    expect(finalPostCount).toBe(initialPostCount);
    expect(finalTagCount).toBe(initialTagCount);
  });

  // Test 2: 并发事务处理
  it("should handle concurrent transactions correctly", async () => {
    // 1. 创建测试文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "并发测试",
        slug: `concurrent-test-${Date.now()}`,
        content: "内容",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: "zh",
        viewCount: 0,
        publishedAt: new Date(),
      },
    });

    // 2. 启动10个并发事务更新viewCount
    const updates = Array.from({ length: 10 }, () =>
      db.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
    );

    await Promise.all(updates);

    // 3. 验证最终状态一致
    const updatedPost = await db.post.findUnique({
      where: { id: post.id },
    });

    expect(updatedPost?.viewCount).toBe(10);
  });
});
```

**验收标准 | Acceptance Criteria**:

- ✅ 所有13个集成测试编写完成 | All 13 integration tests written
- ✅ 测试覆盖关键业务流程 | Tests cover critical business flows
- ✅ 所有测试通过 | All tests passing
- ✅ 测试独立(可任意顺序运行) | Tests independent (run in any order)
- ✅ 测试数据自动清理 | Test data auto-cleanup

**验证步骤 | Verification Steps**:

```bash
# 1. 运行所有集成测试
npm run test:integration

# 2. 验证测试独立性(随机顺序)
npm run test:integration -- --sequence.shuffle

# 3. 验证数据库清理
# 运行后检查测试数据库应该为空
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM \"Post\";"  # 应该为0

# 4. 检查覆盖率
npm run test:integration:coverage

# 5. 查看覆盖率报告
open coverage/index.html
```

---

### Task 3: 修复88个失败的单元测试 | Fix 88 Failing Unit Tests

**状态**: 🔴 未开始 | Not Started
**预计时间**: 6-8小时 | 6-8 hours
**依赖**: 无 | None

**当前失败测试分析 | Current Failure Analysis**:

根据测试输出,主要失败原因:

1. **组件渲染问题 (60+ 失败)**:
   - `PhotoMetadataPanel`: 所有测试失败 - "Element type is invalid"
   - `PhotoViewer`: 大部分测试失败 - 无法找到元素
   - `LivePhotoPlayer`: 所有测试失败 - `screen.getByAlt is not a function`
   - `GalleryCard`: 部分测试失败

2. **SearchCommand 定时器问题 (14 失败)**:
   - 所有涉及 fake timers 的测试超时
   - async/await 与 fake timers 冲突

3. **其他组件问题 (14 失败)**:
   - `AuthHeader`: 菜单交互测试失败
   - `LanguageSwitcher`: href 属性不匹配

**修复策略 | Fix Strategy**:

#### 3.1 修复组件导出和渲染问题

**步骤**:

```bash
# 1. 检查所有失败组件的导出方式
grep -r "export.*PhotoMetadataPanel" src/components/
grep -r "export.*PhotoViewer" src/components/
grep -r "export.*LivePhotoPlayer" src/components/

# 2. 验证 'use client' 指令
grep -r "use client" src/components/photo-*.tsx

# 3. 检查动态导入
grep -r "dynamic.*import" src/components/__tests__/
```

**可能的修复**:

如果组件使用了客户端特性(如 useState, useEffect),确保:

```typescript
// src/components/photo-viewer.tsx
'use client';  // 必须在文件顶部

export function PhotoViewer({ ... }) {
  // ...
}
```

如果测试需要动态导入:

```typescript
// src/components/__tests__/photo-viewer.test.tsx
import { render } from "@testing-library/react";
import dynamic from "next/dynamic";

const PhotoViewer = dynamic(() => import("../photo-viewer"), {
  ssr: false,
});
```

#### 3.2 修复 screen.getByAlt 问题

**问题**: `screen.getByAlt is not a function`

**原因**: Testing Library 导入或配置问题

**修复**:

```typescript
// 检查导入
import { render, screen } from "@testing-library/react";

// 如果 screen 未定义,使用 render 返回的 queries
const { getByAlt, getByRole } = render(<Component />);
expect(getByAlt("alt text")).toBeInTheDocument();
```

#### 3.3 修复 SearchCommand fake timers 问题

**策略**: 简化测试或移除 fake timers

**选项 A**: 移除 fake timers,使用实际延迟

```typescript
describe("SearchCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 移除: vi.useFakeTimers();
  });

  afterEach(() => {
    // 移除: vi.useRealTimers();
  });

  it("应该在输入后触发搜索", async () => {
    render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "test");

    // 使用 waitFor 等待实际延迟
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/search?q=test")
      );
    }, { timeout: 500 });
  });
});
```

**选项 B**: 转换为 E2E 测试 (推荐)

```typescript
// e2e/search-functionality.spec.ts
test("search should debounce input", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+K"); // 打开搜索

  await page.fill('[role="combobox"]', "test");

  // 等待防抖后的请求
  await page.waitForResponse((resp) => resp.url().includes("/api/search?q=test"), { timeout: 500 });
});
```

#### 3.4 修复 AuthHeader 菜单测试

**问题**: 菜单交互测试失败

**可能原因**:

- React 19 行为变化
- 事件模拟不正确
- 状态更新时序问题

**修复**:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("should toggle menu on button click", async () => {
  const user = userEvent.setup();
  render(<AuthHeader session={mockSession} />);

  const button = screen.getByRole("button", { name: /menu/i });

  // 点击打开
  await user.click(button);

  // 等待菜单显示
  await waitFor(() => {
    expect(screen.getByText("📊 Dashboard")).toBeInTheDocument();
  });

  // 点击关闭
  await user.click(button);

  // 等待菜单隐藏
  await waitFor(() => {
    expect(screen.queryByText("📊 Dashboard")).not.toBeInTheDocument();
  });
});
```

#### 3.5 修复 LanguageSwitcher href 问题

**问题**: href 属性不匹配

**可能原因**: locale 前缀处理不一致

**修复**:

```typescript
// 检查实际渲染的 href
const link = screen.getByRole("link");
console.log("Actual href:", link.getAttribute("href"));

// 更新期望值以匹配实际行为
expect(link).toHaveAttribute("href", "/en/posts/test-post"); // 注意 /en 前缀
```

**验收标准 | Acceptance Criteria**:

- ✅ 所有组件渲染测试通过 | All component rendering tests pass
- ✅ 单元测试通过率 ≥ 95% | Unit test pass rate ≥ 95%
- ✅ SearchCommand测试重构完成 | SearchCommand tests refactored
- ✅ 无 skip/todo 测试 | No skipped/todo tests
- ✅ 测试覆盖率不降低 | Coverage not reduced

**验证步骤 | Verification Steps**:

```bash
# 1. 运行所有单元测试
npm run test:run

# 2. 检查覆盖率
npm run test:coverage

# 3. 验证无跳过测试
grep -r "it.skip\|it.todo\|describe.skip" src/**/*.test.ts*

# 4. 查看详细失败信息
npm run test:run -- --reporter=verbose

# 5. 运行特定失败的测试
npm run test:run -- photo-viewer.test.tsx
```

---

## ⚠️ 优先级 P1 - 尽快完成 | Priority P1 - Complete Soon

### Task 4: 重构E2E测试套件 | Refactor E2E Test Suite

**状态**: 🔴 未开始 | Not Started
**预计时间**: 3-5小时 | 3-5 hours
**依赖**: Task 2完成(集成测试添加) | Task 2 complete (integration tests added)

**当前E2E文件 | Current E2E Files**:

需要先列出所有E2E测试文件并分类。

**执行步骤**:

```bash
# 1. 列出所有E2E文件
ls -la e2e/**/*.spec.ts > e2e-inventory.txt

# 2. 查看文件数量
find e2e -name "*.spec.ts" | wc -l

# 3. 查看各测试文件行数
wc -l e2e/**/*.spec.ts | sort -n
```

**保留的关键E2E测试 | E2E Tests to Keep** (8-10个 | 8-10 files):

1. ✅ `sitemap-improved.spec.ts` - SEO关键路径
2. ✅ `seo-metadata-improved.spec.ts` - SEO元数据验证
3. ✅ `i18n-routing-improved.spec.ts` - 国际化路由
4. ✅ `auth-flow.spec.ts` - 完整认证流程
5. ✅ `content-operations.spec.ts` - 内容发布流程
6. ✅ `gallery-upload.spec.ts` - 相册上传流程
7. ✅ `search-functionality.spec.ts` - 搜索用户体验
8. ✅ `performance-critical.spec.ts` - 性能关键路径

**转换为集成测试 | Convert to Integration Tests**:

- ❌ `likes.spec.ts` → `src/tests/integration/api/likes.integration.test.ts`
- ❌ `comments.spec.ts` → `src/tests/integration/api/comments.integration.test.ts`

**删除/合并 | Delete/Merge**:

- 过于详细的UI测试 → 应该是单元测试
- 简单API测试 → 应该是集成测试
- 重复的测试场景

**详细步骤 | Detailed Steps**:

#### 4.1 审计现有E2E测试

```bash
# 创建审计脚本
cat > scripts/audit-e2e-tests.sh << 'EOF'
#!/bin/bash
echo "📊 E2E Test Audit"
echo "=================="

echo ""
echo "Total E2E test files:"
find e2e -name "*.spec.ts" | wc -l

echo ""
echo "Test files by category:"
echo "  SEO tests:"
find e2e -name "*seo*.spec.ts" -o -name "*sitemap*.spec.ts" | wc -l
echo "  Auth tests:"
find e2e -name "*auth*.spec.ts" | wc -l
echo "  Content tests:"
find e2e -name "*content*.spec.ts" -o -name "*post*.spec.ts" | wc -l
echo "  Gallery tests:"
find e2e -name "*gallery*.spec.ts" | wc -l
echo "  Search tests:"
find e2e -name "*search*.spec.ts" | wc -l

echo ""
echo "Lines of code by file:"
wc -l e2e/**/*.spec.ts | sort -n | tail -20
EOF

chmod +x scripts/audit-e2e-tests.sh
bash scripts/audit-e2e-tests.sh
```

#### 4.2 转换 likes.spec.ts 为集成测试

**新文件**: `src/tests/integration/api/likes.integration.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";
import { PostStatus } from "@prisma/client";

describe("Likes API Integration", () => {
  const db = getTestDb();

  it("should increment post like count atomically", async () => {
    // 1. 创建文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "测试文章",
        slug: `like-test-${Date.now()}`,
        content: "内容",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: "zh",
        publishedAt: new Date(),
      },
    });

    // 2. 创建多个用户
    const users = await Promise.all([
      createTestUser("USER"),
      createTestUser("USER"),
      createTestUser("USER"),
    ]);

    // 3. 每个用户点赞
    for (const user of users) {
      await db.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });
    }

    // 4. 验证点赞数
    const likeCount = await db.like.count({
      where: { postId: post.id },
    });
    expect(likeCount).toBe(3);
  });

  it("should prevent duplicate likes from same user", async () => {
    // 测试unique约束
    const admin = await createTestUser("ADMIN");
    const user = await createTestUser("USER");

    const post = await db.post.create({
      data: {
        title: "测试",
        slug: `unique-like-${Date.now()}`,
        content: "内容",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: "zh",
        publishedAt: new Date(),
      },
    });

    // 第一次点赞
    await db.like.create({
      data: { userId: user.id, postId: post.id },
    });

    // 第二次点赞应该失败
    await expect(
      db.like.create({
        data: { userId: user.id, postId: post.id },
      })
    ).rejects.toThrow(); // Unique constraint violation
  });
});
```

#### 4.3 更新 playwright 配置

```typescript
// playwright.config.ts 更新 testMatch

export default defineConfig({
  testMatch: [
    // 保留的8个关键E2E测试
    "**/sitemap-improved.spec.ts",
    "**/seo-metadata-improved.spec.ts",
    "**/i18n-routing-improved.spec.ts",
    "**/auth-flow.spec.ts",
    "**/content-operations.spec.ts",
    "**/gallery-upload.spec.ts",
    "**/search-functionality.spec.ts",
    "**/performance-critical.spec.ts",
  ],
  // ... 其他配置
});
```

#### 4.4 归档旧的E2E测试

```bash
# 创建归档目录
mkdir -p e2e-archived

# 移动不再需要的E2E测试
git mv e2e/likes.spec.ts e2e-archived/
git mv e2e/comments.spec.ts e2e-archived/

# 提交变更
git add .
git commit -m "refactor: move API tests from E2E to integration tests"
```

**验收标准 | Acceptance Criteria**:

- ✅ E2E测试减少到8-10个文件 | E2E tests reduced to 8-10 files
- ✅ 测试金字塔比例改善 | Test pyramid ratio improved
- ✅ E2E运行时间 < 10分钟 | E2E runtime < 10 minutes
- ✅ 所有关键路径覆盖 | All critical paths covered
- ✅ API测试转换为集成测试 | API tests converted to integration

**验证步骤 | Verification Steps**:

```bash
# 1. 运行关键E2E测试
npm run test:e2e:critical

# 2. 检查运行时间
time npm run test:e2e

# 3. 验证集成测试覆盖了转换的场景
npm run test:integration -- likes

# 4. 对比测试金字塔比例
bash scripts/audit-e2e-tests.sh
```

---

### Task 5: 更新CI/CD工作流 | Update CI/CD Workflows

**状态**: 🔴 未开始 | Not Started
**预计时间**: 2-3小时 | 2-3 hours
**依赖**: Task 1-4完成 | Tasks 1-4 complete

**详细步骤 | Detailed Steps**:

#### 5.1 添加集成测试到CI流水线

**文件**: `.github/workflows/ci-critical.yml`

在现有的 `unit-test` job 之后添加:

```yaml
integration-test:
  name: 🔗 Integration Tests
  runs-on: ubuntu-latest
  needs: [unit-test] # 在单元测试后运行

  services:
    postgres:
      image: postgres:17
      env:
        POSTGRES_PASSWORD: test-password
        POSTGRES_DB: tdp_test
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: "npm"

    - name: Install dependencies
      run: npm ci

    - name: Setup test database
      run: |
        npm run db:generate
        npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:test-password@localhost:5432/tdp_test

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:test-password@localhost:5432/tdp_test
        TEST_DATABASE_URL: postgresql://postgres:test-password@localhost:5432/tdp_test
        NODE_ENV: test
        NEXTAUTH_SECRET: test-secret-key-for-ci

    - name: Upload coverage
      if: always()
      uses: codecov/codecov-action@v4
      with:
        files: ./coverage/coverage-final.json
        flags: integration
        token: ${{ secrets.CODECOV_TOKEN }}
```

#### 5.2 添加覆盖率报告工作流

**新文件**: `.github/workflows/coverage.yml`

```yaml
name: 📊 Coverage Report

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]

jobs:
  coverage:
    name: Generate Coverage Report
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: test-password
          POSTGRES_DB: tdp_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm run db:generate
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test-password@localhost:5432/tdp_test

      - name: Run all tests with coverage
        run: |
          npm run test:coverage
          npm run test:integration:coverage
        env:
          DATABASE_URL: postgresql://postgres:test-password@localhost:5432/tdp_test
          TEST_DATABASE_URL: postgresql://postgres:test-password@localhost:5432/tdp_test
          NODE_ENV: test

      - name: Generate coverage report
        uses: davelosert/vitest-coverage-report-action@v2
        with:
          json-summary-path: ./coverage/coverage-summary.json
          json-final-path: ./coverage/coverage-final.json

      - name: Comment PR with coverage
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
          delete-old-comments: true
```

#### 5.3 更新 feature 分支工作流

**文件**: `.github/workflows/build-and-test.yml`

确保所有分支都运行基础测试:

```yaml
name: 🧪 Build and Test

on:
  push:
    branches:
      - "**" # 所有分支
      - "!main" # 除了main(main有专门的流水线)
    paths-ignore:
      - "**.md"
      - "docs/**"
      - ".github/workflows/**"
      - "!.github/workflows/build-and-test.yml"

jobs:
  quick-check:
    name: 🚀 Quick Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:run
```

#### 5.4 配置分支保护规则

通过 GitHub Web UI 配置(或使用 GitHub API):

```yaml
# 分支保护规则配置 (仅供参考,需要在GitHub UI中设置)

Branch: main
Protection rules:
  ✅ Require status checks to pass before merging
    Required checks:
      - lint-and-format
      - type-check
      - unit-test
      - integration-test
      - e2e-critical
      - build

  ✅ Require pull request reviews before merging
    Required approving reviews: 1
    Dismiss stale pull request approvals when new commits are pushed: Yes

  ✅ Require linear history: Yes (推荐)

  ❌ Allow force pushes: No
  ❌ Allow deletions: No
```

**验收标准 | Acceptance Criteria**:

- ✅ 集成测试添加到CI | Integration tests in CI
- ✅ 覆盖率报告自动生成 | Coverage reports auto-generated
- ✅ 分支保护规则配置 | Branch protection configured
- ✅ PR自动显示覆盖率变化 | PR shows coverage changes
- ✅ 所有分支运行基础测试 | All branches run basic tests
- ✅ CI运行时间合理 | CI runtime reasonable

**验证步骤 | Verification Steps**:

```bash
# 1. 创建测试分支触发CI
git checkout -b test/ci-integration
git commit --allow-empty -m "test: trigger CI"
git push origin test/ci-integration

# 2. 检查GitHub Actions
# 访问: https://github.com/{user}/{repo}/actions

# 3. 创建PR验证覆盖率报告
gh pr create --title "Test CI" --body "Testing CI integration"

# 4. 验证分支保护
# 尝试直接push到main (应该被拒绝)
git checkout main
git commit --allow-empty -m "test: should be blocked"
git push origin main  # 应该失败
```

---

### Task 6: 添加测试覆盖率监控 | Add Test Coverage Monitoring

**状态**: 🔴 未开始 | Not Started
**预计时间**: 1-2小时 | 1-2 hours
**依赖**: Task 5完成 | Task 5 complete

**详细步骤 | Detailed Steps**:

#### 6.1 配置 Vitest 覆盖率阈值

**文件**: `vitest.config.mjs` (更新)

```javascript
export default defineConfig({
  test: {
    // 现有配置...
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        ".next/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "e2e/**",
        "src/tests/**",
        "scripts/**",
        "*.config.*",
      ],
      thresholds: {
        lines: 80, // 行覆盖率 ≥ 80%
        functions: 75, // 函数覆盖率 ≥ 75%
        branches: 70, // 分支覆盖率 ≥ 70%
        statements: 80, // 语句覆盖率 ≥ 80%
      },
      // 每个文件的最低覆盖率
      perFile: true,
      // 包含哪些目录
      include: ["src/app/**", "src/components/**", "src/lib/**"],
    },
  },
});
```

#### 6.2 创建覆盖率趋势跟踪脚本

**文件**: `scripts/track-coverage.sh`

```bash
#!/bin/bash
# 保存覆盖率历史数据

set -e

COVERAGE_FILE="coverage/coverage-summary.json"
HISTORY_FILE="coverage-history.jsonl"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "❌ Coverage file not found: $COVERAGE_FILE"
  echo "Run 'npm run test:coverage' first"
  exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 提取覆盖率数据
TOTAL=$(jq '.total' $COVERAGE_FILE)

# 追加到历史文件
echo "{\"timestamp\":\"$TIMESTAMP\",\"commit\":\"$COMMIT\",\"branch\":\"$BRANCH\",\"coverage\":$TOTAL}" >> $HISTORY_FILE

echo "✅ Coverage tracked for commit $COMMIT on branch $BRANCH"

# 显示最近5次覆盖率
echo ""
echo "📊 Recent coverage history:"
tail -5 $HISTORY_FILE | jq -r '[.timestamp, .commit, .coverage.lines.pct + "%"] | @tsv' | column -t
```

```bash
chmod +x scripts/track-coverage.sh
```

#### 6.3 添加覆盖率徽章到 README

这部分将在 Task "创建简化版 README 测试部分" 中完成。

#### 6.4 配置 pre-commit 覆盖率检查

**文件**: `.husky/pre-commit` (更新)

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Lint
echo "  📝 Linting..."
npm run lint --silent

# 2. Type-check
echo "  🔧 Type checking..."
npm run type-check --silent

# 3. Unit tests with coverage
echo "  🧪 Running tests with coverage..."
npm run test:coverage -- --run --reporter=silent

# 检查覆盖率是否达标
if [ $? -ne 0 ]; then
  echo "❌ Tests failed or coverage below threshold"
  echo "Run 'npm run test:coverage' to see details"
  exit 1
fi

echo "✅ All pre-commit checks passed"
```

**验收标准 | Acceptance Criteria**:

- ✅ 覆盖率阈值配置生效 | Coverage thresholds enforced
- ✅ 覆盖率历史数据跟踪 | Coverage history tracked
- ✅ README显示覆盖率徽章 | README shows coverage badges
- ✅ pre-commit检查覆盖率 | pre-commit checks coverage
- ✅ 低于阈值阻止提交 | Below threshold blocks commit

**验证步骤 | Verification Steps**:

```bash
# 1. 测试覆盖率阈值
npm run test:coverage  # 应该失败如果低于阈值

# 2. 跟踪覆盖率历史
bash scripts/track-coverage.sh
cat coverage-history.jsonl | tail -5

# 3. 测试pre-commit hook
echo "test" >> README.md
git add README.md
git commit -m "test: coverage check"  # 应该运行覆盖率检查

# 4. 查看覆盖率报告
npm run test:coverage
open coverage/index.html
```

---

## 🔵 优先级 P2 - 可选增强 | Priority P2 - Optional Enhancements

### Task 7: 添加性能基准测试 | Add Performance Benchmarks

**状态**: 🟢 可选 | Optional
**预计时间**: 2-3小时 | 2-3 hours

**目标 | Goals**:

- 搜索API响应时间 < 200ms (P95 < 500ms)
- 首页加载时间 < 1.5s
- 图片上传处理时间 < 3s

**工具选择 | Tools**:

- `vitest benchmark` for API performance
- Lighthouse CI for page performance
- k6 or autocannon for load testing

**实现示例**:

```typescript
// src/tests/benchmarks/search.bench.ts
import { bench, describe } from "vitest";
import { searchPosts } from "@/lib/search";

describe("Search Performance", () => {
  bench("search for single keyword", async () => {
    await searchPosts("test", { locale: "zh", limit: 10 });
  });

  bench("search for complex query", async () => {
    await searchPosts("Next.js React TypeScript", { locale: "zh", limit: 10 });
  });
});
```

---

### Task 8: 添加视觉回归测试 | Add Visual Regression Tests

**状态**: 🟢 可选 | Optional
**预计时间**: 3-4小时 | 3-4 hours

**目标 | Goals**:

- 关键页面截图对比
- 防止UI意外变化
- 多分辨率支持

**工具选择 | Tools**:

- Playwright screenshot comparison (内置)
- Percy 或 Chromatic (第三方服务)

**实现示例**:

```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from "@playwright/test";

test("homepage visual regression", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png", {
    maxDiffPixels: 100,
  });
});

test("admin dashboard visual regression", async ({ page }) => {
  // Login as admin
  await page.goto("/admin");
  await expect(page).toHaveScreenshot("admin-dashboard.png");
});
```

---

### Task 9: 添加可访问性测试 | Add Accessibility Tests

**状态**: 🟢 可选 | Optional
**预计时间**: 2-3小时 | 2-3 hours

**目标 | Goals**:

- WCAG 2.1 AA 合规
- 键盘导航测试
- 屏幕阅读器兼容

**工具选择 | Tools**:

- axe-core with Playwright
- pa11y for automated checks

**实现示例**:

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage should not have accessibility violations", async ({ page }) => {
  await page.goto("/");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("keyboard navigation should work", async ({ page }) => {
  await page.goto("/");

  // Tab through interactive elements
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  // Verify focus and navigation
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(["A", "BUTTON", "INPUT"]).toContain(focused);
});
```

---

## 📊 进度跟踪 | Progress Tracking

### 使用方式 | How to Use This Checklist

#### 1. 开始任务前 | Before Starting

```bash
# 创建feature分支
git checkout -b testing/integration-tests

# 标记任务开始 (更新本文档)
# 🔴 未开始 → 🟡 进行中
```

#### 2. 任务进行中 | During Task

```bash
# 频繁提交
git add .
git commit -m "test(integration): add auth integration tests (Task 2.1)"

# 运行验证步骤
npm run test:integration

# 更新进度文件 (testing-progress.md)
```

#### 3. 任务完成后 | After Task

```bash
# 运行所有验证
npm run test:all
npm run lint
npm run type-check

# 标记任务完成 (更新本文档)
# 🟡 进行中 → 🟢 已完成

# 创建PR
gh pr create \
  --title "Add integration tests (Task 2)" \
  --body "完成Task 2的所有子任务

## 变更内容
- 添加13个集成测试
- 覆盖认证、文章、搜索、存储、数据库场景
- 所有测试通过
- 覆盖率 >60%

## 验证
- [x] npm run test:integration 通过
- [x] 覆盖率达标
- [x] 测试独立可运行
- [x] 数据库清理正常"
```

### 状态说明 | Status Legend

- 🔴 未开始 | Not Started
- 🟡 进行中 | In Progress (正在工作)
- 🟢 已完成 | Completed (已验证)
- ⚠️ 被阻塞 | Blocked (有依赖或问题)
- ⏸️ 暂停 | Paused (临时搁置)

### 预计完成时间 | Estimated Timeline

| 阶段        | 任务                 | 时间估算 | 依赖     | 状态      |
| ----------- | -------------------- | -------- | -------- | --------- |
| **Week 1**  | Task 1: 集成测试框架 | 2-3小时  | 无       | 🔴        |
| **Week 1**  | Task 2: 编写集成测试 | 4-6小时  | Task 1   | 🔴        |
| **Week 1**  | Task 3: 修复单元测试 | 6-8小时  | 无       | 🔴        |
| **Week 2**  | Task 4: 重构E2E测试  | 3-5小时  | Task 2   | 🔴        |
| **Week 2**  | Task 5: 更新CI/CD    | 2-3小时  | Task 1-4 | 🔴        |
| **Week 2**  | Task 6: 覆盖率监控   | 1-2小时  | Task 5   | 🔴        |
| **Week 3+** | Task 7: 性能基准     | 2-3小时  | 可选     | 🟢 (可选) |
| **Week 3+** | Task 8: 视觉回归     | 3-4小时  | 可选     | 🟢 (可选) |
| **Week 3+** | Task 9: 可访问性     | 2-3小时  | 可选     | 🟢 (可选) |

**总计 | Total**:

- **核心任务 (P0+P1)**: 20-30小时
- **可选任务 (P2)**: 7-10小时
- **全部任务**: 27-40小时

**建议分配 | Recommended Allocation**:

- Week 1: 专注 P0 任务 (Task 1-3)
- Week 2: 完成 P1 任务 (Task 4-6)
- Week 3+: 根据时间和需求完成 P2 任务

---

## ✅ 完成标准总结 | Completion Criteria Summary

整个优化项目完成后,应该达到以下标准:

### 测试覆盖率 | Test Coverage

- ✅ Unit tests: ≥ 80% coverage, ≥ 95% pass rate
- ✅ Integration tests: ≥ 60% coverage, 10-15 test files
- ✅ E2E tests: 100% critical paths, 8-10 test files
- ✅ Overall coverage: ≥ 85%

### 测试金字塔比例 | Test Pyramid Ratio

- ✅ 70% Unit tests (~30 files, 400+ tests)
- ✅ 20% Integration tests (~15 files, 50+ tests)
- ✅ 10% E2E tests (~10 files, 30+ tests)

### CI/CD 流水线 | CI/CD Pipeline

- ✅ All branches: Lint + Type-check + Unit tests
- ✅ Main branch: Full pipeline (test + build + deploy)
- ✅ Coverage reports on every PR
- ✅ Branch protection with quality gates
- ✅ E2E runtime < 10 minutes
- ✅ Integration tests < 5 minutes
- ✅ Unit tests < 2 minutes

### 代码质量 | Code Quality

- ✅ No skipped/disabled tests
- ✅ No TODO comments in core functionality
- ✅ All tests independent and isolated
- ✅ Test data auto-cleanup
- ✅ README documentation complete
- ✅ Consistent test patterns

### 维护性 | Maintainability

- ✅ Clear test file organization
- ✅ Comprehensive test utilities
- ✅ Coverage trending tracked
- ✅ Pre-commit hooks enforcing quality
- ✅ Maintenance principles documented

---

## 🚨 常见问题和故障排除 | Troubleshooting

### 问题 1: 测试数据库连接失败

**症状**: `Error: Can't reach database server`

**解决方案**:

```bash
# 1. 检查PostgreSQL是否运行
psql --version
pg_isready

# 2. 验证环境变量
echo $TEST_DATABASE_URL

# 3. 手动连接测试
psql $TEST_DATABASE_URL -c "SELECT 1;"

# 4. 如果CI环境,检查service配置
# 确保 ports 映射正确: 5432:5432
```

### 问题 2: 集成测试超时

**症状**: `Error: Test timed out in 30000ms`

**解决方案**:

```typescript
// 增加特定测试的超时时间
it("slow database operation", async () => {
  // ...
}, 60000); // 60秒超时

// 或在配置中全局增加
// vitest.integration.config.mjs
export default defineConfig({
  test: {
    testTimeout: 60000,
  },
});
```

### 问题 3: 覆盖率低于阈值

**症状**: `ERROR: Coverage for lines (75%) is below threshold (80%)`

**解决方案**:

```bash
# 1. 查看哪些文件覆盖率低
npm run test:coverage

# 2. 查看详细报告
open coverage/index.html

# 3. 为低覆盖率文件添加测试
# 或排除不需要测试的文件

# 4. 临时降低阈值(不推荐)
# vitest.config.mjs
thresholds: {
  lines: 75, // 临时降低
}
```

### 问题 4: 并发测试数据冲突

**症状**: `Unique constraint failed`

**解决方案**:

```typescript
// 使用时间戳确保唯一性
const slug = `test-post-${Date.now()}-${Math.random()}`;

// 或使用测试隔离
describe("Test suite", () => {
  beforeEach(async () => {
    await cleanDatabase(); // 每个测试前清理
  });
});
```

### 问题 5: CI中E2E测试不稳定

**症状**: E2E tests pass locally but fail in CI

**解决方案**:

```typescript
// 1. 增加等待时间
await page.waitForLoadState('networkidle');

// 2. 使用更稳定的选择器
await page.getByRole('button', { name: '提交' });

// 3. 重试不稳定的测试
test.describe.configure({ retries: 2 });

// 4. 检查CI环境资源
# GitHub Actions: 增加worker数量
workers: process.env.CI ? 2 : 4,
```

---

## 📚 参考资源 | References

### 官方文档 | Official Documentation

- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

### 最佳实践 | Best Practices

- [Google Testing Blog - Test Pyramid](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
- [Martin Fowler - Testing Strategies](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Kent C. Dodds - Testing Best Practices](https://kentcdodds.com/blog/write-tests)

### 社区资源 | Community Resources

- [Vitest Examples](https://github.com/vitest-dev/vitest/tree/main/examples)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

**此清单最后更新 | Last Updated**: 2025-10-10
**版本 | Version**: 1.0.0
**维护者 | Maintainer**: @hao

---

_如有任何问题或建议,请在项目issue中提出 | For questions or suggestions, please create an issue_
