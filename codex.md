# 部署与改造待办清单（Codex TODO）

本文记录围绕部署规范与工程化改造的详细待办、涉及文件、验收标准与优先级。完成后请在 PR 中逐项勾选。

## ✅ 1. 健康检查（P1）

- 目标
  - 提供应用健康接口，供容器/编排系统就绪与存活探测。
- 任务
  - 新增 `src/app/api/health/route.ts`，实现：
    - GET 成功返回：`{ ok: true, db: 'ok' }`（HTTP 200）。
    - 若数据库异常，返回：`{ ok: false, db: 'error' }`（HTTP 503）。
    - DB 检查：`await prisma.$queryRaw\`SELECT 1\``。
  - 在 `docker-compose.yml` 的 `app` 服务添加 `healthcheck`：
    - `test`: `node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`
    - `interval: 10s`、`timeout: 5s`、`retries: 10`、`start_period: 30s`。
- 涉及文件
  - `src/app/api/health/route.ts`
  - `docker-compose.yml`
- 验收标准
  - 本地 `curl http://localhost:3000/api/health` 返回 200 且 JSON `ok=true`。
  - `docker compose ps` 显示 `app` 服务 `healthy`，Postgres 未就绪时显示 `starting/unhealthy`。

## ✅ 2. Docker 非 root 运行（P1）

- 目标
  - 避免容器进程以 root 启动，降低安全风险。
- 任务
  - 在 `Dockerfile` 运行阶段：
    - 复制产物后 `RUN chown -R node:node /app`。
    - 在 `ENTRYPOINT` 之前添加 `USER node`。
  - 确保上传目录可写：`public/uploads` 已通过卷映射；必要时在入口脚本 `docker/entrypoint.sh` 中 `mkdir -p`。
- 涉及文件
  - `Dockerfile`
  - `docker/entrypoint.sh`
- 验收标准
  - `docker exec tdp-app id` 显示 UID/GID 非 0。
  - 上传图片成功、文章封面可写入。

## ✅ 3. 环境变量样例（P1）

- 目标
  - 提供 `.env.example`，降低上手成本，统一配置口径。
- 任务
  - 新增根目录 `.env.example`，包含：
    - `DATABASE_URL=postgresql://tdp:tdp_password@postgres:5432/tdp?schema=public`
    - `NEXTAUTH_URL=http://localhost:3000`
    - `NEXTAUTH_SECRET=请替换为长度>=32的随机值`
    - `GOOGLE_CLIENT_ID=填入你的ID`
    - `GOOGLE_CLIENT_SECRET=填入你的密钥`
    - `MAX_UPLOAD_SIZE_MB=8`
- 涉及文件
  - `.env.example`
- 验收标准
  - `cp .env.example .env && docker compose up -d --build` 可一键启动。

## ✅ 4. 镜像构建与发布（CI/CD）（P1）

- 目标
  - 自动构建并推送 Docker 镜像到仓库（GHCR 或 Docker Hub）。
- 任务
  - 新增 `.github/workflows/docker-publish.yml`：
    - 触发：push 到 `main`、创建 tag。
    - 步骤：`setup-buildx`、登录（使用机密）、`docker/build-push-action`。
    - 多架构：`linux/amd64,linux/arm64`；tag：`latest` 和 `${{ github.sha }}`。
  - 仓库机密：
    - GHCR：`CR_PAT`（或使用 GITHUB_TOKEN 配置权限）。
    - Docker Hub：`DOCKERHUB_USERNAME`、`DOCKERHUB_TOKEN`。
- 涉及文件
  - `.github/workflows/docker-publish.yml`
- 验收标准
  - 工作流成功并在镜像仓库看到新 tag。

## 5. 自动部署（可选）（P2）

- 目标
  - 镜像推送成功后自动 SSH 到服务器拉取并重启容器。
- 任务
  - 新增 `.github/workflows/deploy.yml`：
    - 触发：`workflow_run`（依赖 `docker-publish` 成功）或手动 `workflow_dispatch`。
    - 使用 `appleboy/ssh-action` 执行远端脚本：`docker compose pull && docker compose up -d`。
  - 机密：`SSH_HOST`、`SSH_PORT`、`SSH_USER`、`SSH_KEY`、`PROJECT_DIR`。
- 涉及文件
  - `.github/workflows/deploy.yml`
- 验收标准
  - push 后服务器自动更新容器，健康检查通过。

## 6. 镜像安全（扫描与签名）（P2）

- 目标
  - 发布前进行安全扫描；可选签名提升供应链安全。
- 任务
  - 在 `docker-publish.yml` 中增加 Trivy 扫描：`aquasecurity/trivy-action`，对 image 扫描并对 `HIGH/CRITICAL` 设置门禁。
  - （可选）集成 cosign：发布后执行 `cosign sign`，使用 OIDC 或私钥机密。
- 涉及文件
  - `.github/workflows/docker-publish.yml`
- 验收标准
  - 扫描结果无高危；镜像可被成功验签。

## 7. CI/E2E 数据库一致性（P2）

- 现状
  - Prisma `provider = postgresql`，但 CI/E2E 中使用了 `file:./*.db` 的 `DATABASE_URL` 协议，不匹配。
- 目标
  - 让 CI/E2E 使用 Postgres 服务或对 DB 进行 mock，保证稳定性。
- 方案 A（推荐）
  - 在 `.github/workflows/ci.yml` 与 `.github/workflows/e2e.yml` 中定义 `services.postgres`：`postgres:16-alpine`。
  - 设置 `DATABASE_URL` 指向服务主机名（如 `localhost` 或 `postgres` 视 job 网络而定）。
  - 在构建/测试前执行 `npx prisma migrate deploy`。
- 方案 B
  - 对需要 DB 的单元测试进行 mock/跳过，仅在集成/端到端阶段访问真实 DB。
- 验收标准
  - CI 与 E2E 在冷环境下稳定通过，无偶发现象。

## 8. Standalone 构建优化（建议）（P3）

- 目标
  - 减小运行镜像体积，减少对 `node_modules` 的运行时依赖。
- 任务
  - 在 `next.config.ts` 设置：`export default { output: 'standalone' }`。
  - 调整 `Dockerfile` 运行阶段仅复制：`.next/standalone`（到 `/app`）与 `.next/static`、`public/`、`prisma/`。
  - 验证容器启动与运行正常。
- 涉及文件
  - `next.config.ts`、`Dockerfile`
- 验收标准
  - 镜像体积下降且服务功能无回退。

## ✅ 9. 文档更新（P1）

- 目标
  - 说明健康检查、非 root 运行、CI/CD 与镜像发布流程。
- 任务
  - 更新 `README.md`（已完成）：项目简介/用法/待办链接。
  - 在 `docs/docker-deployment.md`、`docs/self-host-deployment.md` 中补充：
    - 健康检查接口说明与探针配置示例。
    - 非 root 运行注意事项与卷权限。
    - CI/CD 发布/部署流程与最低权限的机密配置建议。
- 验收标准
  - 新成员按文档可顺利启动与部署；安全关键点有明确指南。

## 10. 清理与忽略（P3）

- 目标
  - 清理不必要的临时文件，避免误提交。
- 任务
  - 删除根目录：`notion_page.html`、`notion_page_pvs4.html`、`notion_public_data.json`。
  - 视情况在 `.gitignore` 增加相应忽略规则。
- 验收标准
  - 仓库整洁，`git status` 无临时文件变更。

---

备注：优先从 P1 事项着手（健康检查、非 root、环境变量样例、镜像发布与文档），随后推进 P2（自动部署、安全扫描、CI 一致性），最后处理 P3（standalone 优化与清理）。

