# 启用需要认证的 E2E 测试

本文档详细说明如何启用当前被跳过的 44 个需要认证的 E2E 测试。

## 概述

当前项目有 87 个 E2E 测试，其中 44 个因需要认证而被跳过：

| 测试文件 | 跳过的测试数 | 原因 |
| -------- | ------------ | ---- |

| `e2e/auth.spec.ts` | 10 | 需要 Google OAuth 登录 |
| `e2e/content-operations.spec.ts` | 23 | 需要管理员权限 |
| **总计** | **44** | - |

## 方案选择

有三种方案可以启用这些测试：

### 方案 1: Session 状态注入 (推荐) ⭐

**优点**:

- ✅ 速度快，无需真实 OAuth 流程
- ✅ 可靠，不依赖外部服务
- ✅ 易于维护，测试数据可控
- ✅ 适合 CI/CD 环境

**缺点**:

- ❌ 不测试真实的 OAuth 流程

**适用场景**: 大多数 E2E 测试

### 方案 2: OAuth Mock Server

**优点**:

- ✅ 测试完整的 OAuth 流程
- ✅ 不依赖 Google 服务

**缺点**:

- ❌ 需要额外的 Mock 服务器
- ❌ 设置复杂

**适用场景**: 专门测试 OAuth 流程的测试

### 方案 3: 真实 OAuth 凭据

**优点**:

- ✅ 测试真实环境

**缺点**:

- ❌ 不适合 CI/CD
- ❌ 依赖外部服务
- ❌ 速度慢
- ❌ 可能达到 API 限制

**适用场景**: 手动测试或冒烟测试

---

## 实施方案 1: Session 状态注入 (推荐)

### 步骤 1: 安装依赖

```bash
npm install --save-dev @playwright/test dotenv
```

### 步骤 2: 创建测试用户和会话工具

创建 `e2e/utils/auth.ts`:

```typescript
import { Page } from "@playwright/test";
import { SignJWT } from "jose";

// 测试用户配置
export const TEST_USERS = {
  regular: {
    id: "test-user-1",
    name: "Test User",
    email: "test@example.com",
    image: "https://avatars.githubusercontent.com/u/1?v=4",
    role: "USER",
  },
  admin: {
    id: "test-admin-1",
    name: "Admin User",
    email: "admin@example.com",
    image: "https://avatars.githubusercontent.com/u/2?v=4",
    role: "ADMIN",
  },
};

/**
 * 生成 NextAuth.js session token
 */
async function generateSessionToken(user: typeof TEST_USERS.regular) {
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "test-secret-key-for-e2e-testing"
  );

  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    picture: user.image,
    sub: user.id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

/**
 * 为页面设置认证会话
 */
export async function loginAsUser(page: Page, userType: "regular" | "admin" = "regular") {
  const user = TEST_USERS[userType];
  const token = await generateSessionToken(user);

  // 设置 NextAuth session cookie
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    },
  ]);
}

/**
 * 清除认证状态
 */
export async function logout(page: Page) {
  await page.context().clearCookies();
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((c) => c.name === "next-auth.session-token");
}
```

### 步骤 3: 创建数据库种子脚本

创建 `e2e/utils/seed-test-data.ts`:

