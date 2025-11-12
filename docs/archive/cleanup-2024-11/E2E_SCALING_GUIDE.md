# E2E 大规模执行与修复指南（Playwright）

适用于当前仓库的 E2E 测试（Playwright）。目标是在 1600–1800 次用例执行规模下，实现可持续、稳定、可观察的执行与修复闭环，而无需一次性全量压垮本地/CI/AI。

---

## 1) 现状与约束（仓库特定）

- 框架与配置
  - 测试框架：Playwright，目录 `e2e/`
  - 多项目矩阵：`playwright.config.ts:42` 定义了 5 个 project（Chromium/Firefox/WebKit + 2 移动端），即每条用例 x5 执行
  - CI 并发：`playwright.config.ts:18` 在 CI 下强制 `workers: 1`（默认极慢，可被 CLI 参数覆盖）
  - 报告：配置为 `html`，可通过 CLI 覆盖为 `line,junit,json` 产出 CI 可读工件
  - Web 服务器：`webServer` 使用脚本 `e2e/setup-and-start.sh` 构建并以 standalone 启动

- 测试体量
  - 仓库内约 360+ 个 `test()`，在 5 个 project 上合计 ≈ 1800 次执行
  - 存在“改进版”与“基础版”重复用例（如 `*-improved.spec.ts` 与同名基础文件），PR 阶段应优先执行改进版，避免重复负载

- 数据依赖
  - 全局种子/清理：`e2e/global-setup.ts:1` → `seedTestData()`，`e2e/global-teardown.ts:1` → `cleanupTestData()`
  - 局部复位：`e2e/fixtures/test-data.ts:336` `resetCommentsData()` 过于收敛（仅按 id 前缀），不利于重复运行

---

## 2) 执行分层与测试集划分

按功能价值与波动性对测试分层，结合“文件模式”即可落地（无须改标签）：

- Smoke（PR 必跑，目标 < 10 分钟）
  - `e2e/home.spec.ts`
  - `e2e/navigation.spec.ts`
  - `e2e/uploads.spec.ts`
  - `e2e/error-handling.spec.ts`

- Critical（PR 必跑，目标 < 20 分钟，允许 1 次重试）
  - “改进版”功能文件，避免基础版重复：
    - `e2e/auth-improved.spec.ts`
    - `e2e/likes-improved.spec.ts`
    - `e2e/i18n-routing-improved.spec.ts`
    - `e2e/seo-metadata-improved.spec.ts`
    - `e2e/sitemap-improved.spec.ts`

  - 其他轻量公共校验：`e2e/public-tests.spec.ts`

- Regression（合并到主干触发；按分片并行跑全量）
  - 除上面文件外的其余 `e2e/*.spec.ts`

- Soak/Perf/A11y（夜间/定时）
  - `e2e/performance.spec.ts`
  - `e2e/accessibility.spec.ts`
  - 可选矩阵：5 个 project 全开、移动端专场

说明：如后续启用标签（`@smoke @critical @regression @quarantine`），可改用 `--grep` 精准选择；当前阶段以“文件分组”即可满足。

> **与模块化发布结合的建议**
>
> - 当新增模块受 `FEATURE_*` 控制时，先在本地按模块脚本（例如 `npm run test:credentials`）验证逻辑，再补充对应的 Playwright 子集（`e2e/admin-credentials*.spec.ts`）。
> - CI 层保留“Smoke + Critical”常态集，确保核心路径独立于实验性开关；全量集回归时，可在 `global-setup` 中显式开启需要验证的功能开关。
> - 详细的功能开关与降级实现见 [docs/modular-development-playbook.md](docs/modular-development-playbook.md)。

---

## 3) 推荐跑法与命令速查（不改代码）

PR（Chromium 单项目，减少墙钟时间）：

```bash
# 仅 Smoke（极快）
npx playwright test \
  e2e/home.spec.ts \
  e2e/navigation.spec.ts \
  e2e/uploads.spec.ts \
  e2e/error-handling.spec.ts \
  --project=chromium --workers=50% --retries=0 --reporter=line

# Smoke + Critical（PR 默认建议）
npx playwright test \
  e2e/*-improved.spec.ts \
  e2e/uploads.spec.ts e2e/error-handling.spec.ts e2e/public-tests.spec.ts \
  --project=chromium --workers=50% --retries=1 \
  --reporter=line,junit --output=test-results
```

