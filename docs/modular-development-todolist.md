# TDP 模块化改造待办清单

> 对应实施方案：参见《[模块化发布与功能开关实施方案](./modular-development-playbook.md)》

## 0. 项目现状评估（2025-02）

| 领域                    | 当前状况    | 说明                                                                                                                             |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 功能开关体系            | ✅ 完成     | 已建立基于 `.env` 的 `FEATURE_*` 开关体系，支持运行时动态控制功能上线。                                                          |
| 模块隔离                | ✅ 部分完成 | 凭据和仪表盘页面已使用 `dynamic` + Error Boundary 实现模块隔离，其他页面待梳理。                                                 |
| 降级 / 空态             | ⚠️ 不一致   | `E2E_SKIP_DB` 已用于 posts/gallery/search，但仪表盘、凭据等页面仅在局部加了 `try/catch`，返回结构尚未统一。                      |
| 测试分层                | ✅ 部分完成 | 已添加模块级脚本（`test:features`, `test:credentials`, `test:admin`）；`npm run lint`、`type-check` 当前仍因 legacy `any` 报错。 |
| Feature Switch 运维能力 | ❌ 缺失     | 无集中日志/监控，出问题只能查看终端日志；没有“关闭开关再观察”的流程。                                                            |
| 文档                    | ✅ 具备     | 已新增方案说明，但缺少与实施进度对应的 checklist。                                                                               |

已知痛点：

- 任何 Prisma 查询失败都会导致后台页面崩溃，需要手动捕获并兜底。
- Server Component 直接绑定事件处理器，SSR 时代容易报错，必须改成客户端组件。
- 现有 lint/type-check 在 `admin/credentials` 和 `admin/sync` 里有未解决的 `any` 与未使用变量。

---

## 1. 改造目标（精简版）

1. **开关化**：所有新/现有的实验性功能具备可控开关，默认关闭，问题时可秒级回滚。
2. **隔离化**：管理端与前台模块化拆分，动态加载 + Error Boundary 限制故障影响面。
3. **降级化**：数据库或外部依赖不可用时，页面展示空态或只读信息，不抛出未捕获异常。
4. **测试分层化**：开发阶段有模块级脚本，CI/主干按层级执行，降低全量测试频率。
5. **可观测化**：有日志/报警约定，开关启停留痕。

---

## 2. 待办清单（按阶段）

### Phase 0 - 基础设施铺设

- [x] 新增 `src/config/features.ts`、`src/components/feature-toggle.tsx`，并提供基础单测。 _(完成日期: 2025-02-10)_
- [x] 更新 `.env.example`、`.env.admin.example`，加入 `FEATURE_*` 变量示例和值说明。 _(完成日期: 2025-02-10)_
- [x] 在 `scripts/` 目录新增开关列举脚本（可选，如 `node scripts/list-features.ts`）。 _(完成日期: 2025-02-10)_

### Phase 1 - 管理端模块隔离

- [x] 将 `src/app/admin/credentials/page.tsx` 拆分为 Server + Client 组件： _(完成日期: 2025-02-10)_
  - Server 组件负责读取开关与数据。
  - Client 组件拆分交互（复用新建的 `CredentialFilters`）。
  - 使用 `dynamic` 懒加载主要内容，并加上 Error Boundary。
- [x] 同样处理 `src/app/admin/page.tsx`（仪表盘）： _(完成日期: 2025-02-10)_
  - 统计区块、最近列表改为独立动态组件。
  - 失败时显示骨架或"暂不可用"提示。
- [x] 梳理剩余 `admin` 子页面并模块化：
  - [x] 对 `src/app/admin/analytics` 页面建立动态入口与降级占位。 _(完成日期: 2025-02-10)_
  - [x] 对 `src/app/admin/gallery` 列表及上传对话框实现懒加载、FeatureToggle。 _(完成日期: 2025-02-10)_
  - [x] 对 `src/app/admin/posts`（列表/详情/编辑）拆分为 Server + Client 组件，确保交互逻辑不在 Server Component。 _(完成日期: 2025-02-10)_
  - [x] 对 `src/app/admin/sync`、`src/app/admin/export` 等工具页面评估是否需要独立开关或 Error Boundary。 _(完成日期: 2025-02-10)_
  - [x] 为上述页面编写最小冒烟测试脚本（Playwright 子集或 Vitest 组件测试），记录在 `package.json`。 _(完成日期: 2025-02-10)_
  - [x] 更新文档，列出每个页面对应的 Feature flag 与兜底策略。 _(完成日期: 2025-02-10)_

### Phase 2 - 降级与服务层抽象

- [x] 设计并实现 `src/lib/utils/db-fallback.ts`，统一处理 Prisma 异常并输出结构化日志。 _(完成日期: 2025-02-10)_
- [ ] 将 posts/gallery/search/credentials 等域逻辑迁移到该 fallback 工具，删除重复的 `try/catch`。
  - [x] Posts 模块使用 `withDbFallback` 统一处理查询兜底。(2025-02-10)
  - [x] Gallery 模块引入文件系统回退封装。(2025-02-10)
  - [x] Search 模块接入兜底逻辑。(2025-02-11) - 已有完整降级策略：E2E_SKIP_DB检查 + 多层搜索降级(全文→模糊→LIKE)
  - [x] Credentials 模块接入兜底逻辑。(2025-02-11)
