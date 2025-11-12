# 本地 E2E 分阶段全量执行（方案 B）作业手册

本手册说明在本地“如何科学地跑完整套 E2E（全量）”，以及在不同阶段（仅关键流程、新功能构建、全量体检）分别该怎么跑、什么标准算通过、如何控制时间。

适用仓库：Next.js + Prisma + Playwright（目录 `e2e/`）

---

## 0) 目标与原则

- 生产一致性优先：全量跑时尽量复用构建后的服务（或至少复用已启动的 dev server）。
- 先快后全：先用 Chromium 全量扫雷，再扩展到桌面矩阵与移动端，最后跑重型用例（性能/无障碍）。
- 分批控制时间：按阶段/浏览器/分片拆分，避免一次性长时间占用。
- 只保必要工件：失败时保留截图/trace，其他不额外生成，减少 IO 与时间（仓库默认已配置）。

---

## 1) 前置准备（一次到位）

```bash
# 环境变量（至少这几项），从示例复制
cp .env.example .env  # 或 .env.local

# 数据库与迁移
docker compose up -d postgres
npm run db:migrate

# 依赖与浏览器
npm ci
npx playwright install --with-deps

# （可选）先启动 dev server，后续阶段可复用
npm run dev
```

说明：

- Playwright 配置了 `reuseExistingServer: true`，如果本地 3000 端口已有服务，会复用而不重复构建/启动。
- 全量跑会在 `global-setup` 自动种子测试数据，在 `global-teardown` 自动清理；如需手工操作可用：`npm run test:e2e:seed` 与 `npm run test:e2e:cleanup`。

---

## 2) 仅跑关键流程（快速门禁）

适用时机

- 小改动（文案、样式、轻后端变更）想快速验证关键外部能力：i18n 路由、SEO 元数据、Sitemap。
- 提交/合并前的本地“十分钟内”自检。

操作步骤（二选一）

```bash
# A. 直接使用关键路径配置（推荐）
npx playwright test \
  --config=playwright.critical.config.ts \
  --workers=50% \
  --reporter=line

# B. 针对改进版用例文件（避免重复）
npx playwright test \
  e2e/i18n-routing-improved.spec.ts \
  e2e/seo-metadata-improved.spec.ts \
  e2e/sitemap-improved.spec.ts \
  --project=chromium --workers=50% --reporter=line
```

通过标准

- 0 失败；若允许一次重试，重试后 0 失败。
- 总墙钟时间 ≤ 10–20 分钟（取决于机器）。

时间控制建议

- 浏览器：Chromium 单项目即可。
- 并发：`--workers=50%`（逻辑核一半）；内存富余可提至 `75%`。
- 服务：提前 `npm run dev`，避免构建与重复启动浪费。

---

## 3) 仅跑“新构建功能”的相关测试（开发阶段）

适用时机

- 开发新功能或修 bug，想高频快速反馈，只跑与新改动直接相关的测试。
- 新增功能受 `FEATURE_*` 控制时，确保先在本地设置开关并验证降级/兜底状态（见 `docs/modular-development-playbook.md`）。

操作步骤（视情况组合使用）

```bash
# 跑单个/几个相关的测试文件（Chromium）
npx playwright test e2e/likes-improved.spec.ts --project=chromium --workers=50%

# 按测试标题关键字（-g）筛选子集
npx playwright test -g "should like a post" --project=chromium

# UI 调试模式（断点/逐步执行/录制）
npx playwright test --ui

# 需要认证数据或固定数据场景（可选）
npm run test:e2e:seed    # 种子
npm run test:e2e:cleanup # 清理
```

通过标准

- 新增/修改的相关测试全部通过，且不引入关键流程回归（建议顺带跑“仅关键流程”一轮）。

时间控制建议

- 浏览器：Chromium。
- 并发：`--workers=50%`；调试场景可降为 `--workers=1` 便于观察。
- 选择器/等待：优先 `data-testid` 与 `getByRole`；用 `waitForApiResponse`/`waitForNetworkIdle` 替代固定延时。

---

## 4) 本地“全量”执行（方案 B：分阶段）

适用时机

- 功能合入主干前、发布候选前、依赖/架构较大调整后。

分阶段流程

1. 阶段 1：Chromium 全量（快速扫雷）

```bash
npx playwright test e2e \
  --project=chromium \
  --workers=50% \
  --retries=1 \
  --reporter=line
```

