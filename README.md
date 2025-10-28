# TDP 博客与相册平台（Next.js 15 + React 19）

[![CI Status](https://github.com/poer2023/tdp/workflows/CI%20Critical%20Path/badge.svg)](https://github.com/poer2023/tdp/actions)
[![Unit Tests](https://img.shields.io/badge/unit%20tests-passing-brightgreen)](https://github.com/poer2023/tdp/actions)
[![Integration Tests](https://img.shields.io/badge/integration%20tests-27%20passing-brightgreen)](https://github.com/poer2023/tdp/actions)
[![E2E Tests](https://img.shields.io/badge/e2e%20tests-critical%20path-brightgreen)](https://github.com/poer2023/tdp/actions)
[![Coverage](https://img.shields.io/badge/coverage-75%25-green)](https://github.com/poer2023/tdp/actions)

一个基于 Next.js 15 的全栈博客/相册项目，内置文章管理、图片上传、Google / 邮箱验证码登录与后台管理，支持 Docker 一键部署与 PostgreSQL 持久化存储。

## 特性

### 核心功能

- **多语言支持 (i18n)**：英文默认 (`/`)、中文支持 (`/zh`)，自动 pinyin slug 转换，301 重定向旧链接
- **文章管理**：草稿/发布、Markdown 正文、封面图、标签、翻译配对 (groupId)
- **用户互动**：无需登录的点赞系统
- **内容运营**：Markdown 导入/导出 (YAML frontmatter)、双语 sitemap
- **SEO 优化**：hreflang 交叉引用、JSON-LD 结构化数据、Open Graph 元标签
- **相册管理**：本地上传到 `public/uploads`，可选关联文章
- **身份认证**：NextAuth (Google OAuth + 邮箱验证码登录)，管理员通过白名单控制
- **数据库**：Prisma + PostgreSQL，生产/本地统一迁移流程
- **路由保护**：`/admin` 需登录访问
- **工程化**：ESLint、Prettier、Vitest 单测、Playwright E2E、CI 构建

## 技术栈

- 应用：Next.js 15、React 19、App Router、Server Actions
- 认证：NextAuth、Prisma Adapter
- 数据：Prisma ORM、PostgreSQL（`provider = postgresql`）
- 样式：Tailwind CSS（v4 PostCSS 插件）
- 测试：Vitest、@testing-library、Playwright
- 部署：Dockerfile 多阶段构建、docker-compose 编排

## 本地开发（推荐）

1. 安装依赖

```bash
npm ci
```

2. 配置环境变量（根目录新建 `.env`）

```env
# PostgreSQL 连接串（本地或容器）
DATABASE_URL="postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public"

# NextAuth 基础配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="请填入长度>=32的随机字符串"
FRIEND_JWT_SECRET="请填入长度>=32的随机字符串"

# Google OAuth 凭据（用于 OAuth 登录，可选但推荐）
GOOGLE_CLIENT_ID="你的 Google Client ID"
GOOGLE_CLIENT_SECRET="你的 Google Client Secret"

# 邮箱验证码登录配置（启用 Email Provider 必需）
EMAIL_FROM="noreply@example.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_SECURE="false"             # 465 使用 true
VERIFICATION_CODE_LENGTH="6"
VERIFICATION_CODE_EXPIRY_MINUTES="10"
ADMIN_EMAILS="admin@example.com,ops@example.com"

# 上传大小限制（MB）
MAX_UPLOAD_SIZE_MB=8
```

3. 初始化数据库（只需首次或模型变更后）

```bash
npm run db:migrate
```

4. 启动开发服务器

```bash
npm run dev
# 打开 http://localhost:3000
```

提示：管理员角色由 `ADMIN_EMAILS` 白名单控制；未列入白名单的账号（无论 Google 或邮箱登录）都会以 READER 角色进入系统。

### 邮箱验证码登录说明

1. 确认上文 SMTP 相关环境变量已经配置，且 `NEXTAUTH_URL` 指向对外可访问的地址。
2. 用户在登录页选择“使用邮箱登录”，输入邮箱后会收到 6 位验证码与兜底登录链接。
3. 验证码 10 分钟有效（可通过 `VERIFICATION_CODE_EXPIRY_MINUTES` 调整），系统会对邮箱/IP 做限流（默认 15 分钟内每邮箱 5 次、每 IP 20 次）。
4. 成功登录后若邮箱未在 `ADMIN_EMAILS` 中，账号会以 READER 角色创建，可在后台调整权限。

## 使用 Docker 启动

如需快速启动数据库与应用，可使用 docker-compose：

```bash
# 1) 准备环境变量文件（根目录 .env）
#   参考上文“本地开发”的 .env 字段；
#   若使用 compose 默认的 Postgres 服务，可将 DATABASE_URL 设置为：
#   postgresql://tdp:tdp_password@postgres:5432/tdp?schema=public

# 2) 构建并启动
docker compose up -d --build

# 3) 访问应用
open http://localhost:3000
```

说明：

- 数据库数据保存在命名卷 `postgres-data`，图片上传目录映射到宿主机 `./public/uploads`。
- 容器启动脚本会自动执行数据库迁移（见 `docker/entrypoint.sh`）。

## 脚本命令

### 开发与构建

- 开发：`npm run dev`
- 构建：`npm run build`
- 启动：`npm run start`
- 代码规范：`npm run lint`、`npm run format`、`npm run type-check`

### 数据库

- 迁移：`npm run db:migrate`
- 生成客户端：`npm run db:generate`
- 可视化管理：`npm run db:studio`

### 测试

- **单元测试**：`npm run test`、`npm run test:run`、`npm run test:coverage`
- **集成测试**：`npm run test:integration`、`npm run test:integration:watch`
- **E2E 测试**：
  - 全量测试：`npm run test:e2e` (314 tests)
  - 关键路径：`npm run test:e2e:critical` (60-80 tests)
  - 详细指南：见 [docs/E2E_TESTING_GUIDE.md](docs/E2E_TESTING_GUIDE.md)
- **所有测试**：`npm run test:all` - 运行单元 + 集成 + E2E关键路径
- **i18n 功能测试**：
  - 重定向测试：`npx tsx scripts/test-redirect.ts`
  - 点赞功能测试：`npx tsx scripts/test-likes.ts`
  - 导出场景测试：`npx tsx scripts/test-export-scenarios.ts`
  - 导入场景测试：`npx tsx scripts/test-import-scenarios.ts`
  - SEO Rich Results 测试：`npx tsx scripts/test-seo-rich-results.ts`

## 模块化开发工作流

- 新功能默认挂在 `FEATURE_*` 环境变量上，通过 `FeatureToggle` 组件或 `features.get()` 控制上线范围，必要时可即时关闭。
- 管理端的独立功能通过专用路由目录和 `next/dynamic` 懒加载渲染，配合 Error Boundary 限制故障影响面。
- 服务端查询和外部依赖在失败时需返回兜底数据（示例：`E2E_SKIP_DB`），避免 Prisma 与第三方抛错导致整页崩溃。
- 开发阶段建议执行“增量测试”组合：`npm run lint`、`npm run type-check`、相关模块的 Vitest/Playwright 脚本；CI 主流程再调度全量集合。
- 详尽的实施手册、代码片段及回滚策略见 [docs/modular-development-playbook.md](docs/modular-development-playbook.md)。

### 部署

- 部署前检查：`./scripts/deploy-checklist.sh`

## 测试策略 | Testing Strategy

### 测试金字塔 | Test Pyramid

我们遵循行业标准的测试金字塔方法：

```
       /\
      /E2E\      10% - 关键用户旅程 (8-10 files)
     /------\
    / Integration \  20% - API + DB + Services (10-15 files)
   /----------\
  /   Unit Tests  \  70% - 业务逻辑 + 工具函数 (30+ files)
 /--------------\
```

### 覆盖率标准 | Coverage Standards

| 测试类型           | 最低要求 | 目标 | 企业标准 |
| ------------------ | -------- | ---- | -------- |
| Unit Tests         | 60%      | 75%  | **80%**  |
| Integration Tests  | 40%      | 50%  | **60%**  |
| E2E Critical Paths | 100%     | 100% | **100%** |
| Overall            | 70%      | 80%  | **85%**  |

### 何时添加测试 | When to Add Tests

**单元测试** (`src/**/*.test.ts`)：

- ✅ 纯函数和工具函数
- ✅ 业务逻辑计算
- ✅ 数据验证和转换
- ❌ 复杂UI交互 (使用E2E)
- ❌ 路由和导航 (使用E2E)

**集成测试** (`src/tests/integration/**/*.integration.test.ts`)：

- ✅ API路由 + 数据库操作
- ✅ 第三方服务集成
- ✅ 认证流程
- ✅ 文件上传和处理

**E2E测试** (`e2e/**/*.spec.ts`)：

- ✅ 关键业务流程 (登录、发布)
- ✅ 跨页面用户旅程
- ✅ 性能关键路径
- ❌ 边界情况和错误处理 (使用单元测试)

### 运行测试 | Running Tests

```bash
# 单元测试
npm run test              # Watch模式
npm run test:run          # 运行一次
npm run test:coverage     # 带覆盖率

# 集成测试
npm run test:integration         # 运行一次
npm run test:integration:watch   # Watch模式

# E2E测试
npm run test:e2e                 # 完整E2E套件
npm run test:e2e:critical        # 关键路径 (CI使用)
npm run test:e2e:headed          # 带浏览器UI

# 所有测试
npm run test:all          # 单元 + 集成 + E2E关键路径
```

### 质量门禁 | Quality Gates

**Pre-commit** (通过Husky自动执行)：

- ESLint检查
- TypeScript编译
- 单元测试覆盖率 ≥ 80%

**CI Pipeline** (GitHub Actions)：

- Lint + Format检查
- Type检查
- 单元测试 (覆盖率 ≥ 80%)
- 集成测试 (覆盖率 ≥ 60%)
- E2E关键测试 (100%通过)
- 构建成功

**Pre-merge要求**：

- 所有CI检查通过 ✅
- 代码审查批准 (需要1人)
- 无失败测试
- 覆盖率达标

### 维护原则 | Maintenance Principles

1. **测试隔离**：每个测试必须独立,可任意顺序运行
2. **快速反馈**：单元测试 < 2分钟，集成测试 < 5分钟，E2E < 10分钟
3. **快速失败**：第一个错误出现立即停止,节省CI时间
4. **清理数据**：测试后始终清理测试数据
5. **禁止跳过**：永远不要跳过测试来通过CI；修复或删除它们
6. **真实代码**：生产代码中不要有TODO、模拟对象或占位符
7. **覆盖率优先**：合并新功能前先写测试

### 测试文件组织 | Test File Organization

```
src/
  ├── lib/
  │   ├── utils.ts
  │   └── __tests__/
  │       └── utils.test.ts          # 单元测试
  ├── tests/
  │   ├── integration/
  │   │   ├── api/
  │   │   │   ├── auth.integration.test.ts
  │   │   │   └── posts.integration.test.ts
  │   │   └── services/
  │   │       └── storage.integration.test.ts
  │   └── setup.ts
  └── components/
      ├── button.tsx
      └── __tests__/
          └── button.test.tsx         # 组件单元测试

e2e/
  ├── auth-flow.spec.ts               # 关键E2E
  ├── sitemap-improved.spec.ts        # 关键E2E
  └── utils/
      └── test-helpers.ts
```

### 贡献指南 | Contributing

添加新功能时：

1. **测试先行** (TDD,如果可能)
2. **遵循金字塔**：主要是单元测试,少量集成测试,极少E2E
3. **保持覆盖率**：不要降低现有覆盖率
4. **更新文档**：如果添加新的测试模式,请更新此文档

### 故障排除 | Troubleshooting

**测试在本地通过但CI失败**：

- 检查Node版本 (应该 ≥22.0.0)
- 清理缓存：`rm -rf node_modules/.vitest`
- 确保测试数据库干净

**测试超时**：

- 检查未解决的Promise
- 验证fake timers配置正确
- 如果测试确实很慢,增加`testTimeout`

**覆盖率低于阈值**：

- 运行 `npm run test:coverage` 查看报告
- 为未覆盖的行添加测试
- 考虑代码是否可测试 (如果不可测试,重构)

详细的CI/CD测试优化清单见 [claudedocs/ci-cd-optimization-checklist.md](claudedocs/ci-cd-optimization-checklist.md)

## 目录与关键文件

### 应用结构

- 应用入口与页面：`src/app`
  - 英文路由：`src/app/posts/[slug]`
  - 中文路由：`src/app/[locale]/posts/[slug]`
- 接口与权限：`src/app/api/*`、`middleware.ts`
- 数据访问层：`src/lib/*`、`prisma/schema.prisma`
- 后台界面：`src/app/admin/*`
  - 内容导出：`src/app/admin/export`
  - 内容导入：`src/app/admin/import`

### 文档

#### 用户文档

- **用户指南**：[docs/USER_GUIDE.md](docs/USER_GUIDE.md) - 点赞、语言切换
- **管理员指南**：[docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) - 导出、导入
- **隐私政策**：[docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) - 数据处理说明

#### 开发者文档

- **E2E 测试指南**：[docs/E2E_TESTING_GUIDE.md](docs/E2E_TESTING_GUIDE.md) - Playwright E2E 测试完整指南
- **E2E 本地执行**：[LOCAL_E2E_SCHEME_B_PLAYBOOK.md](LOCAL_E2E_SCHEME_B_PLAYBOOK.md) - 本地分阶段执行方案
- **测试指南**：[docs/TESTING.md](docs/TESTING.md) - 自动化测试概览
- **手动测试**：[docs/MANUAL_TESTING.md](docs/MANUAL_TESTING.md) - 性能、安全、可访问性

#### DevOps 文档

- **分支管理策略**：[docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md) - GitHub Flow 工作流程
- **分支保护配置**：[docs/BRANCH_PROTECTION_SETUP.md](docs/BRANCH_PROTECTION_SETUP.md) - 分支保护规则设置指南
- **CI/CD 配置**：[claudedocs/E2E_CICD_CONFIGURATION_GUIDE.md](claudedocs/E2E_CICD_CONFIGURATION_GUIDE.md) - E2E CI/CD 完整配置指南
- **部署指南**：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - 生产部署步骤
- **Docker 构建**：[docs/docker-build.md](docs/docker-build.md) - 本地构建与推送
- **Docker 部署**：[docs/docker-deployment.md](docs/docker-deployment.md) - Docker 生产部署
- **自托管部署**：[docs/self-host-deployment.md](docs/self-host-deployment.md) - 自托管部署指南
- **监控指南**：[docs/MONITORING.md](docs/MONITORING.md) - 上线后监控

#### 配置文档

- **配置选项**：[docs/CONFIGURATION.md](docs/CONFIGURATION.md) - 功能配置
- **内容格式**：[docs/CONTENT_FORMAT.md](docs/CONTENT_FORMAT.md) - Markdown 导入/导出规范

#### 项目历史

- **i18n 完成总结**：[docs/i18n-COMPLETION-SUMMARY.md](docs/i18n-COMPLETION-SUMMARY.md) - i18n 项目总结
- **历史文档归档**：[docs/archive/](docs/archive/) - 已完成阶段的开发文档

### Docker 与部署

- Docker 与编排：`Dockerfile`、`docker-compose.yml`、`docker/entrypoint.sh`
- 部署文档：见上方"文档 → DevOps 文档"章节

## CI/CD 测试流程

### 工作流配置

- **CI Critical Path** (`.github/workflows/ci-critical.yml`)：
  - 触发：每次 PR 和 push
  - 执行：Lint + TypeCheck + 单测 + 关键 E2E (~60-80 tests) + Build
  - 用途：**阻塞式验证**，失败则阻止合并

- **E2E Full Suite** (`.github/workflows/e2e.yml`)：
  - 触发：main 分支 push（非文档变更） + 每日 2AM + 手动触发
  - 执行：全量 314 tests，4-way sharding，Chromium only
  - 用途：**非阻塞式检测**，失败创建 GitHub Issue

详细配置说明见 [claudedocs/E2E_CICD_CONFIGURATION_GUIDE.md](claudedocs/E2E_CICD_CONFIGURATION_GUIDE.md)

### 测试配置

- **Playwright Config**：`playwright.config.ts` - 5 browser projects，自动启动服务器
- **Critical Config**：`playwright.critical.config.ts` - Chromium only，快速验证

## 开发与部署工作流

### 分支管理策略

本项目采用 **GitHub Flow** 分支策略：

- **主分支**: `main` - 始终保持可部署状态，受分支保护
- **功能分支**: `feature/xxx`, `fix/xxx` - 短期分支，完成后立即合并并删除
- **工作流程**: 从 main 创建分支 → 开发 → PR → CI 验证 → 合并 → 删除分支

详细说明见 [docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md)

### 部署流程

**推荐工作流**：分支开发 + PR 合并 + 受控发布

本项目采用"分支开发、PR 验证、审批发布"的 CI/CD 流程，既方便日常随手提交，又能确保生产发布可控。

### 工作流程概览

```
功能分支 push
    ↓
创建 PR → CI 验证 (lint/typecheck/test/build)
    ↓
合并到 main → 自动构建镜像
    ↓
等待审批 → 点击 Approve → 部署到生产
```

### 当前配置状态

| 功能                 | 状态          | 说明                                               |
| -------------------- | ------------- | -------------------------------------------------- |
| PR 自动 CI 验证      | ✅ 已实现     | `.github/workflows/ci.yml` 在 PR 时运行全套检查    |
| 合并后自动构建镜像   | ✅ 已实现     | `docker-publish.yml` 在 main push 时构建并推送镜像 |
| `[skip deploy]` 跳过 | ✅ 已配置     | 提交信息包含此标记时跳过部署                       |
| 生产发布需审批       | ⚠️ 需手动配置 | 需创建 `production` 环境并设置审批人（见下方步骤） |
| main 分支保护        | ⚠️ 可选配置   | 防止直接 push，强制走 PR 流程（推荐但非必需）      |

### 日常使用场景

#### 场景 1：随手保存进度，不影响 main

```bash
# 在功能分支上随意提交
git checkout -b feature/new-feature
# ... 修改代码 ...
git add .
git commit -m "wip: 临时保存进度"
git push origin feature/new-feature

# ✅ 只推送到功能分支，main 不受影响，不触发部署
```

#### 场景 2：合并到 main 但暂不部署

```bash
# PR 合并时在合并提交中加上 [skip deploy]
# 方式 1: 在 GitHub PR 界面合并时编辑提交信息
Merge pull request #123 from feature/new-feature [skip deploy]

# 方式 2: 本地合并
git checkout main
git merge feature/new-feature -m "feat: new feature [skip deploy]"
git push origin main

# ✅ 镜像会构建，但不会部署到生产
```

#### 场景 3：正式发布到生产

```bash
# 1. 合并 PR 到 main（不加 [skip deploy]）
# 2. 等待 Docker Build & Push 完成（约 10-15 分钟）
# 3. 前往 GitHub Actions 页面
open https://github.com/poer2023/tdp/actions

# 4. 找到 "Auto Deploy" 工作流，点击等待中的部署
# 5. 点击 "Review deployments" → 勾选 "production" → "Approve and deploy"

# ✅ 审批后自动部署到生产服务器
```

### 一次性配置步骤

#### 必需：创建 production 环境并配置审批

1. 访问仓库 Settings → Environments → New environment
2. 输入环境名称: `production`
3. 勾选 **Required reviewers**，添加你自己（或团队成员）
4. 保存

完成后，每次 main 合并只会在点击 Approve 后才发布到生产。

#### 可选：开启 main 分支保护

如果希望强制所有变更走 PR 流程，防止直接 push 到 main：

1. 访问仓库 Settings → Branches → Add branch protection rule
2. Branch name pattern: `main`
3. 勾选以下选项：
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - 选择 `CI Pipeline` (或其他必需的检查)
   - ❌ 不勾选 "Include administrators"（保留紧急推送权限）
4. 保存

配置后，必须通过 PR 才能合并到 main，直接 push 会被拒绝。

### 高级用法：本地构建 + 手动部署

适用于快速验证、部署特定版本、GitHub Actions 不可用等场景。

```bash
# 1. 启动 Docker
open -a Docker

# 2. 登录 GHCR
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 3. 构建并推送镜像（约 8 分钟）
TAG=$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)
docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/poer2023/tdp:$TAG \
  -t ghcr.io/poer2023/tdp:latest \
  --cache-from type=registry,ref=ghcr.io/poer2023/tdp:buildcache \
  --push .

# 4. 手动触发部署
gh workflow run "Deploy Only" -f image_tag=$TAG
gh run watch
```

**注意**：本地构建建议只使用 `--cache-from`（读取缓存），不使用 `--cache-to`（导出缓存），以避免额外的 5-10 分钟导出时间。

### 相关文档

- 本地构建详细指南：[`docs/docker-build.md`](docs/docker-build.md)
- Docker 部署说明：[`docs/docker-deployment.md`](docs/docker-deployment.md)
- 自托管部署：[`docs/self-host-deployment.md`](docs/self-host-deployment.md)

## 开发路线图

主要改进方向：

- 健康检查接口与 Compose 健康探针
- Docker 非 root 运行
- 镜像安全扫描/签名
- `.env.example` 模板补充

如需部署到生产环境，请优先阅读 [docs/docker-deployment.md](docs/docker-deployment.md) 与 [docs/self-host-deployment.md](docs/self-host-deployment.md)。