- [x] 建立外部依赖降级规范： _(完成日期: 2025-02-11)_
  - [x] 对 Bilibili、Douban、Steam、HoYo API 定义统一的超时/重试逻辑。
  - [x] 提供默认返回值（空态数据结构）并记录在 `docs/external-api-degradation-guide.md`。
  - [x] 实现 `SyncResult` 错误编码与用户提示信息映射。
- [x] 为前端模块补齐空态组件与状态展示： _(完成日期: 2025-02-11)_
  - [x] `src/components/admin/recent-uploads` 与 `recent-posts` 支持 DB 为空或服务降级时的提示。
  - [x] `src/components/admin/dashboard-metrics` 与 `dashboard-activity` 添加"加载失败"视图。
  - [x] Gallery、Posts 页面加入 `Suspense` + `ErrorBoundary` 组合，兜底至空数据。
- [x] 编写降级相关的自动化测试（Vitest 单测 + Playwright 场景）覆盖"DB 不可用"与"外部接口失败"路径。 _(完成日期: 2025-02-11)_
  - [x] DB fallback utility 测试 (`src/lib/utils/__tests__/db-fallback.test.ts`)
  - [x] Frontend 组件降级测试 (recent-uploads, recent-posts, dashboard-metrics, dashboard-activity)
  - [x] E2E 降级场景测试 (`e2e/degradation.spec.ts`)

### Phase 3 - 测试与 CI 调整

- [x] 修复当前 lint/type-check 报错（`src/app/admin/credentials/[id]/page.tsx`、`new/page.tsx`、`sync/logs/page.tsx` 等 `any`）。 _(完成日期: 2025-02-11)_
- [x] 在 `package.json` 增加模块脚本： _(完成日期: 2025-02-10)_
  - `test:credentials`、`test:admin`、`test:features` 等，指向相关 Vitest/Playwright 子集。
- [x] CI 工作流（`.github/workflows/**`）更新： _(完成日期: 2025-02-11)_
  - PR 阶段运行 `lint + type-check + test:credentials`（已集成至 ci-critical.yml）。
  - 主干/定时任务继续跑 `test:e2e` 全量。
- [x] 在 `E2E_SCALING_GUIDE.md` 中补充对新脚本的引用。 _(完成日期: 2025-02-11)_

### Phase 4 - 运营与监控

- [x] 设计开关启停日志格式，例如 `console.info("[feature:on] adminCredentials", context)`。 _(完成日期: 2025-02-11)_
- [x] 在 `docs/` 新增"开关运维手册"（`docs/feature-flag-operations.md`）。 _(完成日期: 2025-02-11)_
- [ ] 若已有 Sentry/Logtail，补充标签（feature name + environment）；若没有，记下接入计划。
- [ ] 定义开关回滚流程：谁触发、如何记录、如何恢复（可存放在 `scripts/deploy-checklist.sh` 或单独文档）。

### Phase 5 - 验收与持续改进

- [ ] 设计“模块扩展模板”：
  - 包含功能开关、Server/Client 分离示例、降级占位符、测试脚本引用。
- [ ] 在团队 README 或 AGENTS.md 添加“提交 PR 前检查表”，要求包含：
  - 引用功能开关；
  - 增量测试命令；
  - 降级验证截图/说明。
- [ ] 建立季度回顾：检查所有开关的使用情况（关闭是否可删除、常开是否沉入默认逻辑）。

---

## 3. 依赖与资源

- **人员**：前端 1 名、后端 1 名、DevOps（或负责 CI 的开发者）1 名。
- **工具**：现有 Next.js/Prisma/Vitest/Playwright 体系即可，无需额外依赖。
- **时间预估**：
  - Phase 0~2：约 1.5 ~ 2 sprint（重点在页面拆分与兜底逻辑）。
  - Phase 3：与 Phase 2 并行，约 0.5 sprint。
  - Phase 4~5：视监控工具而定，可与业务开发穿插进行。

### Phase 2A - Credentials API & Steam Sync Hardening（新增）

- [x] 在 `src/app/api/admin/credentials/route.ts` 中补充管理员鉴权、请求体验证与错误分类。 _(完成日期: 2025-02-10)_
- [x] 创建凭据时统一生成 ID、更新时间戳，并对 `value` 进行加密存储，同时返回脱敏数据。 _(完成日期: 2025-02-10)_
- [x] 为 Steam 同步流程（`syncSteamData`、`syncAllPlatforms`、凭据触发器）接入数据库凭据（含解密逻辑），仅无凭据时才回退环境变量。 _(完成日期: 2025-02-10)_
- [x] 更新相关脚本/文档，新增测试覆盖“数据库凭据 → Steam API”的完整链路。 _(完成日期: 2025-02-10)_

---

## 4. 验收标准

1. `.env.example` 中的所有 `FEATURE_*` 变量均可在生产环境配置并被运行时代码读取。
2. 管理端页面在数据库不可用或手动关闭开关时，能够渲染友好提示，不崩溃。
3. `npm run lint && npm run type-check && npm run test:credentials` 成为 PR 默认自测组合。
4. `docs/` 中存在对应运维手册，记录开关策略与回滚步骤。
5. 功能上线讨论中必须引用对应开关名称，且 PR 模板/Checklist 有“确认开关状态”项。

---

## 5. 追踪建议

- 在项目 Issue/Project Board 上创建“Modularization”泳道，将上述任务拆解为具体 Issue。
- 每个 Issue 关联本清单中的编号（如 Phase 1-02），保持文档与实际进度一致。
- 完成后在本清单勾选 ✅ 并标注完成日期，方便后续审计与知识沉淀。

> 本文档会随着实施进展更新，完成 Phase 时请提交 PR 同步状态。
