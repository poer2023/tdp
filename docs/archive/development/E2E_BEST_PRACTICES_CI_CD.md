# 全面执行一次 E2E 与 GitHub Actions CI/CD 最佳实践

本文面向当前仓库（Next.js + Prisma + Playwright）。目标：在保证准确性的前提下，缩短执行时间、避免卡住，形成“PR 快而准、主干可扩展回归、夜间全量覆盖”的落地策略。

---

## 1) 概述与适用范围

- E2E 框架：Playwright（目录 `e2e/`）
- 关键配置：
  - `playwright.config.ts`（5 项目矩阵 + standalone 构建/启动）
  - `playwright.critical.config.ts`（关键路径子集，Chromium 为主）
  - 全局钩子：`e2e/global-setup.ts` 种子测试数据；`e2e/global-teardown.ts` 清理数据
  - 执行脚本：`scripts/run-e2e-tests.sh` 分组执行；`e2e/setup-and-start.sh` 构建并以 standalone 启动
- 数据依赖：Prisma + Postgres（`docker-compose.yml`），测试数据位于 `e2e/fixtures/test-data.ts`

推荐阅读：

- E2E 测试指南：`e2e/README.md`
- 全量规模化跑法：`E2E_SCALING_GUIDE.md`
- 已有覆盖与套件说明：`E2E_TEST_SUMMARY.md`

---

## 2) 本地一次性“全面执行”最佳实践

本节用于在本地科学地“跑通一次全量 E2E”，用于版本发布前的大体检。

1. 环境准备

```bash
# 复制环境并确保关键变量
cp .env.example .env  # 或 .env.local

# 数据库准备（推荐容器）
docker compose up -d postgres
npm run db:migrate

# 安装浏览器与依赖
npm ci
npx playwright install --with-deps
```

注意：

- `.env` 建议设置：
  - `DATABASE_URL` 指向可写测试库
  - `NEXTAUTH_URL=http://localhost:3000`
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  - `NEXTAUTH_SECRET` 可留空，E2E 登录工具会有测试默认值

2. 快速体检（Chromium 单项目）

```bash
# 先跑一次快速、可定位的问题集（建议）
npx playwright test \
  --project=chromium \
  --workers=50% \
  --retries=1 \
  --reporter=line
```

3. 全矩阵构建与执行（一次性全量）

```bash
# 使用主配置：会触发构建并以 standalone 启动
npm run test:e2e

# 或在 UI 模式观察：
npm run test:e2e:ui
```

说明：

- `playwright.config.ts` 采用 5 项目矩阵（Chromium/Firefox/WebKit + 2 移动设备），整体负载较大。
- `global-setup` 会自动种子测试数据；`global-teardown` 会清理测试数据。

4. 查看报告与工件

```bash
npm run test:e2e:report    # HTML 报告
# 可在 CI 中增开 json/junit 报告用于统计与看板
```

5. 专项/分组执行（定位问题）

```bash
bash scripts/run-e2e-tests.sh i18n
bash scripts/run-e2e-tests.sh likes
bash scripts/run-e2e-tests.sh auth
bash scripts/run-e2e-tests.sh sitemap
```

6. 稳定性与速度要点（必读）

- 选择器：优先 `data-testid` 与 `getByRole`，避免脆弱的层级/文本匹配
- 等待策略：使用 `e2e/helpers/wait-helpers.ts` 中的智能等待，避免固定 `waitForTimeout()`
- 数据隔离：尽量依赖 `e2e/fixtures/test-data.ts` 的种子与重置函数，避免对真实数据的隐式依赖
- 并发：本地建议 `--workers=50%`（逻辑核的一半）；内存富余可调至 `75%`
- 常见伪失败源：如遇到自定义 `toBeStable()` 一类非原生断言，请改为“可见 + 两次测量稳定”策略（两次 `boundingBox()` 或内容长度对比差值阈值）

---

