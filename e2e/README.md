# E2E Testing Guide

本文档说明如何编写和运行E2E测试，遵循最佳实践。

## 目录结构

```
e2e/
├── fixtures/           # 测试数据和自定义fixtures
│   ├── test-data.ts    # 确定性测试数据种子
│   └── authenticated.ts # 认证状态fixtures
├── helpers/            # 通用helper函数
│   ├── wait-helpers.ts     # 智能等待策略
│   └── assertion-helpers.ts # 自定义断言
├── pages/              # Page Object Model
│   ├── base-page.ts        # 基类Page Object
│   ├── post-page.ts        # 文章页面对象
│   ├── posts-list-page.ts  # 文章列表页面对象

├── utils/              # 工具函数
│   └── auth.ts         # 认证工具
├── *.spec.ts           # 测试文件
├── global-setup.ts     # 全局setup（数据种子）
├── global-teardown.ts  # 全局teardown（清理数据）
└── README.md           # 本文档
```

## 快速开始

### 1. 运行所有E2E测试

```bash
# 启动开发服务器（另一个终端）
npm run dev

# 运行所有测试
npm run test:e2e

# 运行特定测试文件
npx playwright test e2e/likes-improved.spec.ts

# 运行并显示浏览器（调试模式）
npx playwright test --headed

# 运行并打开UI模式
npx playwright test --ui
```

### 2. 查看测试报告

```bash
npx playwright show-report
```

## 编写测试的最佳实践

### ✅ DO: 使用Page Object Model

```typescript
// 好的做法
test("should like a post", async ({ page }) => {
  const postPage = new PostPage(page);
  await postPage.gotoPost("test-post-en-1");
  await postPage.clickLike();

  const count = await postPage.getLikeCount();
  expect(count).toBe(1);
});
```

```typescript
// 不好的做法 ❌
test("should like a post", async ({ page }) => {
  await page.goto("/posts/test-post-en-1");
  await page.waitForLoadState("networkidle");
  const button = page.locator("button").filter({ hasText: /like/i });
  await button.click();
  await page.waitForTimeout(500); // ❌ 硬编码延迟
  const text = await button.textContent();
  const count = parseInt(text?.match(/\d+/)?.[0] || "0");
  expect(count).toBe(1);
});
```

### ✅ DO: 使用智能等待

```typescript
import { waitForNetworkIdle, waitForApiResponse } from "./helpers/wait-helpers";

// 好的做法
test("should submit form", async ({ page }) => {
  const responsePromise = waitForApiResponse(page, /\/api\/posts/);
  await submitButton.click();
  await responsePromise;
  await waitForNetworkIdle(page);
});
```

```typescript
// 不好的做法 ❌
test("should submit form", async ({ page }) => {
  await submitButton.click();
  await page.waitForTimeout(1000); // ❌ 硬编码延迟
});
```

### ✅ DO: 使用确定性测试数据

```typescript
import { TEST_POST_IDS, resetLikesData } from "./fixtures/test-data";

// 好的做法
test.beforeEach(async () => {
  await resetLikesData(); // 重置为已知状态
});

test("should display post", async () => {
  await postPage.gotoPost("test-post-en-1"); // 确定性slug
  await postPage.expectPostLoaded();
});
```

```typescript
// 不好的做法 ❌
test("should display post", async ({ page }) => {
  await page.goto("/posts");
  const firstPost = page.locator('a[href^="/posts/"]').first();
  if ((await firstPost.count()) > 0) {
    // ❌ 依赖数据库状态
    await firstPost.click();
  }
});
```

### ✅ DO: 使用测试fixtures

```typescript
import { test as authenticatedTest } from "./fixtures/authenticated";

// 好的做法 - 使用fixture自动处理认证
authenticatedTest("should post comment", async ({ authenticatedPage }) => {
  const postPage = new PostPage(authenticatedPage);
  await postPage.gotoPost("test-post-en-1");
  await postPage.submitComment("Test comment");
});
```

```typescript
// 不好的做法 ❌
import { loginAsUser, logout } from "./utils/auth";

test("should post comment", async ({ page }) => {
  await loginAsUser(page, "regular"); // 每个测试重复
  // ... 测试逻辑
  await logout(page);
});
```

### ✅ DO: 编写具体的断言

```typescript
// 好的做法
test("should have correct meta tags", async () => {
  const og = await postPage.getOpenGraphTags();
  expect(og.ogTitle).toBe("Test Post EN 1");
  expect(og.ogType).toBe("article");
  expect(og.ogUrl).toContain("/posts/test-post-en-1");
});
```

