# 用户配置清单

本文档提供完整的用户配置步骤清单，帮助您快速完成项目部署和自动化配置。

## 📌 配置流程总览

```
1️⃣ 基础环境准备
    ↓
2️⃣ OAuth 凭据配置
    ↓
3️⃣ 选择部署方式
    ├── Docker 部署（推荐）
    └── 自建服务器部署
    ↓
4️⃣ （可选）配置自动部署
    ↓
5️⃣ 验证与测试
```

---

## 1️⃣ 基础环境准备

### ✅ 本地开发环境

**必需软件清单：**

- [ ] **Node.js 20+**（LTS 版本）
  ```bash
  node --version  # 应显示 v20.x.x
  ```

- [ ] **Docker 与 Docker Compose**（如使用容器部署）
  ```bash
  docker --version        # 应显示 Docker version 20+
  docker compose version  # 应显示 Docker Compose version v2+
  ```

- [ ] **Git**（版本管理）
  ```bash
  git --version
  ```

**安装指引：**

<details>
<summary>📦 macOS 安装</summary>

```bash
# 使用 Homebrew
brew install node@20
brew install docker
brew install git
```
</details>

<details>
<summary>📦 Ubuntu/Debian 安装</summary>

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Git
sudo apt install -y git
```
</details>

<details>
<summary>📦 Windows 安装</summary>

1. Node.js: 从 [nodejs.org](https://nodejs.org/) 下载 LTS 版本
2. Docker: 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
3. Git: 从 [git-scm.com](https://git-scm.com/) 下载安装
</details>

---

## 2️⃣ Google OAuth 凭据配置

### 步骤 1：创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 记录项目 ID

### 步骤 2：启用 Google+ API

1. 在左侧菜单选择 **APIs & Services** → **Library**
2. 搜索 "Google+ API"
3. 点击 **Enable**

### 步骤 3：创建 OAuth 2.0 凭据

1. 进入 **APIs & Services** → **Credentials**
2. 点击 **Create Credentials** → **OAuth client ID**
3. 选择 **Application type**: **Web application**
4. 配置：
   - **Name**: `TDP Blog` (或自定义名称)
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     https://yourdomain.com/api/auth/callback/google
     ```
5. 点击 **Create**
6. **复制保存** Client ID 和 Client Secret

**⚠️ 重要**：妥善保管 Client Secret，不要提交到公开仓库！

---

## 3️⃣ 选择部署方式

### 🐳 方式 A：Docker 部署（推荐）

**适用场景：**
- ✅ 快速部署，环境隔离
- ✅ 跨平台一致性
- ✅ 方便扩展和维护

**配置步骤：**

#### A1. 克隆项目

```bash
git clone https://github.com/your-username/tdp.git
cd tdp
```

#### A2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置（使用 Docker Compose 默认值）
DATABASE_URL="postgresql://tdp:tdp_password@postgres:5432/tdp?schema=public"

# Google OAuth 凭据（必填）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth 配置（必填）
NEXTAUTH_SECRET="生成的随机密钥"  # 使用下方命令生成
NEXTAUTH_URL="http://localhost:3000"  # 生产环境改为实际域名

# 上传配置
MAX_UPLOAD_SIZE_MB="8"
```

生成 `NEXTAUTH_SECRET`：
```bash
openssl rand -base64 32
```

#### A3. 启动服务

```bash
# 构建并启动
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app
```

#### A4. 访问应用

打开浏览器访问：http://localhost:3000

**配置清单：**
- [ ] 项目已克隆到本地
- [ ] `.env` 文件已配置所有必需变量
- [ ] `NEXTAUTH_SECRET` 已生成（32位以上随机字符串）
- [ ] Docker 服务已启动且状态为 `healthy`
- [ ] 访问 http://localhost:3000 正常显示
- [ ] Google 登录功能正常工作

**详细文档**：[Docker 部署指南](./docker-deployment.md)

---

### 🖥️ 方式 B：自建服务器部署

**适用场景：**
- ✅ 完全控制服务器环境
- ✅ 已有服务器资源
- ✅ 需要深度定制

**配置步骤：**

#### B1. 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 PM2（进程管理）
npm install -g pm2
```

#### B2. 配置数据库

```bash
# 创建数据库用户和数据库
sudo -u postgres psql <<'SQL'
CREATE USER tdp WITH PASSWORD 'your_secure_password';
CREATE DATABASE tdp OWNER tdp;
\q
SQL
```

#### B3. 部署项目

```bash
# 克隆项目
cd /var/www
sudo git clone https://github.com/your-username/tdp.git
cd tdp

# 配置环境变量
sudo nano .env
```