## 3) 按价值分层执行（全流程基线）

通过“分层 + 精准门禁”实现“快而准”的 CI：

- Smoke（PR 必跑，< 10 分钟）：
  - `e2e/home.spec.ts`、`e2e/navigation.spec.ts`、`e2e/uploads.spec.ts`、`e2e/error-handling.spec.ts`
- Critical（PR 必跑，< 20 分钟，允许 1 次重试）：
  - `e2e/*-improved.spec.ts` + `e2e/public-tests.spec.ts`
  - 或直接使用 `playwright.critical.config.ts`
- Regression（合入主干触发，分片并行）：
  - 除上述外的其余 `e2e/*.spec.ts`（全量回归）
- Nightly（夜间定时）：
  - 5 项目全矩阵 + `e2e/performance.spec.ts` + `e2e/accessibility.spec.ts`

说明：

- PR 仅用 “Critical” 作为部署阻断门槛，既减少时长又保障核心能力；
- 主干回归与夜间任务非阻断部署，保证覆盖与可观察性。

---

## 4) GitHub Actions CI/CD 最佳实践

关键原则：

- 并发控制：使用 `concurrency` 取消同分支在跑的历史任务，避免排队与浪费
- 服务依赖：通过 `services` 启动 Postgres，并在测试前 `npm run db:migrate`
- 产物归档：始终上传 HTML/JSON/JUnit 报告，以利失败分桶、看板与趋势分析
- 时间止损：为 Job 设置 `timeout-minutes`；Critical 配置 `maxFailures` 快速止损
- 资源使用：`--workers=50%`，内存富余再提高；PR 仅 Chromium，主干/夜间再开启矩阵

### 4.1 PR 验证（阻断部署）

目标：10–20 分钟出结果，保障关键路径稳定。

```yaml
# .github/workflows/ci-pr.yml
name: CI (PR)
on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-pr-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: tdp
          POSTGRES_PASSWORD: tdp_password
          POSTGRES_DB: tdp
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U tdp" --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public

      # Lint / Types / Unit 可在此并行或串行
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:run

      # 关键路径 E2E（Chromium 单项目）
      - name: Run Critical E2E
        run: |
          npx playwright test \
            --config=playwright.critical.config.ts \
            --workers=50% \
            --reporter=line,junit,json
        env:
          NEXTAUTH_URL: http://localhost:3000
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
          DATABASE_URL: postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public

      - name: Upload Playwright Report (Critical)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-critical
          path: playwright-report-critical
      - name: Upload Test Results (Critical JSON)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-critical
          path: test-results-critical.json
```

建议：

- 若需与生产更一致，可把 `playwright.critical.config.ts` 的 `webServer.command` 改为 `bash e2e/setup-and-start.sh`（构建 + standalone 运行）

### 4.2 主干回归（全量分片并行，非阻断）

目标：在可控时间内完成全量回归，获得完整反馈但不阻断部署。

```yaml
# .github/workflows/e2e-regression.yml
name: E2E Regression (Main)
on:
  push:
    branches: [main]

concurrency:
  group: e2e-regression-${{ github.sha }}
  cancel-in-progress: false

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        shard: ["1/8", "2/8", "3/8", "4/8", "5/8", "6/8", "7/8", "8/8"]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: tdp
          POSTGRES_PASSWORD: tdp_password
          POSTGRES_DB: tdp
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U tdp" --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public

      - name: Run Sharded E2E (Full Suite)
        run: |
          npx playwright test \
            --workers=50% \
            --retries=1 \
            --shard=${{ matrix.shard }} \
            --reporter=line,junit,json
        env:
          NEXTAUTH_URL: http://localhost:3000
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
          DATABASE_URL: postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public

      - name: Upload Playwright Report (Shard)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report
```

### 4.3 夜间全量（五项目矩阵 + 性能/无障碍，非阻断）

目标：获得全面质量信号（浏览器矩阵 + 性能/可用性），为后续修复与优化提供依据。