合并到主干（全量回归 + 分片并行）：

```bash
# 以 8 片为例（CI 并行 8 个 Job）
npx playwright test --workers=50% --retries=1 --shard=1/8 --reporter=line,junit
# 其余 Job 依次 --shard=2/8 ... --shard=8/8
```

夜间/定时（全矩阵 + 性能/可用性）：

```bash
# 5 项目全开（配置已定义），包含耗时用例
npx playwright test e2e --retries=1 --reporter=line,junit \
  --grep-invert "@quarantine"  # 如后续使用隔离标签
```

注意：配置文件在 CI 下强制 `workers:1`（`playwright.config.ts:18`），可用 CLI `--workers=50%` 覆盖，显著降低墙钟时间。

---

## 4) 分片与并行（Sharding）

- 原理与目标
  - 先按“文件均分”启动，收集一次时长后改为“基于历史时长的均衡装箱”，避免长尾
- 建议并发
  - 单机并发 `--workers=50%`（CPU 逻辑核的一半），内存足够可提至 `75%`
- 列出测试与估算
  - 列出用例：`npx playwright test --list --project=chromium`
  - 统计失败重跑：`npx playwright test --last-failed --project=chromium`

GitHub Actions 矩阵示例（片段）：

```yaml
jobs:
  e2e:
    strategy:
      matrix:
        shard: ["1/8", "2/8", "3/8", "4/8", "5/8", "6/8", "7/8", "8/8"]
    steps:
      - run: npx playwright install --with-deps
      - run: npx playwright test --workers=50% --retries=1 --shard=${{ matrix.shard }} --reporter=line,junit
```

---

## 5) 失败归因与分桶（Flaky 管理）

报告与工件（不改配置文件，通过 CLI 覆盖）：

```bash
npx playwright test --reporter=line,json,junit --output=test-results
```

用 `jq` 对 `json` 报告做失败分桶（按“错误消息 + 顶层文件 + 测试标题”）：

```bash
jq -r '
  .suites[]? as $s |
  ($s.specs[]? | .title as $title |
    .tests[]? | select(.outcome=="failed") |
    .results[]? | .error as $e |
    {title:$title, file:$s.file, message:($e?.message // "")}
  )
' test-results/report.json \
| jq -s 'group_by(.message)[ ] | {signature: .[0].message, count: length, samples: [.[:3][] | {file, title}]}'
```

建议流程：

- PR：失败不重试的 Smoke 直接阻断；Critical 允许 1 次重试并打 Flaky 标记
- 主干/夜间：统计“重试前失败率/重试后通过率/确定性失败列表”，优先修“确定性失败”

---

## 6) 数据管理与隔离

- 全局种子与清理
  - `e2e/global-setup.ts:1` → `seedTestData()`
  - `e2e/global-teardown.ts:1` → `cleanupTestData()`
- 局部复位建议
  - 现状：`resetCommentsData()` 仅按 `id` 前缀清理（`e2e/fixtures/test-data.ts:336`），无法覆盖动态生成内容
  - 建议：增加按 `postId in TEST_POST_IDS` 或 `authorId in TEST_USER_IDS` 的删除条件；或使用“内容前缀 + 时间阈值”组合
- 测试隔离原则
  - 每条用例生成唯一资源名（如内容前缀 `E2E-<timestamp>-...`）便于回收
  - 避免跨用例状态泄漏（登录/缓存/本地存储/DB 变更）

---

## 7) 稳定性准则（Playwright 实操）

- 选择器
  - 优先 `getByRole`/`getByTestId`（配置已启用 `testIdAttribute: data-testid`，见 `playwright.config.ts:38-39`）
  - 减少 `getByText()` 脆弱匹配
- 等待策略
  - 互动 → 等待对应 API 响应 + 局部稳定，不用固定 `waitForTimeout`
  - 已提供：`waitForApiResponse()`、`waitForNetworkIdle()`（`e2e/helpers/wait-helpers.ts:22`、`:14`）
- 仅失败保留工件
  - 截图：`screenshot: "only-on-failure"`
  - Trace：`trace: "on-first-retry"`

