# 自建服务器部署指南

本指南假设你拥有一台可以通过 SSH 访问的 Linux 服务器（推荐 Ubuntu 22.04+），并希望在不使用容器的情况下直接部署到系统环境中。数据库已经切换为 **PostgreSQL**，部署过程中需要一并安装与配置。

## 1. 准备工作

1. **系统更新**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. **安装必备工具**
   ```bash
   sudo apt install -y build-essential curl git
   ```
3. **安装 Node.js (LTS)**
   推荐使用 [nvm](https://github.com/nvm-sh/nvm)。
   ```bash
   curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   source ~/.nvm/nvm.sh
   nvm install --lts
   ```
4. **全局工具（可选）**
   - `pm2`：进程守护，自动重启与日志管理
     ```bash
     npm install -g pm2
     ```
   - `pnpm` 或 `yarn`：替代 npm（非必须）

## 2. PostgreSQL 安装与数据库准备

1. 安装 Postgres：
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   ```
2. 创建数据库与账户（以 `tdp` 为例，可自行调整密码）：
   ```bash
   sudo -u postgres psql <<'SQL'
   CREATE USER tdp WITH PASSWORD 'tdp_password';
   CREATE DATABASE tdp OWNER tdp;
   \q
   SQL
   ```
3. 开启远程访问（如需）：编辑 `/etc/postgresql/14/main/postgresql.conf` 与 `pg_hba.conf`，并重启服务。

## 3. 环境变量

项目根目录新建 `.env`，内容参考 `.env.example`：

```env
DATABASE_URL="postgresql://tdp:tdp_password@localhost:5432/tdp?schema=public"
GOOGLE_CLIENT_ID="实际的 Google OAuth 客户端 ID"
GOOGLE_CLIENT_SECRET="对应密钥"
NEXTAUTH_SECRET="长度>=32 的随机字符串，可通过 `openssl rand -base64 32` 生成"
MAX_UPLOAD_SIZE_MB="8" # 控制单张图片大小上限
NEXTAUTH_URL="https://blog.example.com" # 部署后的实际访问地址
```

## 3. 获取代码

将代码仓库上传或直接 clone 到服务器，例如放在 `/var/www/tdp`：

```bash
mkdir -p /var/www
cd /var/www
git clone <你的仓库地址> tdp
cd tdp
```

## 4. 安装依赖 & 初始化数据库

```bash
npm install
npm run db:migrate
```

> `npm run db:migrate` 会执行 `prisma migrate deploy`，将迁移同步到 PostgreSQL。

如需导入初始数据，可通过 `npx prisma studio` 手动录入，或编写 seeding 脚本。

## 5. 构建并启动应用

### 方案 A：使用 `pm2`

```bash
npm run build
pm2 start npm --name "tdp" -- start
pm2 startup systemd
pm2 save
```

- `pm2 logs tdp` 查看运行日志。
- `pm2 restart tdp` 热重启。

### 方案 B：使用 `systemd`

创建 `/etc/systemd/system/tdp.service`：

```ini
[Unit]
Description=TDP Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/tdp
Environment=NODE_ENV=production
EnvironmentFile=/var/www/tdp/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

然后：

```bash
sudo systemctl daemon-reload
sudo systemctl enable tdp
sudo systemctl start tdp
sudo journalctl -u tdp -f
```

> 如需以不同端口运行，可在 `.env` 中增加 `PORT=3000` 类变量，Next.js 会自动识别。

## 6. 反向代理配置（以 Nginx 为例）

1. 安装 Nginx：
   ```bash
   sudo apt install -y nginx
   ```
2. 创建配置 `/etc/nginx/sites-available/tdp`：

   ```nginx
   server {
     listen 80;
     server_name blog.example.com; # 替换为你的域名或服务器 IP

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

3. 启用站点并测试：
   ```bash
   sudo ln -s /etc/nginx/sites-available/tdp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
4. 使用 [Certbot](https://certbot.eff.org/instructions) 申请 Let’s Encrypt 证书：
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d blog.example.com
   ```

## 7. 静态资源与上传目录

- 所有封面与相册照片默认写入 `public/uploads`。
- 确保启动进程的用户（例如 `www-data`）对该目录有读写权限：
  ```bash
  sudo chown -R www-data:www-data /var/www/tdp/public/uploads
  ```
- 若服务器需要负载均衡或多副本部署，建议将上传目录挂载到共享存储（NFS、对象存储等），或改为使用 CDN/云存储。

## 8. 升级与回滚流程

1. **更新代码**
   ```bash
   cd /var/www/tdp
   git pull origin main
   npm install
   npx prisma migrate deploy # 如有新的迁移
   npm run build
   pm2 restart tdp           # 或 systemctl restart tdp
   ```
2. **回滚**
   - 使用 `git checkout <之前的 tag 或 commit>`，重新执行 `npm install` 与 `npm run build`。
   - 若数据库需要回滚，可在 `prisma/migrations` 中执行 `npx prisma migrate resolve --rolled-back "<migrationName>"`，然后 `prisma migrate deploy`。对生产环境建议提前备份 `dev.db` 文件。

## 9. 备份策略

- **数据库（PostgreSQL）**：
  使用 `pg_dump` 进行备份：
  ```bash
  pg_dump --no-owner --dbname="postgresql://tdp:tdp_password@localhost:5432/tdp" > /backups/tdp_$(date +%Y%m%d%H%M%S).sql
  ```
- **上传文件**：将 `public/uploads` 打包或同步到远程备份（rsync/cron）。
- 可使用简单的 `cron`：
  ```bash
  cronjob
  0 3 * * * /usr/bin/rsync -avz /var/www/tdp/prisma/dev.db /backups/
  ```

## 10. 常见运维手册

- **查看日志**：`pm2 logs tdp` 或 `journalctl -u tdp -f`
- **重启服务**：`pm2 restart tdp` 或 `systemctl restart tdp`
- **占用端口**：确认 3000 端口未被占用，若需修改，可在 `.env` 设置 `PORT=xxxx`
- **权限问题**：确保部署用户对项目目录拥有读写权限，特别是 `public/uploads`；数据库凭据通过环境变量管理。

## 11. 后续扩展建议

- **数据库迁移到 Postgres**：将 `DATABASE_URL` 改为实际 Postgres 连接字符串，并更新 `prisma/schema.prisma` 中 `provider = "postgresql"`，再执行 `npx prisma migrate dev`。
- **CI/CD**：使用 GitHub Actions 或 GitLab CI 自动化构建、部署，触发脚本包含上面的升级流程即可。
- **监控**：配合 PM2 的 `pm2 monit` 或引入 Prometheus/Grafana 获取更多指标。

---

按照上述步骤配置后，就可以在自有服务器上稳定运行博客项目，并通过 `git pull + migrate + build + restart` 的流程持续更新。
