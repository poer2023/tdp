# E2E CI/CD 配置完整指南

## 📋 目录

1. [配置概览](#配置概览)
2. [触发策略详解](#触发策略详解)
3. [开发工作流程](#开发工作流程)
4. [分支保护设置](#分支保护设置)
5. [配置原理说明](#配置原理说明)
6. [常见问题解答](#常见问题解答)
7. [最佳实践总结](#最佳实践总结)

---

## 配置概览

### 当前配置架构

```
┌─────────────────────────────────────────────────────────┐
│                    开发工作流程                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Feature Branch → PR → Critical Tests → Review         │
│                                    ↓                    │
│                              Merge to Main              │
│                                    ↓                    │
│                         Full E2E Tests (3 triggers)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 测试分层策略

| 测试层级         | 触发时机             | 测试范围        | 执行时长   | 阻断部署 |
| ---------------- | -------------------- | --------------- | ---------- | -------- |
| **Critical E2E** | 每次 PR              | ~60-80 核心测试 | <20 分钟   | ✅ 是    |
| **Full E2E**     | main 变更 + 每日定时 | 全部 314 测试   | 15-20 分钟 | ❌ 否    |

---

## 触发策略详解

### Full E2E Suite 三种触发方式

#### 1. ⭐ 核心触发：main 分支代码变更

**配置**:

```yaml
push:
  branches: [main]
  paths-ignore:
    - "**.md" # 忽略文档变更
    - "docs/**"
    - ".github/workflows/**" # 忽略工作流配置变更
```

**触发条件**:

- ✅ 业务代码推送到 main（如 `src/auth.ts`）
- ✅ 配置文件变更（如 `next.config.js`）
- ✅ 依赖更新（如 `package.json`）
- ❌ 仅修改 Markdown 文档（如 `README.md`）
- ❌ 仅修改 docs 目录内容
- ❌ 仅修改 GitHub Actions 工作流

**使用场景**:

```bash
# 场景 1: 修改业务代码
git add src/auth.ts
git commit -m "feat: add authentication"
git push origin main
# → ✅ 触发 Full E2E Suite

# 场景 2: 只更新文档
git add README.md
git commit -m "docs: update readme"
git push origin main
# → ❌ 不触发 Full E2E Suite（节省资源）

# 场景 3: 同时修改代码和文档
git add src/auth.ts README.md
git commit -m "feat: add auth + update docs"
git push origin main
# → ✅ 触发 Full E2E Suite（因为包含业务代码）
```

**设计原理**:

- **即时反馈**: 代码合并到 main 后立即验证，发现问题时影响面最小
- **资源优化**: 文档变更不影响功能，无需跑测试
- **与开发节奏同步**: 代码变更频率 = 测试频率

---

#### 2. 🛡️ 兜底检查：每日定时运行

**配置**:

```yaml
schedule:
  - cron: "0 18 * * *" # UTC 18:00 = 北京时间 02:00
```

**时间说明**:

- **UTC 时间**: 18:00
- **北京时间**: 次日 02:00（UTC+8）
- **执行频率**: 每天 1 次

**为什么选择凌晨 2 点**:

1. ✅ 夜间执行，不占用白天 CI/CD 资源
2. ✅ 开发者早上上班时可看到测试报告
3. ✅ 避开业务高峰期（如果涉及外部服务）

**使用场景**:

这个定时任务的价值在于捕获**非代码因素引起的问题**：

| 问题类型          | 示例                                               | 如何发现                               |
| ----------------- | -------------------------------------------------- | -------------------------------------- |
| **依赖更新**      | npm registry 上某个依赖发布新版本，lockfile 未锁定 | 定时测试拉取最新版本，发现兼容性问题   |
| **外部 API 变化** | Google OAuth API 接口变更                          | 定时测试调用外部服务，发现 401 错误    |
| **时区相关问题**  | 定时任务在特定时间点触发的逻辑                     | 每日固定时间测试，发现时区计算错误     |
| **数据库迁移**    | Prisma schema 变更后未正确迁移                     | 定时测试连接数据库，发现 schema 不匹配 |
| **环境配置漂移**  | CI 环境的 Node.js 版本升级                         | 定时测试运行在最新环境，发现不兼容     |

**实际案例**:

```
周五下午 5:00  - 最后一次代码推送，Full E2E 通过 ✅
周六 - 周日    - 无代码变更，但 npm 上 @types/node 发布新版本
周一凌晨 2:00  - 定时 Full E2E 运行，发现类型错误 ❌
周一早上 9:00  - 开发者看到失败报告，立即修复
```

如果没有定时任务，这个问题可能要等到下次有人推送代码时才被发现。

---

#### 3. 🔧 手动触发：按需执行

**配置**:

```yaml
workflow_dispatch: # 允许手动触发
```

**使用方式**:

**方法 1: GitHub UI**

1. 访问 `https://github.com/your-org/your-repo/actions`
2. 点击左侧 "E2E Full Suite (Non-blocking)"
3. 点击右侧 "Run workflow" 按钮
4. 选择分支（通常是 main）
5. 点击 "Run workflow" 确认

**方法 2: GitHub CLI**

```bash
gh workflow run e2e.yml
```

**使用场景**:

| 场景           | 说明                                         |
| -------------- | -------------------------------------------- |
| **发布前验证** | 准备发布 v2.0，手动触发全量测试确保质量      |
| **回归测试**   | 修复了 3 个 Bug，想立即验证而不等定时任务    |
| **问题调查**   | 生产环境报告某个问题，手动触发测试复现       |
| **配置验证**   | 刚修改了 Playwright 配置，想立即验证是否生效 |
| **演示准备**   | 明天要 Demo，提前跑一次确保所有测试通过      |

---

## 开发工作流程

### 标准 PR 工作流（推荐）

#### 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│                        开发流程                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. 创建功能分支                                             │
│    git checkout -b feature/add-auth                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 开发 + 本地测试                                          │
│    npm run dev                                              │
│    npm run test:e2e:critical (可选)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 提交并推送到远程                                         │
│    git add .                                                │
│    git commit -m "feat: add authentication"                 │
│    git push origin feature/add-auth                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. 在 GitHub 创建 Pull Request                              │
│    - Title: feat: add authentication                        │
│    - Description: 实现用户登录功能                          │
│    - Reviewers: 指定审核人                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CI 自动运行 (ci-critical.yml)                           │
│    ├─ Lint & Format Check        (~2 分钟)                 │
│    ├─ TypeScript Type Check      (~2 分钟)                 │
│    ├─ Unit Tests                 (~3 分钟)                 │
│    ├─ Critical E2E Tests         (~8 分钟)                 │
│    └─ Build Application          (~3 分钟)                 │
│    Total: ~18 分钟                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
              ✅ 通过            ❌ 失败
                   │                 │
                   │                 ▼
                   │    ┌─────────────────────────┐
                   │    │ 6a. 修复问题            │
                   │    │     git add .           │
                   │    │     git commit -m "fix" │
                   │    │     git push            │
                   │    └─────────────────────────┘
                   │                 │
                   │                 ▼
                   │         返回步骤 5 重新测试
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6b. Code Review                                             │
│     - 审核人检查代码质量                                    │
│     - 提出修改建议或批准                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. 合并到 main 分支                                         │
│    - GitHub UI: 点击 "Merge pull request"                  │
│    - 或使用 Squash merge / Rebase merge                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Full E2E Suite 自动触发 (e2e.yml)                       │
│    ├─ Setup (安装依赖、浏览器)   (~3 分钟)                │
│    ├─ Shard 1/4 (78 tests)        (~5 分钟)                │
│    ├─ Shard 2/4 (78 tests)        (~5 分钟)                │
│    ├─ Shard 3/4 (79 tests)        (~5 分钟)                │
│    └─ Shard 4/4 (79 tests)        (~5 分钟)                │
│    Total: ~18 分钟 (并行执行)                               │
│    continue-on-error: true (失败不阻断)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
              ✅ 通过            ❌ 失败
                   │                 │
                   │                 ▼
                   │    ┌─────────────────────────────────────┐
                   │    │ 9a. GitHub 自动创建 Issue          │
                   │    │     - 标题: E2E Tests Failure      │
                   │    │     - 标签: e2e, test-failure      │
                   │    │     - 包含失败详情和日志链接       │
                   │    └─────────────────────────────────────┘
                   │                 │
                   │                 ▼
                   │         开发者修复 → 推送 → 循环
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 9b. 部署到生产环境 (deploy.yml)                            │
│     - 所有测试通过                                          │
│     - 自动部署或手动批准部署                                │
└─────────────────────────────────────────────────────────────┘
```

#### 详细命令示例

```bash
# ============================================
# 场景 1: 新功能开发
# ============================================

# 1. 确保 main 分支最新
git checkout main
git pull origin main

# 2. 创建功能分支（命名规范：feature/描述）
git checkout -b feature/add-password-reset

# 3. 开发代码
# ... 编写代码 ...

# 4. 本地测试（可选但推荐）
npm run lint                  # 检查代码规范
npm run type-check            # 检查 TypeScript 类型
npm run test:run              # 运行单元测试
npm run test:e2e:critical     # 运行关键 E2E 测试（可选）

# 5. 提交代码
git add .
git commit -m "feat: add password reset functionality

- Implement password reset form
- Add email verification flow
- Update user settings page"

# 6. 推送到远程
git push origin feature/add-password-reset

# 7. 在 GitHub 创建 PR
# 访问 https://github.com/your-org/your-repo/compare/main...feature/add-password-reset
# 或使用 GitHub CLI:
gh pr create --title "feat: add password reset functionality" \
             --body "实现密码重置功能，包括邮件验证流程"

# ============================================
# 场景 2: Bug 修复
# ============================================

# 1. 创建修复分支（命名规范：fix/描述）
git checkout -b fix/login-redirect-issue

# 2. 修复代码
# ... 修复 Bug ...

# 3. 提交
git add .
git commit -m "fix: correct login redirect to dashboard

Issue: Users were redirected to 404 after login
Solution: Update redirect URL in auth callback"

# 4. 推送并创建 PR
git push origin fix/login-redirect-issue
gh pr create --title "fix: correct login redirect"

# ============================================
# 场景 3: PR 有修改建议
# ============================================

# Review 要求修改后，继续在同一分支开发
git add .
git commit -m "refactor: extract validation logic per review feedback"
git push origin feature/add-password-reset
# → 自动更新现有 PR，重新触发 CI

# ============================================
# 场景 4: 同步 main 分支最新代码
# ============================================

# 如果 main 分支有更新，需要同步到功能分支
git checkout main
git pull origin main
git checkout feature/add-password-reset
git rebase main  # 或使用 git merge main
git push origin feature/add-password-reset --force-with-lease
```

---

### 紧急情况：直接推送 main（不推荐）

> ⚠️ **警告**: 仅在紧急修复生产问题时使用，跳过 Code Review 会增加风险

```bash
# 1. 在 main 分支修复
git checkout main
git pull origin main

# 2. 紧急修复
# ... 修改代码 ...

# 3. 提交并推送
git add .
git commit -m "hotfix: critical security patch for CVE-2024-XXXX"
git push origin main
# → 立即触发 Full E2E Suite

# 4. 监控测试结果
gh run list --limit 1
gh run watch
```

---

## 分支保护设置

### 为什么需要分支保护

**问题场景**:

```bash
# ❌ 没有分支保护
git checkout main
git add .
git commit -m "快速修复"
git push origin main
# → 未经测试的代码直接进入 main，可能破坏生产环境
```

**有分支保护后**:

```bash
# ✅ 有分支保护
git checkout main
git add .
git commit -m "快速修复"
git push origin main
# → GitHub 拒绝推送: "protected branch requires a pull request"
```

---

### 配置步骤（GitHub UI）

#### 1. 进入仓库设置

1. 访问仓库主页
2. 点击 **Settings** 标签
3. 左侧菜单选择 **Branches**

#### 2. 添加分支保护规则

1. 点击 **Add branch protection rule**
2. Branch name pattern 填写: `main`

#### 3. 推荐配置项

```
┌─────────────────────────────────────────────────────────────┐
│ Branch Protection Rule for main                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ☑️ Require a pull request before merging                   │
│    ├─ ☑️ Require approvals: 1                              │
│    ├─ ☑️ Dismiss stale pull request approvals when new     │
│    │      commits are pushed                               │
│    └─ ☐ Require review from Code Owners                    │
│                                                             │
│ ☑️ Require status checks to pass before merging            │
│    ├─ ☑️ Require branches to be up to date before merging  │
│    └─ Status checks (搜索并选择):                          │
│       ├─ ✅ Lint and Format Check                          │
│       ├─ ✅ TypeScript Type Check                          │
│       ├─ ✅ Unit Tests                                     │
│       ├─ ✅ Critical E2E Tests                             │
│       └─ ✅ Build Application                              │
│                                                             │
│ ☑️ Require conversation resolution before merging          │
│    (所有 Review 意见必须解决)                              │
│                                                             │
│ ☐ Require signed commits (可选，提高安全性)               │
│                                                             │
│ ☐ Require linear history (可选，保持提交历史整洁)         │
│                                                             │
│ ☐ Include administrators (建议不勾选，方便紧急修复)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4. 保存配置

点击 **Create** 按钮保存

---

### 配置效果验证

**测试 1: 直接推送被拒绝**

```bash
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test"
git push origin main

# 预期输出:
# remote: error: GH006: Protected branch update failed for refs/heads/main.
# remote: error: At least 1 approving review is required by reviewers
```

**测试 2: 通过 PR 可以合并**

```bash
git checkout -b test/branch-protection
echo "test" >> test.txt
git add test.txt
git commit -m "test branch protection"
git push origin test/branch-protection
gh pr create --title "Test branch protection"
# → PR 创建成功，CI 开始运行
# → Review 批准后可以合并
```

---

### 团队规模建议

| 团队规模                | 推荐配置                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| **1 人（个人项目）**    | 可选配置，建议至少要求 Status Checks                               |
| **2-5 人（小团队）**    | 要求 PR + 1 个 Approval + Status Checks                            |
| **6-20 人（中型团队）** | 要求 PR + 2 个 Approvals + Status Checks + Conversation Resolution |
| **20+ 人（大型团队）**  | 全部配置 + Code Owners + Signed Commits                            |

---

## 配置原理说明

### 为什么采用这个触发策略

#### 问题背景

之前的配置存在以下问题：

```yaml
# ❌ 旧配置
on:
  schedule:
    - cron: "0 */6 * * *" # 每 6 小时一次
  push:
    branches: [main]
    paths:
      - "e2e/**" # 仅当 E2E 测试变更时触发
```

**问题分析**:

1. **与开发节奏脱节**
   - 一天无代码变更，仍跑 4 次测试（浪费）
   - 一天 10 次推送，只在固定时间跑 4 次（可能漏测）

2. **反馈延迟严重**

   ```
   10:00 - 推送有问题的代码
   12:00 - 定时任务发现问题（延迟 2 小时）
   期间 - 基于错误代码继续开发，影响面扩大
   ```

3. **资源浪费**
   - 夜间/周末无人开发时仍在跑测试
   - GitHub Actions 免费额度浪费

---

#### 新配置优势

```yaml
# ✅ 新配置
on:
  push:
    branches: [main]
    paths-ignore: ["**.md", "docs/**", ".github/workflows/**"]
  schedule:
    - cron: "0 18 * * *"
  workflow_dispatch:
```

**优势对比**:

| 维度         | 旧配置（每 6 小时） | 新配置（main push + 每日） | 提升    |
| ------------ | ------------------- | -------------------------- | ------- |
| **及时性**   | 最多延迟 6 小时     | 代码推送立即反馈           | ⬆️ 90%  |
| **资源消耗** | 4 次/天（固定）     | 0-N 次/天（按需）          | ⬇️ 40%  |
| **问题覆盖** | 仅代码变更          | 代码 + 环境 + 依赖         | ⬆️ 全面 |
| **开发体验** | 等待定时任务        | 推送即测试                 | ⬆️ 显著 |

---

### paths-ignore 的作用

#### 场景对比

**场景 1: 没有 paths-ignore**

```bash
# 修改文档
git add README.md
git commit -m "docs: update readme"
git push origin main
# → 触发 Full E2E Suite（浪费 20 分钟 + CI 资源）
```

**场景 2: 有 paths-ignore**

```bash
# 修改文档
git add README.md
git commit -m "docs: update readme"
git push origin main
# → 不触发 Full E2E Suite（节省资源）

# 修改业务代码
git add src/auth.ts
git commit -m "feat: add auth"
git push origin main
# → 触发 Full E2E Suite（正确行为）
```

#### 资源节省计算

假设每天有：

- 3 次代码推送（需要测试）
- 5 次文档更新（不需要测试）

```
没有 paths-ignore:
8 次推送 × 20 分钟 = 160 分钟

有 paths-ignore:
3 次推送 × 20 分钟 = 60 分钟

节省: 100 分钟（62.5%）
```

---

### 定时任务的价值

#### 捕获的问题类型

**1. 依赖更新问题**

```
周五 17:00  - 最后一次推送，测试通过 ✅
周五 20:00  - npm registry 上 next 发布 14.2.1（破坏性变更）
周六-周日   - 无人工作
周一 02:00  - 定时测试，npm ci 拉取最新版本，发现不兼容 ❌
周一 09:00  - 开发者收到警报，锁定版本号
```

**2. 外部服务变化**

```
周三 15:00  - 代码推送，测试通过 ✅
周三 23:00  - Google OAuth API 废弃旧版本端点
周四 02:00  - 定时测试，发现 401 Unauthorized ❌
周四 09:00  - 升级到新版本 OAuth SDK
```

**3. 时区相关 Bug**

```javascript
// 代码中有这样的逻辑
function shouldRunDailyTask() {
  const hour = new Date().getHours();
  return hour === 2; // 期望在凌晨 2 点运行
}

// 问题: 在不同时区可能失效
```

定时测试每天凌晨 2 点运行，恰好覆盖这个场景。

---

### 分片并行的原理

#### 原理图

```
不分片（串行执行）:
┌─────────────────────────────────────────────────────────┐
│ 314 tests × 1 worker = 314 次串行执行                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ 预计时间: 60+ 分钟                                      │
└─────────────────────────────────────────────────────────┘

分片（并行执行）:
┌─────────────────────────────────────────────────────────┐
│ Shard 1/4:  78 tests   ━━━━━━━━━━━━━━━ (15 分钟)      │
│ Shard 2/4:  78 tests   ━━━━━━━━━━━━━━━ (15 分钟)      │
│ Shard 3/4:  79 tests   ━━━━━━━━━━━━━━━ (15 分钟)      │
│ Shard 4/4:  79 tests   ━━━━━━━━━━━━━━━ (15 分钟)      │
│ 预计时间: 15-20 分钟 (75% 时间节省)                     │
└─────────────────────────────────────────────────────────┘
```

#### 配置详解

```yaml
strategy:
  fail-fast: false # 一个 shard 失败不停止其他 shard
  matrix:
    shard: ["1/4", "2/4", "3/4", "4/4"]
```

```bash
# Shard 1/4 执行的测试
npx playwright test --shard=1/4
# → 执行测试 1-78

# Shard 2/4 执行的测试
npx playwright test --shard=2/4
# → 执行测试 79-156

# ...以此类推
```

---

## 常见问题解答

### Q1: 为什么 Full E2E 设置 `continue-on-error: true`？

**回答**:

```yaml
continue-on-error: true # 失败不阻断部署
```

**原因**:

1. **已有 Critical 测试门禁**
   - PR 阶段已运行核心测试（~60-80 个）
   - 覆盖最重要的用户路径
   - 失败会阻止合并

2. **Full Suite 定位是监控**
   - 用于发现边缘场景问题
   - 非核心功能失败不应阻止整个部署

3. **避免误报阻断开发**
   - E2E 测试可能因环境问题偶发失败（如网络抖动）
   - 失败会创建 Issue 提醒，而不是直接阻断

**对比**:

```yaml
# ci-critical.yml (阻断式)
e2e-critical:
  timeout-minutes: 20
  # 无 continue-on-error，失败会阻止 build job 运行

build:
  needs: [lint-and-format, type-check, unit-test, e2e-critical]
  # Critical 测试失败 = build 不运行 = 部署被阻止

# e2e.yml (非阻断式)
e2e-tests:
  timeout-minutes: 90
  continue-on-error: true
  # 失败不影响其他 workflow，只创建 Issue
```

---

### Q2: 如果我想在 PR 阶段就运行 Full Suite 怎么办？

**回答**:

不推荐，但可以这样配置：

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    types: [opened, synchronize]
  schedule:
    - cron: "0 18 * * *"
  workflow_dispatch:
```

**权衡**:

| 优点                        | 缺点                               |
| --------------------------- | ---------------------------------- |
| ✅ 更早发现所有问题         | ❌ PR 反馈时间从 20 分钟 → 40 分钟 |
| ✅ 减少 main 分支出问题概率 | ❌ GitHub Actions 资源消耗翻倍     |
|                             | ❌ 开发体验下降（等待时间长）      |

**推荐做法**: 保持现状，真正需要时手动触发 Full Suite

```bash
# 在 PR 页面评论
/test full

# 或使用 GitHub CLI
gh workflow run e2e.yml --ref feature/my-branch
```

---

### Q3: 定时任务能不能更频繁，比如每 2 小时一次？

**回答**:

可以，但不建议。

**计算**:

```
每日 1 次:
1 × 20 分钟 × 30 天 = 600 分钟/月

每 2 小时一次:
12 × 20 分钟 × 30 天 = 7200 分钟/月

增加: 6600 分钟（11 倍）
```

**GitHub Actions 免费额度**:

- Free plan: 2000 分钟/月
- Pro plan: 3000 分钟/月

每 2 小时一次会快速耗尽免费额度。

**建议**:

- 活跃项目: 每日 1 次足够（配合 main push 触发）
- 低频项目: 每周 1-2 次即可

```yaml
# 每周一、三、五凌晨 2 点
schedule:
  - cron: "0 18 * * 1,3,5"
```

---

### Q4: 如何查看 Full E2E 测试报告？

**方法 1: GitHub Actions UI**

1. 访问 `https://github.com/your-org/your-repo/actions`
2. 点击最近的 "E2E Full Suite" workflow run
3. 查看每个 shard 的日志
4. 点击 "Artifacts" 下载 `playwright-report-shard-X`

**方法 2: GitHub CLI**

```bash
# 查看最近的运行
gh run list --workflow=e2e.yml --limit 5

# 查看特定运行的详情
gh run view 18252390332

# 下载测试报告
gh run download 18252390332 --name playwright-report-shard-1-4
```

**方法 3: 查看失败时自动创建的 Issue**

失败时会自动创建 Issue，包含：

- 失败的测试列表
- 日志链接
- 截图和视频（如果有）

---

### Q5: 能否只在工作日运行定时任务？

**可以**:

```yaml
schedule:
  # 周一到周五凌晨 2 点
  - cron: "0 18 * * 1-5"
```

**Cron 语法说明**:

```
# ┌───────────── 分钟 (0 - 59)
# │ ┌───────────── 小时 (0 - 23)
# │ │ ┌───────────── 日期 (1 - 31)
# │ │ │ ┌───────────── 月份 (1 - 12)
# │ │ │ │ ┌───────────── 星期 (0 - 6，0=周日)
# │ │ │ │ │
# │ │ │ │ │
# * * * * *

# 示例
"0 18 * * *"      # 每天 UTC 18:00
"0 18 * * 1-5"    # 周一到周五 UTC 18:00
"0 18 * * 1"      # 仅周一 UTC 18:00
"0 18 1 * *"      # 每月 1 号 UTC 18:00
"0 2,18 * * *"    # 每天 UTC 02:00 和 18:00
```

---

### Q6: 如果 Full E2E 失败，我需要立即修复吗？

**回答**: 取决于失败的性质

**优先级判断**:

```
┌─────────────────────────────────────────────────────────┐
│                    失败类型分析                         │
└─────────────────────────────────────────────────────────┘

🔴 P0 - 立即修复（2 小时内）:
├─ Critical 测试通过但 Full 失败
│  └─ 说明 Critical 覆盖不足，需立即修复并补充 Critical
├─ 多个核心功能失败
│  └─ 可能影响生产，立即调查
└─ 安全相关测试失败
   └─ 安全风险不可忽视

🟡 P1 - 当日修复（8 小时内）:
├─ 新功能的测试失败
│  └─ 不影响存量功能，但需尽快修复
├─ 边缘场景失败
│  └─ 影响小众用户，排期修复
└─ UI/UX 测试失败
   └─ 功能可用但体验不佳

🟢 P2 - 本周修复（3 天内）:
├─ 测试本身的问题（flaky test）
│  └─ 修复测试稳定性
├─ 文档或示例代码测试失败
│  └─ 不影响核心功能
└─ 性能测试轻微退化
   └─ 可接受范围内，排期优化

⚪ P3 - 可延后:
├─ 兼容性测试失败（旧版浏览器）
│  └─ 用户占比 < 1%，评估是否支持
└─ 实验性功能失败
   └─ 未正式发布，排期迭代
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **严格使用 PR 工作流**
   - 所有变更通过 PR
   - 要求至少 1 人 Review
   - PR 必须通过 Critical 测试

2. **合理利用三种触发方式**
   - main push: 自动验证代码变更
   - 定时任务: 兜底检查非代码因素
   - 手动触发: 按需执行（发布前、问题调查）

3. **关注测试报告**
   - 定期查看 Full E2E 失败率
   - 及时修复 flaky tests（不稳定的测试）
   - 定期更新 Critical 测试集

4. **优化测试性能**
   - 使用分片并行执行
   - 仅在 CI 运行单一浏览器（Chromium）
   - 配置合理的 timeout

5. **持续改进**
   - 监控测试执行时间趋势
   - 定期 Review 测试覆盖率
   - 及时清理过时测试

---

### ❌ 避免做法

1. **不要直接推送 main**
   - 除非紧急修复生产问题
   - 跳过 Review 会增加风险

2. **不要忽略 Full E2E 失败**
   - 即使非阻断，也要定期清理
   - 累积问题会导致测试套件不可信

3. **不要过度触发 Full Suite**
   - 不要在 PR 阶段默认运行
   - 避免频繁定时任务（每小时）

4. **不要禁用分支保护图方便**
   - 长期看会导致代码质量下降
   - 团队协作需要规范约束

5. **不要让 flaky tests 存在**
   - 不稳定的测试会降低团队信心
   - 及时修复或临时标记 skip

---

## 配置检查清单

使用此清单验证配置是否正确：

### GitHub Actions 配置

- [ ] `e2e.yml` 包含三种触发方式（push, schedule, workflow_dispatch）
- [ ] `paths-ignore` 正确配置（忽略文档和工作流变更）
- [ ] 定时任务设置为每日一次（`0 18 * * *`）
- [ ] 分片配置为 4 个 shard（`["1/4", "2/4", "3/4", "4/4"]`）
- [ ] `continue-on-error: true` 已设置
- [ ] 仅安装 Chromium 浏览器
- [ ] 失败时自动创建 Issue

### 分支保护规则

- [ ] main 分支已启用保护
- [ ] 要求 PR before merging
- [ ] 要求至少 1 个 approval
- [ ] 要求 Status Checks 通过
- [ ] Status Checks 包含所有 Critical CI jobs
- [ ] 要求 Conversation Resolution

### 本地开发环境

- [ ] Git 配置正确（user.name, user.email）
- [ ] GitHub CLI 已安装并认证（`gh auth status`）
- [ ] 理解 feature 分支工作流
- [ ] 知道如何创建和管理 PR

### 团队协作

- [ ] 团队成员理解工作流程
- [ ] Code Review 规范已建立
- [ ] 测试失败处理流程明确
- [ ] Issue triage 责任人确定

---

## 附录

### 相关文档链接

- [E2E 测试最佳实践](../E2E_BEST_PRACTICES_CI_CD.md)
- [E2E 测试总结报告](../E2E_TEST_SUMMARY.md)
- [Playwright 配置文件](../playwright.config.ts)
- [CI Critical Path 工作流](../.github/workflows/ci-critical.yml)
- [Full E2E Suite 工作流](../.github/workflows/e2e.yml)

### GitHub Actions 文档

- [Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

### Playwright 文档

- [Test sharding](https://playwright.dev/docs/test-sharding)
- [Parallelism and sharding](https://playwright.dev/docs/test-parallel)
- [CI/CD best practices](https://playwright.dev/docs/ci)

---

## 变更历史

| 日期       | 版本  | 变更说明                         |
| ---------- | ----- | -------------------------------- |
| 2025-10-05 | 1.0.0 | 初始版本，完整配置指南和最佳实践 |

---

## 维护者

- **创建者**: Claude Code
- **审核者**: 项目团队
- **更新频率**: 根据实践经验持续更新

如有疑问或建议，请创建 Issue 或 PR。
