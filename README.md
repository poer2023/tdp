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

1) 安装依赖

```bash
npm ci
```

2) 配置环境变量（根目录新建 `.env`）

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

3) 初始化数据库（只需首次或模型变更后）

```bash
npm run db:migrate
```

4) 启动开发服务器

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

## 路线图 / 待办

详细的部署与改造待办清单见根目录 `codex.md`。其中包括：

- 健康检查接口与 Compose 健康探针
- Docker 非 root 运行
- 镜像构建与发布（CI/CD）、镜像安全扫描/签名
- `.env.example` 模板补充
- （建议）Next.js `output: 'standalone'` 优化镜像体积

如需部署到生产环境，请优先阅读 `docs/docker-deployment.md` 与 `docs/self-host-deployment.md`。