```typescript
// 不好的做法 ❌
test("should have meta tags", async ({ page }) => {
  const ogTags = page.locator('meta[property^="og:"]');
  expect(await ogTags.count()).toBeGreaterThanOrEqual(0); // ❌ 永真断言
});
```

## 测试数据管理

### 可用的测试数据

所有测试数据在 `e2e/fixtures/test-data.ts` 中定义：

```typescript
// 测试用户
TEST_USER_IDS.regular; // 普通用户
TEST_USER_IDS.admin; // 管理员

// 测试文章
TEST_POST_IDS.enPost1; // test-post-en-1 (有中文翻译)
TEST_POST_IDS.enPost2; // test-post-en-2 (无翻译)
TEST_POST_IDS.enPost3; // test-post-en-3 (分页测试)
TEST_POST_IDS.zhPost1; // test-post-zh-1 (有英文翻译)
TEST_POST_IDS.zhPost2; // test-post-zh-2 (无翻译)
TEST_POST_IDS.zhPost3; // test-post-zh-3 (分页测试)
```

### 重置特定数据

```typescript
import { resetLikesData } from "./fixtures/test-data";

test.beforeEach(async () => {
  // 重置点赞数据（测试隔离）
  await resetLikesData();

  // 可按需扩展更多重置逻辑
});
```

## Page Objects使用指南

### PostPage - 文章页面

```typescript
const postPage = new PostPage(page);

// 导航
await postPage.gotoPost("test-post-en-1"); // 英文文章
await postPage.gotoPost("test-post-zh-1", "zh"); // 中文文章

// 点赞功能
await postPage.clickLike();
const count = await postPage.getLikeCount();
const isDisabled = await postPage.isLikeButtonDisabled();

// SEO元数据
const og = await postPage.getOpenGraphTags();
const schema = await postPage.getJsonLdSchema();
const canonical = await postPage.getCanonicalUrl();
const hreflang = await postPage.getHreflangTags();

// 语言切换
const hasTranslation = await postPage.hasTranslation();
await postPage.switchLanguage();

// 断言helpers
await postPage.expectPostLoaded();
await postPage.expectLikeFeaturePresent();
```

### PostsListPage - 文章列表

```typescript
const postsListPage = new PostsListPage(page);

await postsListPage.gotoPostsList(); // 英文列表
await postsListPage.gotoPostsList("zh"); // 中文列表

const count = await postsListPage.getPostCount();
const postPage = await postsListPage.clickFirstPost();
const slug = await postsListPage.getPostSlug(0);
```

## 调试技巧

### 1. 使用Playwright Inspector

```bash
npx playwright test --debug
```

### 2. 查看测试执行trace

```bash
npx playwright test --trace on
npx playwright show-report
```

### 3. 截图调试

```typescript
test("debug test", async ({ page }) => {
  const postPage = new PostPage(page);
  await postPage.screenshot("before-click");
  await postPage.clickLike();
  await postPage.screenshot("after-click");
});
```

### 4. 暂停执行

```typescript
test("pause for inspection", async ({ page }) => {
  await page.pause(); // 暂停，手动检查
});
```

## 常见问题解决

### Q: 测试间歇性失败（flaky tests）

**原因**: 使用了硬编码的 `waitForTimeout()`
**解决**: 使用智能等待helpers

### Q: 测试依赖数据库状态失败

**原因**: 没有使用确定性测试数据
**解决**: 使用 `TEST_POST_IDS` 和 `resetXXXData()` 函数

### Q: 选择器频繁变化导致测试失败

**原因**: 使用了不稳定的CSS选择器
**解决**:

1. 优先使用 `data-testid` 属性
2. 使用role选择器
3. 使用Page Object封装选择器

### Q: 测试速度慢

**解决**:

1. 并行运行测试（默认启用）
2. 使用智能等待而非固定延迟
3. 重用认证状态（使用fixtures）

## CI/CD集成

### GitHub Actions示例

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 相关资源

- [Playwright官方文档](https://playwright.dev)
- [Page Object Model最佳实践](https://playwright.dev/docs/pom)
- [测试最佳实践](https://playwright.dev/docs/best-practices)

## 延伸阅读（本仓库）

- 本地分阶段全量执行（方案 B）手册：`../LOCAL_E2E_SCHEME_B_PLAYBOOK.md`
- 一次性全量执行与 CI/CD 最佳实践：`../E2E_BEST_PRACTICES_CI_CD.md`