期望：发现绝大多数问题，快速修复并复跑 `--last-failed` 确认。

2. 阶段 2：桌面矩阵（Firefox + WebKit）

```bash
npx playwright test e2e --project=firefox --workers=50% --reporter=line
npx playwright test e2e --project=webkit  --workers=50% --reporter=line
```

期望：补充布局/渲染差异问题。若资源紧张可串行执行两个命令。

3. 阶段 3：移动端视口（Mobile Chrome + Mobile Safari）

```bash
npx playwright test e2e --project="Mobile Chrome" --workers=50% --reporter=line
npx playwright test e2e --project="Mobile Safari" --workers=50% --reporter=line
```

期望：验证响应式与触控交互。若时间有限，可仅跑与改动相关的移动端用例。

4. 阶段 4：重型/长耗时（性能/无障碍）

```bash
npx playwright test \
  e2e/performance.spec.ts \
  e2e/accessibility.spec.ts \
  --project=chromium --workers=50% --reporter=line
```

期望：验证性能指标与可访问性。必要时单独在空闲时段执行。

通过标准（全量）

- 各阶段 0 失败；如允许 1 次重试，重试后 0 失败。
- 对已知不稳定的个别用例：需定位并修复；临时可记录为 flaky 并在夜间/回归强化观察，但发布前建议收敛。

时间控制建议（经验范围）

- 阶段 1：5–15 分钟；阶段 2：10–25 分钟；阶段 3：10–25 分钟；阶段 4：10–20 分钟（视机器性能和用例体量而定）。
- 统一使用 `--workers=50%`；机器内存富余可提高，但注意浏览器并发上限。
- 强烈建议提前 `npm run dev`，减少因重复构建/启动导致的额外时间。

可选：分片（Sharding）进一步控时

```bash
# 先启动 dev server，避免每片触发构建
npm run dev

# 以 4 片为例，分片串行或并行执行
npx playwright test --shard=1/4 --workers=50% --reporter=line
npx playwright test --shard=2/4 --workers=50% --reporter=line
npx playwright test --shard=3/4 --workers=50% --reporter=line
npx playwright test --shard=4/4 --workers=50% --reporter=line
```

---

## 5) 失败处理与稳定性建议

- 只重跑失败：`npx playwright test --last-failed --project=chromium`
- 调试：`npx playwright test --ui`、`--headed`、`--debug`，结合 trace 报告定位。
- 选择器：统一使用 `data-testid` 与 `getByRole`，避免脆弱匹配。
- 等待：优先 `waitForApiResponse`/`waitForNetworkIdle`，避免固定 `waitForTimeout()`。
- 断言稳定性：避免使用非原生断言（如 `toBeStable()`），可改为“可见 + 两次测量稳定”的自定义逻辑（两次 `boundingBox()` 或文本长度差值阈值）。
- 数据：全局 `seed/cleanup` 已内置；若用例之间有干扰，可在 `beforeEach` 使用提供的局部重置函数（如 likes）。

---

## 6) 快速命令清单（常用）

```bash
# 仅关键流程（快）
npx playwright test --config=playwright.critical.config.ts --workers=50% --reporter=line

# 开发阶段：只跑相关文件/用例（Chromium）
npx playwright test e2e/likes-improved.spec.ts --project=chromium --workers=50%
npx playwright test -g "should like a post" --project=chromium

# 全量阶段 1（Chromium）
npx playwright test e2e --project=chromium --workers=50% --retries=1 --reporter=line

# 全量阶段 2（桌面矩阵）
npx playwright test e2e --project=firefox --workers=50% --reporter=line
npx playwright test e2e --project=webkit  --workers=50% --reporter=line

# 全量阶段 3（移动端）
npx playwright test e2e --project="Mobile Chrome" --workers=50% --reporter=line
npx playwright test e2e --project="Mobile Safari" --workers=50% --reporter=line

# 全量阶段 4（重型用例）
npx playwright test e2e/performance.spec.ts e2e/accessibility.spec.ts \
  --project=chromium --workers=50% --reporter=line

# 报告查看（HTML）
npm run test:e2e:report
```

---

遵循本手册，你可以：

- 在日常开发中只跑相关用例快速迭代；
- 在提交/合并前用关键流程快速兜底；
- 在发布前按阶段跑完本地全量，兼顾覆盖与时间。