`.env` 配置：
```env
DATABASE_URL="postgresql://tdp:your_secure_password@localhost:5432/tdp?schema=public"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://yourdomain.com"
MAX_UPLOAD_SIZE_MB="8"
```

```bash
# 安装依赖
npm install

# 数据库迁移
npm run db:migrate

# 构建项目
npm run build

# 启动服务
pm2 start npm --name "tdp" -- start
pm2 save
pm2 startup
```

#### B4. 配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/tdp
```

Nginx 配置：
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/health {
        access_log off;
        proxy_pass http://127.0.0.1:3000/api/health;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/tdp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 配置 HTTPS（使用 Certbot）
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**配置清单：**
- [ ] 服务器环境已安装（Node.js, PostgreSQL, Nginx）
- [ ] 数据库已创建并配置用户权限
- [ ] 项目已部署到 `/var/www/tdp`
- [ ] `.env` 文件已正确配置
- [ ] 数据库迁移已执行
- [ ] PM2 服务已启动且自动重启已配置
- [ ] Nginx 反向代理已配置
- [ ] HTTPS 证书已申请并配置
- [ ] 防火墙规则已配置（开放 80, 443 端口）

**详细文档**：[自建服务器部署指南](./self-host-deployment.md)

---

## 4️⃣ （可选）配置自动部署

**前置条件：**
- ✅ 已完成 Docker 部署方式配置
- ✅ 服务器可通过 SSH 访问
- ✅ GitHub 仓库已推送代码

### 步骤 1：生成 SSH 密钥对

**在本地电脑执行：**

```bash
# 生成专用部署密钥（不设置密码）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# 查看公钥
cat ~/.ssh/github_deploy_key.pub

# 查看私钥（稍后需要）
cat ~/.ssh/github_deploy_key
```

### 步骤 2：配置服务器 SSH 访问

```bash
# 上传公钥到服务器
ssh-copy-id -i ~/.ssh/github_deploy_key.pub your_user@your_server_ip

# 验证连接
ssh -i ~/.ssh/github_deploy_key your_user@your_server_ip
```

### 步骤 3：配置 GitHub Secrets

在 GitHub 仓库中配置（**Settings** → **Secrets and variables** → **Actions** → **New repository secret**）：

| Secret 名称 | 获取方式 | 示例值 |
|------------|---------|--------|
| `SSH_HOST` | 服务器 IP 或域名 | `38.246.246.229` |
| `SSH_PORT` | SSH 端口 | `22` |
| `SSH_USER` | SSH 用户名 | `ubuntu` |
| `SSH_KEY` | 私钥完整内容 | `cat ~/.ssh/github_deploy_key` 的输出 |
| `PROJECT_DIR` | 项目路径 | `/var/www/tdp` |

**⚠️ 重要**：
- `SSH_KEY` 必须包含完整的密钥内容（包括 `-----BEGIN/END-----` 标记）
- 不要在密钥中添加额外的空格或换行

### 步骤 4：配置服务器项目

```bash
# SSH 登录到服务器
ssh your_user@your_server_ip

# 进入项目目录
cd /var/www/tdp

# 确保是 Git 仓库
git remote -v

# 配置 docker-compose.yml 使用远程镜像
nano docker-compose.yml
```

修改 `docker-compose.yml`：
```yaml
services:
  app:
    # 使用 GitHub Container Registry 镜像
    image: ghcr.io/your-username/tdp:latest
    pull_policy: always

    # 注释掉本地构建
    # build:
    #   context: .
    #   dockerfile: Dockerfile
```

### 步骤 5：测试自动部署

**方式 1：推送代码触发**
```bash
# 本地推送到 main 分支
git add .
git commit -m "test: trigger auto deployment"
git push origin main
```

**方式 2：手动触发**
1. 访问 GitHub 仓库 → **Actions** 标签页
2. 选择 **Auto Deploy** 工作流
3. 点击 **Run workflow**
4. 点击绿色按钮开始部署

### 步骤 6：验证部署结果

在 GitHub Actions 页面查看：
- ✅ **绿色勾号**：部署成功
- ❌ **红色叉号**：部署失败（点击查看日志）

在服务器上验证：
```bash
# 查看服务状态
docker compose ps

# 查看服务日志
docker compose logs -f app

