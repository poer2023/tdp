# E2E测试快速开始

## 🚀 运行测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在另一个终端运行E2E测试
npm run test:e2e

# 3. 查看测试报告
npx playwright show-report
```

## 📝 编写新测试（3步法）

### Step 1: 使用Page Object

```typescript
import { test, expect } from "@playwright/test";
import { PostPage } from "./pages/post-page";
import { TEST_POST_IDS } from "./fixtures/test-data";

test.describe("My Feature", () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
  });
});
```

### Step 2: 使用确定性数据

```typescript
test("should do something", async () => {
  // ✅ 使用确定性slug
  await postPage.gotoPost("test-post-en-1");

  // ❌ 不要依赖数据库状态
  // await page.goto("/posts");
  // const firstPost = page.locator('a').first();
});
```

### Step 3: 使用智能等待

```typescript
import { waitForApiResponse } from "./helpers/wait-helpers";

test("should submit", async ({ page }) => {
  // ✅ 等待API响应
  const responsePromise = waitForApiResponse(page, /\/api\/posts/);
  await postPage.submitComment("Test");
  await responsePromise;

  // ❌ 不要硬编码延迟
  // await page.waitForTimeout(500);
});
```

## 🔑 关键概念

### 可用的测试数据

```typescript
// 文章
"test-post-en-1"; // 有中文翻译
"test-post-en-2"; // 无翻译
"test-post-zh-1"; // 有英文翻译

// 用户
TEST_USER_IDS.regular; // 普通用户
TEST_USER_IDS.admin; // 管理员
```

### Page Objects

```typescript
// 文章页面
const postPage = new PostPage(page);
await postPage.gotoPost("test-post-en-1");
await postPage.clickLike();
await postPage.submitComment("Test");

// 列表页面
const listPage = new PostsListPage(page);
await listPage.gotoPostsList();
const postPage = await listPage.clickFirstPost();

// 管理页面
const adminPage = new AdminCommentsPage(page);
await adminPage.gotoAdminComments();
await adminPage.approveComment(0);
```

### 认证测试

```typescript
import { test } from "./fixtures/authenticated";

// 自动处理登录/登出
test("regular user", async ({ authenticatedPage }) => {
  const postPage = new PostPage(authenticatedPage);
  await postPage.gotoPost("test-post-en-1");
  await postPage.submitComment("I'm logged in!");
});

test("admin user", async ({ adminPage }) => {
  const commentsPage = new AdminCommentsPage(adminPage);
  await commentsPage.gotoAdminComments();
});
```

## 🐛 调试

```bash
# 显示浏览器
npx playwright test --headed

# 调试模式（逐步执行）
npx playwright test --debug

# UI模式
npx playwright test --ui

# 运行单个测试
npx playwright test e2e/likes-improved.spec.ts
```

## 📚 详细文档

- **完整指南**: [e2e/README.md](./README.md)
- **改进总结**: [docs/E2E_TESTING_IMPROVEMENT_SUMMARY.md](../docs/E2E_TESTING_IMPROVEMENT_SUMMARY.md)
- **示例测试**: [e2e/likes-improved.spec.ts](./likes-improved.spec.ts)

## ⚡ 最佳实践速查

| ✅ DO                | ❌ DON'T             |
| -------------------- | -------------------- |
| 使用Page Object      | 直接在测试中写选择器 |
| 使用智能等待         | `waitForTimeout()`   |
| 使用确定性数据       | 依赖数据库状态       |
| 强断言（具体值）     | 弱断言（永真）       |
| 使用fixtures         | 每个测试重复setup    |
| `data-testid` 选择器 | 不稳定的CSS选择器    |
