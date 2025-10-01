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

本项目支持两种部署方式：**自动部署**（推荐）和 **手动部署**。

### 方式一：自动部署（CI/CD）

**触发条件**：`git push origin main`

**流程**：

1. 推送代码到 `main` 分支
2. GitHub Actions 自动构建 Docker 镜像
3. 推送镜像到 GitHub Container Registry (ghcr.io)
4. 自动部署到生产服务器

**时间**：约 15-20 分钟

```bash
git add .
git commit -m "feat: new feature"
git push origin main

# 查看部署进度
open https://github.com/poer2023/tdp/actions
```

### 方式二：手动部署（本地构建）

**触发条件**：手动执行构建和部署命令

**适用场景**：

- 需要快速验证镜像构建
- 想要部署特定版本（非 latest）
- GitHub Actions 不可用时
- 测试新的 Docker 配置

**流程**：

```bash
# 1. 启动 Docker
open -a Docker

# 2. 登录 GHCR（如未登录）
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 3. 生成 TAG
TAG=$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)

# 4. 构建并推送镜像（约 8 分钟）
docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/poer2023/tdp:$TAG \
  -t ghcr.io/poer2023/tdp:latest \
  --cache-from type=registry,ref=ghcr.io/poer2023/tdp:buildcache \
  --push .

# 5. 手动触发部署
gh workflow run "Deploy Only" -f image_tag=$TAG

# 6. 监控部署进度
gh run watch
```

**注意**：本地构建建议只使用 `--cache-from`（读取缓存），不使用 `--cache-to`（导出缓存），以避免额外的 5-10 分钟导出时间。

### 部署方式对比

| 方式         | 触发条件               | 构建位置       | 时间        | 适用场景               |
| ------------ | ---------------------- | -------------- | ----------- | ---------------------- |
| **自动部署** | `git push origin main` | GitHub Actions | ~15-20 分钟 | 日常开发，自动化发布   |
| **手动部署** | 手动触发 workflow      | 本地构建       | ~8-10 分钟  | 快速验证，特定版本部署 |

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