```typescript
import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";
import { TEST_USERS } from "./auth";

const prisma = new PrismaClient();

export async function seedTestData() {
  console.log("🌱 Seeding test data...");

  // 清理旧的测试数据
  await cleanupTestData();

  // 创建测试用户
  const regularUser = await prisma.user.upsert({
    where: { id: TEST_USERS.regular.id },
    update: {},
    create: {
      id: TEST_USERS.regular.id,
      name: TEST_USERS.regular.name,
      email: TEST_USERS.regular.email,
      image: TEST_USERS.regular.image,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { id: TEST_USERS.admin.id },
    update: {},
    create: {
      id: TEST_USERS.admin.id,
      name: TEST_USERS.admin.name,
      email: TEST_USERS.admin.email,
      image: TEST_USERS.admin.image,
    },
  });

  // 创建测试文章 (EN/ZH 配对)
  const groupId = "test-group-1";

  const enPost = await prisma.post.create({
    data: {
      title: "Test Post EN",
      slug: "test-post-en",
      excerpt: "Test excerpt",
      content: "Test content",
      locale: PostLocale.EN,
      groupId,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      tags: JSON.stringify(["test"]),
      authorId: adminUser.id,
    },
  });

  const zhPost = await prisma.post.create({
    data: {
      title: "测试文章",
      slug: "ce-shi-wen-zhang",
      excerpt: "测试摘要",
      content: "测试内容",
      locale: PostLocale.ZH,
      groupId,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      tags: JSON.stringify(["测试"]),
      authorId: adminUser.id,
    },
  });

  // 已移除评论功能：不再创建测试评论

  console.log("✅ Test data seeded successfully");
  console.log(`   - Users: ${TEST_USERS.regular.email}, ${TEST_USERS.admin.email}`);
  console.log(`   - Posts: ${enPost.slug}, ${zhPost.slug}`);
}

export async function cleanupTestData() {
  console.log("🧹 Cleaning up test data...");

  // 删除测试用户创建的数据
  // 已移除评论功能：无需清理评论
  await prisma.reaction.deleteMany({
    where: {
      OR: [{ post: { authorId: TEST_USERS.regular.id } }, { authorId: TEST_USERS.admin.id }],
    },
  });

  await prisma.reaction.deleteMany({
    where: {
      userId: {
        in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
      },
    },
  });

  await prisma.post.deleteMany({
    where: {
      authorId: {
        in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
      },
    },
  });

  await prisma.account.deleteMany({
    where: {
      userId: {
        in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
      },
    },
  });

  await prisma.session.deleteMany({
    where: {
      userId: {
        in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
      },
    },
  });

  console.log("✅ Test data cleaned up");
}

// CLI execution
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error seeding test data:", error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
```

### 步骤 4: 创建全局测试设置

创建 `e2e/global-setup.ts`:

```typescript
import { chromium, FullConfig } from "@playwright/test";
import { seedTestData } from "./utils/seed-test-data";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Running global E2E setup...\n");

  // 1. 种子测试数据
  await seedTestData();

  // 2. 预热应用 (可选)
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(config.use?.baseURL || "http://localhost:3000");
  await page.waitForLoadState("networkidle");
  await browser.close();

  console.log("\n✅ Global setup complete\n");
}

export default globalSetup;
```

创建 `e2e/global-teardown.ts`:

```typescript
import { FullConfig } from "@playwright/test";
import { cleanupTestData } from "./utils/seed-test-data";

async function globalTeardown(config: FullConfig) {
  console.log("\n🧹 Running global E2E teardown...");

  // 清理测试数据
  await cleanupTestData();

  console.log("✅ Global teardown complete\n");
}

export default globalTeardown;
```

### 步骤 5: 更新 Playwright 配置

编辑 `playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: "html",

  // 添加全局设置和清理
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",

    // 添加认证状态目录
    storageState: undefined, // 将在各个测试中动态设置
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // ... 其他浏览器配置
  ],

  webServer: {
    command: "bash e2e/setup-and-start.sh",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  },
});
```

### 步骤 6: 更新测试文件

```typescript
import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "./utils/auth";

// 评论相关测试已移除
```

#### 示例 2: 更新认证测试