---

## 8) 高优先修复清单（仓库特定）

以下问题会直接导致“假失败/无效断言/测试不可重复”，建议排在首位修复：

1. 不存在的断言 API：`toBeStable()`
   - 位置：`e2e/helpers/wait-helpers.ts:31-33`、`e2e/helpers/assertion-helpers.ts:131-133`
   - 影响：Playwright 并无 `toBeStable()`，将抛出断言方法不存在或始终失败
   - 建议：改为“可见 + 稳定检测”的组合（示例思路）
     - 轮询两次 `boundingBox()` 或文本/尺寸变化，差值 < 阈值即视为稳定

2. 页面对象属性名不匹配（`title` vs `postTitle`）
   - 位置：`e2e/i18n-routing-improved.spec.ts:139-151` 使用 `postPage.title`；页面对象定义为 `postTitle`（`e2e/pages/post-page.ts:20-24`）
   - 影响：运行期报错或恒为 `undefined`
   - 建议：统一为 `postTitle`

3. 返回类型与断言不匹配（通用）
   - 示例：函数返回 `Locator`，却用 `toBe(true)` 断言
   - 建议：直接依赖函数内部可见性断言，或改为 `await expect(locator.first()).toBeVisible()`

4. 局部数据复位过窄（通用）
   - 建议：清理测试数据时增加限定条件，如 `postId in TEST_POST_IDS` 或 `authorId in TEST_USER_IDS`

5. 恒真/弱断言清理（提升信噪比）
   - 示例：`toBeDefined()`、`toBeGreaterThanOrEqual(0)` 等对可选功能的“占位断言”
   - 建议：改为“显式条件 + 明确分支行为”（存在则严谨断言，不存在则 `test.skip` 或记录）

---

## 9) 质量门禁与指标

- PR 阶段
  - Smoke 通过率 ≥ 99%，不允许重试
  - Critical 通过率 ≥ 98%，允许 1 次重试；重试通过计为 Flaky
- 主干/夜间
  - 全量通过率（不计重试）≥ 95%
  - 指标看板：通过率、Flaky 率、平均/95/99 时长、Top N 失败簇、最慢用例 Top 20

---

## 10) 两周落地计划

- 第 1–2 天：按“分层与跑法”执行；PR 仅 Chromium + 改进版；夜间跑矩阵
- 第 3–5 天：修复“高优先清单”四项；启用 `--reporter=json` 并上线失败分桶
- 第 6–10 天：隔离高波动/高耗时用例；优化最慢前 10% 的等待与选择器
- 第 11–14 天：历史时长驱动的均衡分片；完善仪表盘与质量门禁

---

## 11) AI 辅助使用建议

- 分批输入：以“失败分桶/同目录/同主题”10–30 条为单位
- 提供必要上下文：失败日志、对应测试文件、页面对象、相关 Helper、复现命令
- 优先解决“模式类问题”：等待策略、选择器规范、数据复位与隔离；随后处理个例

---

## 12) 常用命令备忘

- 列测试：`npx playwright test --list --project=chromium`
- 仅跑上次失败：`npx playwright test --last-failed --project=chromium`
- 只跑某文件/目录：`npx playwright test e2e/likes-improved.spec.ts --project=chromium`
- 生成并查看报告：
  - 运行：`npx playwright test --reporter=line,junit,json --output=test-results`
  - 查看 HTML：`npm run test:e2e:report`

---

## 13) FAQ

Q: CI 很慢怎么办？

- A: 用 CLI 覆盖 `--workers=50%`，并对回归测试使用 `--shard=N/M` 分片并行。

Q: PR 阶段要不要跑性能/可用性测试？

- A: 不建议。移至夜间/定时；PR 仅保功能正确性（Smoke+Critical）。

Q: “改进版”与“基础版”重复测试如何取舍？

- A: PR 阶段仅跑 `*-improved.spec.ts`；合并到主干和夜间再跑基础版补充覆盖（如确有价值）。

---

以上方案均可在“无需修改代码”前提下，通过命令参数与任务编排落地。若需要，我可以提供你们 CI 平台的完整工作流文件示例，或为失败分桶/最慢用例生成统计脚本样例。
