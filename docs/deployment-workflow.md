# 部署流程 Deployment Workflow

本文记录 TDP 项目当前的部署策略与操作手册，涵盖 GitHub Actions 自动流程、审批机制以及本地/手动部署方案。内容基于 2025-10-12 的工作流配置。

---

## 总体流程概览

```
Push / PR
   │
   ├─► CI Critical Path（lint → type-check → unit → integration → E2E → build）
   │
   ├─► Docker Build and Push（workflow_run，main 分支）
   │       └─ 构建 ghcr.io/poer2023/tdp:latest + 构建缓存
   │       └─ Trivy 高危扫描（结果上传为 artifact）
   │
   └─► Auto Deploy（workflow_run，默认生产环境，需审批）
           └─ [skip deploy] 会跳过自动发布
           └─ 通过 SSH + docker compose 拉取镜像并健康检查
```

---

## 前置要求

1. **GitHub Secrets / Variables**
   - `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_KEY`：部署主机凭据。
   - `PROJECT_DIR`：服务器上的应用目录。
   - `GHCR_USERNAME`, `GHCR_TOKEN`：若镜像为私有，需要提供。
   - 环境变量（仅 `deploy-only.yml` 使用）：`ENV_DATABASE_URL`、`ENV_NEXTAUTH_SECRET` 等。
2. **仓库设置**
   - Settings → Environments 创建 `production` 环境并添加审批人（用于 Auto Deploy）。
   - 可选：设置 `main` 分支保护规则，要求 CI 通过。
3. **服务器准备**
   - 安装 Docker Engine 与 Docker Compose Plugin。
   - 打通到 GHCR 的网络（若使用私有镜像）。
   - 预先创建 `docker-compose.yml` 等文件（仓库中已有模版）。

---

## GitHub Actions 流程

### 1. CI Critical Path

详见 `docs/test-strategy.md`。只有在所有关键检查均通过时，后续工作流才会运行。失败时不会触发镜像构建与部署。

### 2. Docker Build and Push (`.github/workflows/docker-publish.yml`)

- **触发**：`CI Critical Path` 成功完成（main 分支）或推送版本标签 `v*`。
- **产出**：
  - 镜像：`ghcr.io/poer2023/tdp:latest` + `ghcr.io/poer2023/tdp:<branch/sha>`。
  - 缓存：`buildcache`，用于加速后续构建。
  - 安全扫描：Trivy SARIF 上传至 Security tab（公开仓库时）。
- **注意**：单架构（amd64）用于日常构建；打标签时会执行 multi-arch 构建。

### 3. Auto Deploy (`.github/workflows/deploy.yml`)

- **触发**：Docker 构建成功后自动触发，或手动 `workflow_dispatch`。
- **审批**：指向 `production` 环境，需在 Actions 页面点击 “Review deployments” → “Approve and deploy” 才会执行。
- **运行步骤**：
  1. 远程检测 Docker 与 Compose 是否安装。
  2. 首次执行时自动 clone 仓库到 `PROJECT_DIR`。
  3. `git fetch` + `git reset --hard origin/main` 保持最新代码（供 compose 使用）。
  4. 若提供 GHCR 凭据则执行 `docker login`。
  5. `docker compose pull && docker compose up -d --remove-orphans`。
  6. 轮询 `http://localhost:3000/api/health` 最长 5 分钟，失败会输出容器日志并退出。
  7. 打印容器健康状态并执行 `docker image prune -f`。
- **跳过发布**：提交信息包含 `[skip deploy]` 时自动跳过，即使构建成功。

---

## 手动部署选项

### Deploy Only (`.github/workflows/deploy-only.yml`)

- **用途**：选择镜像 tag（默认 `latest`）手动重发部署，适用于回滚或热修复。
- **操作**：进入 Actions → Deploy Only → Run workflow，填写 `image_tag` 与目标环境。
- **特性**：
  - 会在服务器生成 `.env` 文件，内容源自 GitHub Secrets（`ENV_*`）。
  - 通过 `docker compose pull && docker compose up -d` 启动，并验证 `/api/health`。

### 本地 Docker Compose

用于开发者自测或在非生产机器上部署。

```bash
cp .env.example .env       # 填写数据库、OAuth 等信息
docker compose up -d --build
```

- Postgres 数据卷：`postgres-data`
- 上传文件映射：`./public/uploads`（宿主机 <-> 容器）
- 入口脚本：`docker/entrypoint.sh` 会执行 `prisma migrate deploy` 并启动 Next.js

### 手动服务器更新

若需要完全手动操作，可在服务器上执行：

```bash
git fetch origin main
git reset --hard origin/main
docker compose pull
docker compose up -d --remove-orphans
```

确保 `.env` 与 `docker-compose.yml` 已配置正确，再用 `curl http://localhost:3000/api/health` 验证。

---

## 故障排查

| 场景               | 排查步骤                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Docker Build 失败  | 查看 `Docker Build and Push` 日志；留意 `npm ci`、`next build`、Trivy 报错。                                         |
| 部署审批后失败     | 检查 `Auto Deploy` 日志：是否缺少 Secrets、Docker 未安装、health check 超时。                                        |
| 服务启动但无法访问 | 在服务器执行 `docker compose ps`、`docker compose logs --tail=200 app`、`curl -v http://localhost:3000/api/health`。 |
| 需要回滚           | 通过 `Deploy Only` 选择旧 tag，或在服务器 `docker compose up -d ghcr.io/...:<tag>`。                                 |

---

## 参考文件

- `docker-compose.yml`、`docker/entrypoint.sh`
- `.github/workflows/ci-critical.yml`、`docker-publish.yml`、`deploy.yml`、`deploy-only.yml`
- `docs/test-strategy.md`

如部署策略变更，请同步更新本文档与 README 中的引用。
