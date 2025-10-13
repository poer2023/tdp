# 测试策略 Test Strategy

本文描述当前在 TDP 博客与相册项目中使用的测试分层、覆盖目标与 CI 管道。信息基于 2025-10-12 的工作流与脚本配置，可在 `package.json` 与 `.github/workflows/` 中查验。

---

## 目标

- 在本地与 CI 中均快速发现回归。
- 保持 Prisma 数据库迁移后的可重复测试环境。
- 通过覆盖率门槛约束关键业务逻辑的可靠性。
- 让 Playwright 关键路径用例覆盖真实用户流程，其余长尾场景由定时任务跑完。

---

## 测试分层

| 层级          | 工具                                         | 触发条件                                     | 关注点                               |
| ------------- | -------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| Lint / Format | ESLint、Prettier                             | 开发者本地、CI Critical Path、build-and-test | 代码风格、潜在错误                   |
| Type Check    | TypeScript (`npm run type-check`)            | 本地、CI                                     | 类型安全、API 契约                   |
| 单元测试      | Vitest (`npm run test:run`)                  | 本地、CI                                     | 纯函数、组件逻辑、工具方法           |
| 集成测试      | Vitest + Prisma (`npm run test:integration`) | 本地、CI                                     | API Route、服务层、数据库交互        |
| E2E 关键路径  | Playwright (`npm run test:e2e:critical`)     | 本地按需、CI Critical Path                   | 登录、内容创建、搜索等高价值用户旅程 |
| E2E 全量      | Playwright (`.github/workflows/e2e.yml`)     | 每 6 小时调度或手动                          | 长尾 UI 场景、跨浏览器差异           |

---

## 本地建议流程

1. 安装依赖并迁移数据库：`npm ci && npx prisma migrate deploy`（确保 `.env` 配置了 `DATABASE_URL`）。
2. 代码检查顺序：
   1. `npm run lint`
   2. `npm run type-check`
   3. `npm run test:run`
   4. `npm run test:integration`
   5. `npm run test:e2e:critical`（需要本地 PostgreSQL 与 `npx playwright install --with-deps`）
3. 若一次跑完可使用 `npm run test:all`。
4. 关键流程的种子数据位于 `e2e/utils/seed-test-data.ts`，必要时执行 `npm run test:e2e:seed` / `npm run test:e2e:cleanup`。

> 提示：Husky + lint-staged 会在 `git commit` 时运行 ESLint/Prettier（参见 `.lintstagedrc.json`），确保 commit 进入仓库前已经通过基础检查。

---

## 覆盖率要求

项目使用 `scripts/check-coverage.sh` 强制单元测试覆盖率阈值：

| 指标       | 最低百分比 |
| ---------- | ---------- |
| Lines      | 75%        |
| Statements | 75%        |
| Functions  | 70%        |
| Branches   | 70%        |

执行 `npm run test:coverage` 后将生成 `coverage/coverage-summary.json`，脚本会在门限下方时退出失败。集成测试会生成单独的覆盖率并在 CI 中作为 artifact 上传，便于分析。

---

## CI 工作流概览

### CI Critical Path (`.github/workflows/ci-critical.yml`)

- **触发**：PR 指向 `main`/`develop`、推送到 `main`。
- **流水线**：
  1. Lint & Prettier 检查。
  2. TypeScript 编译。
  3. 单元测试（PostgreSQL 16 容器 + Prisma migrate）。
  4. 集成测试（生成 Prisma Client，上传覆盖率）。
  5. Playwright 关键路径（Chromium，缓存浏览器，上传报告）。
  6. 生产构建 `npm run build`。
  7. 汇总报告写入 GHA step summary。
- **产出**：`integration-coverage-report`、`playwright-report-critical` 等 artifacts，以及 `<img>` 使用的 ESLint 警告（待后续优化）。

### build-and-test (`.github/workflows/build-and-test.yml`)

- **触发**：推送或 PR 至 `main`、`develop`、`feature/ui-optimization`。
- **内容**：在单一 Job 中串行执行迁移 → lint → type-check → 单元测试 → 集成测试 → 构建，并在失败时上传日志到 `ci/*.log`。
- **用途**：提供更快的串行回归检查，尤其对长期存在的分支十分有用。

### E2E Full Suite (`.github/workflows/e2e.yml`)

- **触发**：每 6 小时 + 手动。
- **策略**：Playwright 4 分片并行执行完整套件，失败不阻断 PR，但会生成日志与报告，便于长尾场景调试。

---

## 数据库与测试隔离

- CI 与本地均使用 Prisma 的 `migrate deploy` 执行 schema，同一测试 run 共享 `postgres:16` 容器。
- 测试环境的 `DATABASE_URL` 使用独立 schema，避免污染开发数据。
- Playwright 测试运行前会调用 API 和数据库种子脚本，结束后通过 cleanup 工具还原。

---

## 故障排查

- **Lint / Type Check 失败**：运行 `npm run lint` 或 `npm run type-check`，结合 `ci/*.log` 查看 CI 输出。
- **Vitest 失败**：本地执行对应命令，注意 Prisma 迁移是否成功，以及 `NEXTAUTH_SECRET` 是否设置。
- **Playwright 失败**：重现前执行 `npx playwright install --with-deps`，必要时查看 `playwright-report-critical` artifact。
- **覆盖率不足**：使用 `npm run test:coverage` 或 `npm run test:integration:coverage` 查看报告并补足薄弱文件。

---

## 参考

- 命令清单：`package.json`
- 覆盖率脚本：`scripts/check-coverage.sh`
- Playwright 配置：`playwright.config.ts`、`playwright.critical.config.ts`
- CI 配置：`.github/workflows/ci-critical.yml`、`build-and-test.yml`、`e2e.yml`

如需调整流程，请同步更新本文档及相关工作流文件。
