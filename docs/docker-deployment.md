# Docker 部署指南

本文档说明如何使用 Docker 与 docker-compose 在自有服务器上运行博客项目，并同时启动 PostgreSQL 数据库。

## 1. 前置要求

- 已安装 Docker 与 docker-compose（Docker Engine 20+，docker compose v2）。
- 服务器开放 3000 端口或自定义端口。
- 准备好 Google OAuth 凭据及随机生成的 `NEXTAUTH_SECRET`。

## 2. 配置环境变量

复制 `.env.example` 为 `.env`，并根据实际情况修改：

```bash
cp .env.example .env
```

重点变量说明：

- `DATABASE_URL`：默认指向 `postgres` 服务。若自定义数据库用户/密码，请同步修改。
- `NEXTAUTH_URL`：部署后的对外访问地址（如 `https://blog.example.com`）。
- `NEXTAUTH_SECRET`：必填，用于 NextAuth 加密签名。
- `MAX_UPLOAD_SIZE_MB`：限制上传图片大小（默认 8MB）。

## 3. 启动服务

```bash
docker compose up -d --build
```

该命令完成如下操作：

1. 构建应用镜像（多阶段，包含生产依赖与构建产物）。
2. 默认会启动 `postgres` 数据库容器并持久化到 `postgres-data` 卷；若已拥有外部 PostgreSQL（例如 38.246.246.229），保持 `.env` 中的连接串即可，`postgres` 服务可以保留或移除。
3. 启动应用容器，执行 `npm run db:migrate` 自动迁移数据库，再运行 `npm run start`。
4. 将宿主机 `./public/uploads` 挂载到容器，确保图片持久化。

访问 <http://localhost:3000>（或映射后的域名/端口），完成 Google 登录后即可使用后台。

## 4. 健康检查

应用已内置健康检查接口 `/api/health`，用于监控应用和数据库状态：

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health
```

正常响应：
```json
{
  "ok": true,
  "db": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

Docker Compose 已配置自动健康探针：
- **interval**: 10s - 每10秒检查一次
- **timeout**: 5s - 5秒超时
- **retries**: 10 - 失败10次才标记为不健康
- **start_period**: 30s - 启动后30秒开始检查

查看容器健康状态：
```bash
docker compose ps
# 显示服务状态：healthy, starting, unhealthy
```

## 5. 安全配置

### 非 Root 运行
应用容器已配置为使用 `node` 用户运行（非 root），提升安全性：

```bash
# 验证容器进程用户
docker exec tdp-app id
# 输出应显示 UID/GID 非 0
```

### 文件权限
- 上传目录 `public/uploads` 已通过卷映射确保可写
- 入口脚本会自动创建所需目录并设置权限

### 最佳实践
- 定期更新基础镜像和依赖
- 使用强随机密钥作为 `NEXTAUTH_SECRET`
- 在生产环境中使用 HTTPS
- 配置防火墙限制不必要的端口访问

## 6. CI/CD 镜像发布

项目已配置 GitHub Actions 自动构建和发布 Docker 镜像：

### 触发条件
- 推送到 `main` 分支
- 创建版本标签（如 `v1.0.0`）

### 镜像仓库
镜像发布到 GitHub Container Registry (GHCR)：
```
ghcr.io/[username]/tdp:latest
ghcr.io/[username]/tdp:[git-sha]
```

### 使用发布的镜像
修改 `docker-compose.yml` 使用远程镜像：
```yaml
services:
  app:
    image: ghcr.io/[username]/tdp:latest
    # 注释掉 build 配置
    # build:
    #   context: .
    #   dockerfile: Dockerfile
```

然后拉取并启动：
```bash
docker compose pull
docker compose up -d
```

## 7. 常用命令

- 查看日志：`docker compose logs -f app`
- 运行数据库控制台：
  ```bash
  docker compose exec postgres psql -U tdp -d tdp
  ```
- 停止服务：`docker compose down`
- 更新代码：
  ```bash
  git pull origin main
  docker compose pull       # 若使用远程镜像，可替换为 build
  docker compose build app
  docker compose up -d app
  ```
  （构建完成后容器会自动执行迁移，确保 schema 最新。）

## 8. 数据备份

- 数据库备份：
  ```bash
  docker compose exec postgres pg_dump -U tdp -d tdp > backups/tdp_$(date +%Y%m%d%H%M%S).sql
  ```
- 上传文件备份：直接同步 `public/uploads` 目录。

## 9. 自定义配置

- 修改监听端口：编辑 `docker-compose.yml` 中 app 服务的 `ports` 映射，如 `8080:3000`。
- 调整数据库密码/名称：同时修改 `.env` 与 `docker-compose.yml` 的环境变量。
- 多环境部署：为不同环境定义 `.env.production`、`.env.staging` 等文件，再用 `env_file` 引用。

## 10. 生产环境建议

- 在 Nginx/Traefik 前端做反向代理与 HTTPS 终端。
- 将备份任务加入 crontab，例如定期调用 `pg_dump`。
- 若采用多节点部署，请使用外部对象存储或共享卷替代 `public/uploads` 本地挂载。

完成上述配置后，即可通过 Docker 快速上线并保持后续升级的稳定与可重复。