编辑 `e2e/auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "./utils/auth";

test.describe("Authenticated User Header", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "regular");
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("should show user avatar when authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 应该显示用户菜单按钮
    const userMenu = page.getByLabel("User menu");
    await expect(userMenu).toBeVisible();

    // 应该显示用户名
    await expect(page.getByText("Test User")).toBeVisible();
  });

  test("should open dropdown menu on avatar click", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page.getByLabel("User menu");
    await userMenu.click();

    // 菜单应该打开
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();

    // 应该显示 Dashboard 链接
    await expect(page.getByText("📊 Dashboard")).toBeVisible();

    // 应该显示 Sign out 按钮
    await expect(page.getByText("🚪 Sign out")).toBeVisible();
  });

  test("should close menu on Escape key", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page.getByLabel("User menu");
    await userMenu.click();

    // 菜单打开
    await expect(page.getByRole("menu")).toBeVisible();

    // 按 Escape
    await page.keyboard.press("Escape");

    // 菜单应该关闭
    await expect(page.getByRole("menu")).not.toBeVisible();
  });
});
```

#### 示例 3: 更新内容操作测试

编辑 `e2e/content-operations.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "./utils/auth";
import path from "path";

test.describe("Content Export (Admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "admin"); // 使用管理员账户
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("should access export page at /admin/export", async ({ page }) => {
    await page.goto("/admin/export");
    await page.waitForLoadState("networkidle");

    // 应该显示导出表单
    const exportButton = page.getByRole("button", { name: /export|导出/i });
    await expect(exportButton).toBeVisible();
  });

  test("should download zip file on export", async ({ page }) => {
    await page.goto("/admin/export");
    await page.waitForLoadState("networkidle");

    // 设置下载监听
    const downloadPromise = page.waitForEvent("download");

    // 点击导出按钮
    const exportButton = page.getByRole("button", { name: /export|导出/i });
    await exportButton.click();

    // 等待下载
    const download = await downloadPromise;

    // 验证文件名
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });
});
```

### 步骤 7: 添加 npm 脚本

编辑 `package.json`:

```json
{
  "scripts": {
    "test:e2e:seed": "tsx e2e/utils/seed-test-data.ts",
    "test:e2e:cleanup": "tsx e2e/utils/seed-test-data.ts --cleanup",

    "test:e2e:admin": "playwright test e2e/content-operations.spec.ts"
  }
}
```

### 步骤 8: 安装额外依赖

```bash
npm install --save-dev jose tsx
```

### 步骤 9: 更新 .env 文件

确保 `.env.local` 包含:

```bash
# NextAuth Secret (用于签名 session token)
NEXTAUTH_SECRET="test-secret-key-for-e2e-testing"

# Database URL (确保测试使用独立数据库)
DATABASE_URL="postgresql://user:password@localhost:5432/tdp_test"
```

### 步骤 10: 运行测试

```bash
# 1. 种子测试数据
npm run test:e2e:seed

# 2. 运行认证相关测试
npm run test:e2e:auth

# 3. 运行管理员测试
npm run test:e2e:admin

# 4. 清理测试数据
npm run test:e2e:cleanup
```

---

## 实施方案 2: OAuth Mock Server (可选)

如果需要测试完整的 OAuth 流程，可以使用 Mock 服务器。

### 步骤 1: 安装 Mock OAuth 服务器

```bash
npm install --save-dev msw
```

### 步骤 2: 创建 OAuth Mock

创建 `e2e/mocks/oauth.ts`:

```typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const mockOAuthHandlers = [
  // Google OAuth 授权端点
  http.get("https://accounts.google.com/o/oauth2/v2/auth", ({ request }) => {
    const url = new URL(request.url);
    const redirectUri = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");

    // 重定向到回调 URL 并附带授权码
    return HttpResponse.redirect(`${redirectUri}?code=mock_auth_code&state=${state}`);
  }),

  // Google OAuth Token 端点
  http.post("https://oauth2.googleapis.com/token", async ({ request }) => {
    return HttpResponse.json({
      access_token: "mock_access_token",
      expires_in: 3600,
      scope: "openid email profile",
      token_type: "Bearer",
      id_token: "mock_id_token",
    });
  }),

  // Google UserInfo 端点
  http.get("https://www.googleapis.com/oauth2/v3/userinfo", ({ request }) => {
    return HttpResponse.json({
      sub: "mock_google_id",
      name: "Mock User",
      email: "mock@example.com",
      picture: "https://example.com/avatar.jpg",
    });
  }),
];

export const oauthMockServer = setupServer(...mockOAuthHandlers);
```

