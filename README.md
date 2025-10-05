# TDP 博客与相册平台（Next.js 15 + React 19）

一个基于 Next.js 15 的全栈博客/相册项目，内置文章管理、图片上传、Google 登录与后台管理，支持 Docker 一键部署与 PostgreSQL 持久化存储。

## 特性

### 核心功能

- **多语言支持 (i18n)**：英文默认 (`/`)、中文支持 (`/zh`)，自动 pinyin slug 转换，301 重定向旧链接
- **文章管理**：草稿/发布、Markdown 正文、封面图、标签、翻译配对 (groupId)
- **用户互动**：无需登录的点赞系统
- **内容运营**：Markdown 导入/导出 (YAML frontmatter)、双语 sitemap
- **SEO 优化**：hreflang 交叉引用、JSON-LD 结构化数据、Open Graph 元标签
- **相册管理**：本地上传到 `public/uploads`，可选关联文章
- **身份认证**：NextAuth + Google，首个登录者自动授予 ADMIN 权限
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

# Google OAuth 凭据
GOOGLE_CLIENT_ID="你的 Google Client ID"
GOOGLE_CLIENT_SECRET="你的 Google Client Secret"

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

提示：首次使用 Google 登录时，将自动把第一个用户设为 ADMIN（见 `src/auth.ts`）。

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

- **单元测试**：`npm run test`、`npm run test:run`
- **E2E 测试**：
  - 全量测试：`npm run test:e2e` (314 tests)
  - 关键路径：`npm run test:e2e:critical` (60-80 tests)
  - 详细指南：见 [docs/E2E_TESTING_GUIDE.md](docs/E2E_TESTING_GUIDE.md)
- **i18n 功能测试**：
  - 重定向测试：`npx tsx scripts/test-redirect.ts`
  - 点赞功能测试：`npx tsx scripts/test-likes.ts`
  - 导出场景测试：`npx tsx scripts/test-export-scenarios.ts`
  - 导入场景测试：`npx tsx scripts/test-import-scenarios.ts`
  - SEO Rich Results 测试：`npx tsx scripts/test-seo-rich-results.ts`

### 部署

- 部署前检查：`./scripts/deploy-checklist.sh`

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
