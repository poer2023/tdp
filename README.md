# TDP 博客与相册平台

[![CI Critical Path](https://github.com/poer2023/tdp/workflows/CI%20Critical%20Path/badge.svg)](https://github.com/poer2023/tdp/actions)

基于 **Next.js 15 + React 19** 构建的多语言博客与相册系统，内置文章管理、图库、Google 登录、后台运营与 CI/CD 自动化。

---

## 核心亮点

- **中英双语站点**：`/`（英语）与 `/zh`（中文），自动处理 slug、hreflang 与重定向。
- **完整写作流程**：Markdown 内容、封面图、标签、草稿/发布、批量导入导出。
- **图库与动态**：上传图片至 `public/uploads`，关联文章或 Moments 并支持多终端展示。
- **身份认证**：NextAuth + Google OAuth，首位登录者自动授予管理员。
- **性能与 SEO**：Open Graph、JSON-LD、结构化数据、响应式导航与深色模式。
- **工程配套**：Prisma + PostgreSQL、ESLint、Vitest、Playwright、Docker、多阶段 CI/CD。

---

## 技术栈一览

| 层级   | 主要技术                                                         |
| ------ | ---------------------------------------------------------------- |
| 前端   | Next.js 15、React 19、App Router、Server Actions、Tailwind CSS 4 |
| 后端   | Prisma ORM、PostgreSQL、NextAuth                                 |
| 测试   | Vitest、@testing-library、Playwright                             |
| 自动化 | GitHub Actions、Docker、多阶段构建                               |

---

## 快速开始

### 依赖要求

- Node.js 20+
- npm（推荐使用 `npm ci` 安装）
- 本地或远程 PostgreSQL

### 初始配置

1. 安装依赖
   ```bash
   npm ci
   ```
2. 新建 `.env`
   ```env
   DATABASE_URL="postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="长度≥32的随机字符串"
   GOOGLE_CLIENT_ID="你的 Google Client ID"
   GOOGLE_CLIENT_SECRET="你的 Google Client Secret"
   MAX_UPLOAD_SIZE_MB=8
   ```
3. 同步数据库
   ```bash
   npx prisma migrate deploy
   ```
4. 启动开发服务器
   ```bash
   npm run dev
   # 浏览器访问 http://localhost:3000
   ```

> 首次使用 Google 登录的账号会自动晋升为管理员，配置位于 `src/auth.ts`。

---

## 常用脚本

| 命令                                  | 说明                    |
| ------------------------------------- | ----------------------- |
| `npm run dev`                         | 启动开发服务器          |
| `npm run lint` / `npm run type-check` | 代码质量校验            |
| `npm run test:run`                    | 运行单元测试（Vitest）  |
| `npm run test:integration`            | Prisma + API 集成测试   |
| `npm run test:e2e:critical`           | Playwright 关键路径冒烟 |
| `npm run build` / `npm run start`     | 生产构建与启动          |

---

## 测试与质量

- **测试层级**：单测覆盖业务逻辑，集成测试验证 API/数据库，E2E 覆盖核心用户旅程。
- **CI 防线**：GitHub Actions 中的 `CI Critical Path` 在每次 push/PR 上运行 lint、type-check、单测、集成测、关键 E2E 与构建。
- **覆盖率目标**：整体 75%+，关键路径 100% 通过（详见 `docs/TESTING.md`）。

---

## 部署方式

### Docker Compose（本地/自托管）

```bash
docker compose up -d --build
# 默认会启动 Next.js + PostgreSQL，并执行数据库迁移
```

- 上传目录映射到宿主机 `./public/uploads`。
- 数据持久化存储在命名卷 `postgres-data`。
- 入口脚本位于 `docker/entrypoint.sh`。

### GitHub Actions 工作流

- **CI Critical Path**：PR/push 自动执行质量防线。
- **Docker Build & Push → Auto Deploy**：合并到 `main` 后构建镜像并等待人工审批部署。
- 支持在提交信息中添加 `[skip deploy]` 跳过生产发布。更多细节见 `docs/docker-deployment.md`。

---

## 进一步阅读

- 用户手册：`docs/USER_GUIDE.md`
- 后台与导入导出手册：`docs/ADMIN_GUIDE.md`
- E2E 测试指南：`docs/E2E_TESTING_GUIDE.md`
- 测试策略总览：`docs/test-strategy.md`
- 配置说明：`docs/CONFIGURATION.md`
- 部署与运维：`docs/deployment-workflow.md`、`docs/docker-build.md`、`docs/docker-deployment.md`、`docs/self-host-deployment.md`

欢迎提交 Issue / PR，一起完善这套博客与相册平台。Enjoy building!