### 步骤 3: 在测试中启用 Mock

```typescript
import { test, expect } from "@playwright/test";
import { oauthMockServer } from "./mocks/oauth";

test.describe("OAuth Flow", () => {
  test.beforeAll(() => {
    oauthMockServer.listen();
  });

  test.afterAll(() => {
    oauthMockServer.close();
  });

  test("should complete OAuth flow", async ({ page }) => {
    await page.goto("/");

    // 点击登录按钮
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await signInButton.click();

    // 应该重定向并登录成功
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Mock User")).toBeVisible();
  });
});
```

---

## 验证设置

运行以下检查确保设置正确：

```bash
# 1. 检查依赖安装
npm list jose tsx @playwright/test

# 2. 种子测试数据
npm run test:e2e:seed

# 3. 运行单个测试验证
npx playwright test e2e/auth.spec.ts --headed --grep "should show user avatar"

# 4. 检查数据库
npx prisma studio

# 5. 清理
npm run test:e2e:cleanup
```

---

## 故障排除

### 问题 1: Session Token 无效

**症状**: 测试中用户未登录

**解决方案**:

1. 检查 `NEXTAUTH_SECRET` 是否一致
2. 确保 cookie 域名正确 (`localhost`)
3. 验证 token 过期时间

```typescript
// 调试: 打印 cookies
const cookies = await page.context().cookies();
console.log("Cookies:", cookies);
```

### 问题 2: 测试数据未创建

**症状**: 找不到测试文章/评论

**解决方案**:

1. 检查数据库连接
2. 运行 `npm run test:e2e:seed` 手动种子
3. 检查 Prisma schema

```bash
# 验证数据
npx prisma studio

# 检查数据库
psql -d tdp_test -c "SELECT * FROM \"User\" WHERE email LIKE '%test%';"
```

### 问题 3: 权限不足

**症状**: 管理员功能无法访问

**解决方案**:

1. 确保使用 `loginAsUser(page, "admin")`
2. 检查后端权限验证逻辑
3. 添加管理员角色字段到用户表

---

## CI/CD 集成

### GitHub Actions 示例

创建 `.github/workflows/e2e-auth.yml`:

```yaml
name: E2E Tests (Auth)

on:
  pull_request:
  push:
    branches: [main]

jobs:
  e2e-auth:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: tdp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Setup Database
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tdp_test

      - name: Seed Test Data
        run: npm run test:e2e:seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tdp_test
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

      - name: Build Application
        run: npm run build

      - name: Run E2E Tests (Auth)
        run: npm run test:e2e:auth
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tdp_test
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

      - name: Upload Test Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 下一步

1. ✅ 实施方案 1 (Session 注入)
2. ⏳ 移除测试文件中的 `test.skip()`
3. ⏳ 运行完整测试套件
4. ⏳ 设置 CI/CD 集成
5. ⏳ (可选) 实施方案 2 用于 OAuth 流程测试

---

## 相关文档

- [E2E Testing Guide](./E2E_TESTING.md)
- [Playwright Authentication](https://playwright.dev/docs/auth)
- [NextAuth.js Testing](https://next-auth.js.org/configuration/options#jwt)
- [jose JWT Library](https://github.com/panva/jose)

---

## 总结

通过 Session 状态注入方案，您可以：

1. ✅ 启用 44 个跳过的测试
2. ✅ 测试认证用户功能
3. ✅ 测试管理员功能
4. ✅ 在 CI/CD 中运行
5. ✅ 保持测试快速可靠

预期成果：

- **总测试数**: 87
- **可运行测试**: 87 (100%)
- **测试覆盖率**: ~100%
