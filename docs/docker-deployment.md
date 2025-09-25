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

## 4. 常用命令

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

## 5. 数据备份

- 数据库备份：
  ```bash
  docker compose exec postgres pg_dump -U tdp -d tdp > backups/tdp_$(date +%Y%m%d%H%M%S).sql
  ```
- 上传文件备份：直接同步 `public/uploads` 目录。

## 6. 自定义配置

- 修改监听端口：编辑 `docker-compose.yml` 中 app 服务的 `ports` 映射，如 `8080:3000`。
- 调整数据库密码/名称：同时修改 `.env` 与 `docker-compose.yml` 的环境变量。
- 多环境部署：为不同环境定义 `.env.production`、`.env.staging` 等文件，再用 `env_file` 引用。

## 7. 生产环境建议

- 在 Nginx/Traefik 前端做反向代理与 HTTPS 终端。
- 将备份任务加入 crontab，例如定期调用 `pg_dump`。
- 若采用多节点部署，请使用外部对象存储或共享卷替代 `public/uploads` 本地挂载。

完成上述配置后，即可通过 Docker 快速上线并保持后续升级的稳定与可重复。