```yaml
# .github/workflows/e2e-nightly.yml
name: E2E Nightly
on:
  schedule:
    - cron: "0 3 * * *" # 每日 03:00 UTC

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: tdp
          POSTGRES_PASSWORD: tdp_password
          POSTGRES_DB: tdp
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U tdp" --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public

      # 直接使用主配置（含 5 项目矩阵 + standalone 构建/启动）
      - name: Run Full Matrix E2E
        run: |
          npx playwright test \
            --reporter=line,junit,json
        env:
          NEXTAUTH_URL: http://localhost:3000
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
          DATABASE_URL: postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public

      - name: Upload Playwright Report (Nightly)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-nightly
          path: playwright-report
```

---

## 5) 失败分桶与修复闭环

建议在 CI 产出 JSON 报告（`--reporter=json`），基于“错误消息 + 文件 + 测试标题”分桶聚类，优先修“确定性失败”；对“重试后通过”的用例标记 flaky 并纳入观察周期。在主干/夜间中启用 `strategy.fail-fast: false` 保证信息完整性。

关键指标：通过率、flaky 率、平均/95/99 时长、Top N 失败簇、最慢用例 Top 20。

---

## 6) 性能与稳定性细节清单

- 并发：`--workers=50%` 为默认安全值；Node/浏览器内存富余后再调高
- 重试：CI 建议 `retries=1`（Critical 可到 2），Smoke 不重试
- 止损：Critical 套件启用 `maxFailures=3`，快速中止无效消耗
- 超时：Job 级 `timeout-minutes`；Playwright 级 `actionTimeout`/`navigationTimeout` 已在配置中抬高
- 选择器：`data-testid` 与 `getByRole`；封装 Page Object，减少选择器改动影响面
- 等待：优先 `waitForApiResponse()` / `waitForNetworkIdle()`；避免 `waitForTimeout()` 的固定延迟
- 数据：依赖 `global-setup` 种子 + 需要时的局部重置，避免跨用例状态泄漏
- 构建差异：PR 阶段可接受 dev server；关键门禁若需完全对齐生产，改用 `e2e/setup-and-start.sh`（构建 + standalone）

---

## 7) 一次性全量执行的建议流程（总结）

1. 启动数据库并迁移：`docker compose up -d postgres && npm run db:migrate`
2. 安装与准备：`npm ci && npx playwright install --with-deps`
3. 快速体检（Chromium）：`npx playwright test --project=chromium --workers=50% --retries=1`
4. 全矩阵一次性执行：`npm run test:e2e`
5. 查看报告：`npm run test:e2e:report`
6. 如有失败：
   - 先分组重跑（`scripts/run-e2e-tests.sh`）定位模块
   - 按“稳定性清单”优化（选择器/等待/数据隔离）
   - 必要时降并发或分片执行

---

## 8) FAQ（常见问题）

Q: CI 很慢或排队？

- A: 开启 `concurrency.cancel-in-progress`；PR 仅 Chromium + Critical；回归使用分片并行 + `--workers=50%`。

Q: 用例偶发失败（flaky）？

- A: 检查固定等待；切换为智能等待；检查选择器稳定性；低频波动标记 @quarantine 或移动到夜间。

Q: 数据污染或互相影响？

- A: 使用全局种子/清理与局部重置；每条用例唯一资源名前缀，避免跨用例状态泄漏。

Q: PR 门禁要与生产一致？

- A: 将 Critical 的 `webServer` 改为 `bash e2e/setup-and-start.sh`（构建 + standalone），提升一致性。

---

以上方案已与当前仓库结构与脚本深度对齐，可直接落地使用。如需，我方可进一步：

- 提交上述工作流文件至 `.github/workflows`；
- 将 Critical 门禁切换为 standalone 启动；
- 排查并替换潜在的非原生断言（如 `toBeStable()`）以降低伪失败率。