# 测试健康检查
curl http://localhost:3000/api/health
```

**配置清单：**
- [ ] SSH 密钥对已生成（无密码保护）
- [ ] 服务器已添加公钥到 `authorized_keys`
- [ ] SSH 连接测试成功
- [ ] GitHub Secrets 已配置（5 个必需值）
- [ ] 服务器项目目录已配置为 Git 仓库
- [ ] `docker-compose.yml` 已修改为使用远程镜像
- [ ] 手动触发部署测试成功
- [ ] 推送代码自动触发部署成功
- [ ] 部署后服务健康检查通过

**详细文档**：[自动部署配置指南](./auto-deployment-setup.md)

---

## 5️⃣ 验证与测试

### ✅ 功能验证清单

#### 基础功能
- [ ] 访问首页正常显示
- [ ] Google 登录功能正常
- [ ] 健康检查接口返回正常
  ```bash
  curl http://localhost:3000/api/health
  # 应返回：{"ok":true,"db":"ok","timestamp":"..."}
  ```

#### 后台管理
- [ ] 登录后台成功（`/admin`）
- [ ] 创建文章功能正常
- [ ] 上传图片功能正常
- [ ] 编辑文章功能正常
- [ ] 删除文章功能正常
- [ ] 相册管理功能正常

#### 数据库
- [ ] 数据库连接正常
- [ ] 数据持久化正常（重启后数据不丢失）
- [ ] 数据库迁移正常执行

#### 性能与安全
- [ ] 页面加载速度正常（< 3秒）
- [ ] 图片上传大小限制生效（默认 8MB）
- [ ] HTTPS 证书配置正常（生产环境）
- [ ] 容器健康检查正常（Docker 部署）

### 🐛 常见问题排查

<details>
<summary>❌ Google 登录失败：Error 400: redirect_uri_mismatch</summary>

**原因**：OAuth 回调 URI 配置不正确

**解决方案**：
1. 检查 Google Cloud Console 中的 **Authorized redirect URIs** 是否包含：
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
2. 确保 `.env` 中的 `NEXTAUTH_URL` 与实际访问地址一致
3. 清除浏览器缓存并重试
</details>

<details>
<summary>❌ 数据库连接失败：Can't reach database server</summary>

**原因**：数据库服务未启动或连接字符串错误

**解决方案**：

**Docker 部署：**
```bash
# 检查数据库容器状态
docker compose ps postgres

# 检查数据库日志
docker compose logs postgres

# 重启数据库服务
docker compose restart postgres
```

**自建部署：**
```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 启动服务
sudo systemctl start postgresql

# 测试连接
psql -U tdp -d tdp -h localhost
```
</details>

<details>
<summary>❌ 自动部署失败：SSH connection failed</summary>

**原因**：SSH 密钥配置错误或服务器访问受限

**解决方案**：
1. 验证 SSH 密钥：
   ```bash
   ssh -i ~/.ssh/github_deploy_key your_user@your_server_ip
   ```
2. 检查 GitHub Secrets 中的 `SSH_KEY` 是否包含完整内容
3. 确认服务器防火墙允许 SSH 端口访问
4. 检查服务器 SSH 日志：
   ```bash
   sudo tail -f /var/log/auth.log
   ```
</details>

<details>
<summary>❌ 图片上传失败：Upload failed</summary>

**原因**：上传目录权限不足或大小超限

**解决方案**：

**Docker 部署：**
```bash
# 检查上传目录权限
ls -la public/uploads

# 修复权限（如需要）
docker compose exec app chmod 755 /app/public/uploads
```

**自建部署：**
```bash
# 创建上传目录
mkdir -p /var/www/tdp/public/uploads

# 设置权限
sudo chown -R www-data:www-data /var/www/tdp/public/uploads
sudo chmod -R 755 /var/www/tdp/public/uploads
```

检查图片大小是否超过限制（`.env` 中的 `MAX_UPLOAD_SIZE_MB`）
</details>

---

## 📚 相关文档索引

- **部署文档**
  - [Docker 部署指南](./docker-deployment.md)
  - [自建服务器部署指南](./self-host-deployment.md)
  - [自动部署配置指南](./auto-deployment-setup.md)

- **API 文档**
  - [健康检查 API](../README.md#健康检查)

- **开发文档**
  - [项目 README](../README.md)
  - [环境变量说明](../.env.example)

---

## 🆘 获取帮助

如果遇到本文档未涵盖的问题：

1. **检查日志**：
   - Docker: `docker compose logs app`
   - PM2: `pm2 logs tdp`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

2. **搜索 Issues**：在 GitHub 仓库中搜索类似问题

3. **提交 Issue**：详细描述问题、环境信息和错误日志

4. **社区讨论**：在 GitHub Discussions 中提问

---

## ✅ 配置完成

恭喜！如果您完成了上述所有步骤，您的博客项目已经成功部署并配置了自动化流程。

**下一步建议：**
- 📝 开始创建您的第一篇文章
- 🎨 自定义网站样式和配置
- 📊 配置网站分析（Google Analytics）
- 🔔 设置部署通知（Slack/Discord）
- 🔒 定期备份数据库和上传文件

祝您使用愉快！🎉