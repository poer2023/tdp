# TDP 博客与相册平台（Next.js 15 + React 19）

一个基于 Next.js 15 的全栈博客/相册项目，内置文章管理、图片上传、Google 登录与后台管理，支持 Docker 一键部署与 PostgreSQL 持久化存储。

## 特性

- 文章发布：草稿/发布、Markdown 正文、封面图、标签
- 相册管理：本地上传到 `public/uploads`，可选关联文章
- 身份认证：NextAuth + Google，首个登录者自动授予 ADMIN 权限
- 数据库：Prisma + PostgreSQL，生产/本地统一迁移流程
- 路由保护：`/admin` 需登录访问
- 工程化：ESLint、Prettier、Vitest 单测、Playwright E2E、CI 构建

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

- 开发：`npm run dev`
- 构建：`npm run build`
- 启动：`npm run start`
- 代码规范：`npm run lint`、`npm run format`、`npm run type-check`
- 数据库：`npm run db:migrate`、`npm run db:generate`、`npm run db:studio`
- 单元测试：`npm run test`、`npm run test:run`
- E2E：`npm run test:e2e`

## 目录与关键文件

- 应用入口与页面：`src/app`
- 接口与权限：`src/app/api/*`、`middleware.ts`
- 数据访问层：`src/lib/*`、`prisma/schema.prisma`
- 后台界面：`src/app/admin/*`
- Docker 与编排：`Dockerfile`、`docker-compose.yml`、`docker/entrypoint.sh`
- 部署文档：`docs/docker-deployment.md`、`docs/self-host-deployment.md`

## CI / 测试

- CI 工作流：`.github/workflows/ci.yml`（Lint/TypeCheck/单测/构建）、`.github/workflows/e2e.yml`（Playwright）
- E2E 启动器：`playwright.config.ts` 会在测试前构建并启动本地服务器

## 生产部署

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

## 路线图 / 待办

详细的部署与改造待办清单见根目录 `codex.md`。其中包括：

- 健康检查接口与 Compose 健康探针
- Docker 非 root 运行
- 镜像构建与发布（CI/CD）、镜像安全扫描/签名
- `.env.example` 模板补充
- （建议）Next.js `output: 'standalone'` 优化镜像体积

如需部署到生产环境，请优先阅读 `docs/docker-deployment.md` 与 `docs/self-host-deployment.md`。
