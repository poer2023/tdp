# 🔧 用户操作清单 - 需要您手动完成的配置

本文档列出了**需要您手动完成**的配置步骤，所有技术实现已经完成，但涉及外部服务和机密信息的配置需要您自行操作。

---

## ✅ 已完成的技术工作

以下内容**已由系统完成**，无需您操作：

- ✅ 健康检查 API 实现（`/api/health`）
- ✅ Docker 配置优化（非 root 运行、健康检查、standalone 构建）
- ✅ GitHub Actions 工作流（CI、E2E、镜像构建、安全扫描、自动部署）
- ✅ 完整部署文档（Docker 部署、自建服务器部署、自动部署配置）
- ✅ 用户配置清单和快速入门指南

---

## 📝 需要您完成的配置（按优先级排序）

### 🔴 P1 - 必须完成（基础运行）

#### 1. 配置 Google OAuth 凭据

**为什么需要**：应用使用 Google 登录进行身份验证

**步骤**：

1. **访问 Google Cloud Console**
   - 打开 https://console.cloud.google.com/
   - 创建新项目或选择现有项目

2. **启用 Google+ API**
   - 左侧菜单 → APIs & Services → Library
   - 搜索 "Google+ API" → 点击 Enable

3. **创建 OAuth 2.0 凭据**
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://yourdomain.com/api/auth/callback/google
     ```

4. **保存凭据**
   - 复制 **Client ID** 和 **Client Secret**
   - ⚠️ 妥善保管，不要泄露或提交到代码仓库

**配置位置**：在 `.env` 文件中填入：
```env
GOOGLE_CLIENT_ID="你的Client ID"
GOOGLE_CLIENT_SECRET="你的Client Secret"
```

**参考文档**：`docs/user-configuration-checklist.md` 第 2 节

---

#### 2. 生成 NEXTAUTH_SECRET

**为什么需要**：NextAuth 用于加密会话数据

**步骤**：

在终端执行：
```bash
openssl rand -base64 32
```

复制生成的随机字符串到 `.env` 文件：
```env
NEXTAUTH_SECRET="生成的32位随机字符串"
```

---

#### 3. 配置环境变量

**为什么需要**：应用需要正确的配置才能运行

**步骤**：

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **编辑 `.env` 文件**
   ```env
   # 数据库配置（Docker 部署使用默认值即可）
   DATABASE_URL="postgresql://tdp:tdp_password@postgres:5432/tdp?schema=public"

   # Google OAuth（必填 - 使用上面获取的值）
   GOOGLE_CLIENT_ID="你的Client ID"
   GOOGLE_CLIENT_SECRET="你的Client Secret"

   # NextAuth 配置（必填）
   NEXTAUTH_SECRET="生成的32位随机字符串"
   NEXTAUTH_URL="http://localhost:3000"  # 生产环境改为实际域名

   # 上传配置（可选，默认 8MB）
   MAX_UPLOAD_SIZE_MB="8"
   ```

3. **生产环境额外配置**
   - 将 `NEXTAUTH_URL` 改为实际域名：`https://yourdomain.com`
   - 在 Google OAuth 配置中添加生产域名的回调 URI

**参考文档**：`docs/user-configuration-checklist.md` 第 3 节

---

### 🟡 P2 - 建议完成（自动部署）

#### 4. （可选）配置自动部署

**为什么需要**：推送代码后自动部署到服务器，提升开发效率

**前置条件**：
- 已有服务器可通过 SSH 访问
- 服务器已安装 Docker 和 Docker Compose
- 服务器已完成项目初始部署

**步骤总览**：

##### 4.1 生成 SSH 密钥对

在**本地电脑**执行：
```bash
# 生成专用部署密钥（不要设置密码）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

##### 4.2 配置服务器 SSH 访问

```bash
# 上传公钥到服务器
ssh-copy-id -i ~/.ssh/github_deploy_key.pub your_user@your_server_ip

# 验证连接
ssh -i ~/.ssh/github_deploy_key your_user@your_server_ip
```

##### 4.3 配置 GitHub Secrets

在 GitHub 仓库配置（**Settings** → **Secrets and variables** → **Actions** → **New repository secret**）：

| Secret 名称 | 说明 | 如何获取 |
|------------|------|---------|
| `SSH_HOST` | 服务器 IP 或域名 | 例如：`38.246.246.229` |
| `SSH_PORT` | SSH 端口 | 通常为 `22` |
| `SSH_USER` | SSH 用户名 | 例如：`ubuntu` 或 `root` |
| `SSH_KEY` | SSH 私钥完整内容 | `cat ~/.ssh/github_deploy_key` |
| `PROJECT_DIR` | 项目在服务器上的路径 | 例如：`/var/www/tdp` |

**⚠️ 重要提示**：
- `SSH_KEY` 必须包含**完整内容**，包括 `-----BEGIN/END-----` 标记
- 不要在密钥中添加额外的空格或换行
- 确保服务器项目目录已配置为 Git 仓库

##### 4.4 修改服务器配置

SSH 登录到服务器后执行：

```bash
# 进入项目目录
cd /var/www/tdp  # 替换为实际路径

# 确保是 Git 仓库
git remote -v

# 修改 docker-compose.yml 使用远程镜像
nano docker-compose.yml
```

修改内容：
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

##### 4.5 测试自动部署

**方式 1：推送代码触发**
```bash
git add .
git commit -m "test: trigger auto deployment"
git push origin main
```

**方式 2：手动触发**
1. 访问 GitHub 仓库 → **Actions** 标签页
2. 选择 **Auto Deploy** 工作流
3. 点击 **Run workflow** → 点击绿色按钮

**验证部署结果**：
- GitHub Actions 页面显示绿色勾号
- 服务器上执行：`docker compose ps`（服务状态应为 healthy）
- 访问网站验证功能正常

**详细文档**：`docs/auto-deployment-setup.md`（完整的配置指南、安全最佳实践、故障排查）

---

### 🟢 P3 - 生产环境建议

#### 5. 配置 HTTPS 证书（生产环境）

**为什么需要**：生产环境必须使用 HTTPS 保护用户数据

**步骤**（使用 Certbot + Let's Encrypt）：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（会自动配置 Nginx）
sudo certbot --nginx -d yourdomain.com

# 设置自动续期
sudo systemctl enable certbot.timer
```

**参考文档**：`docs/self-host-deployment.md` 第 6 节

---

#### 6. 配置防火墙规则

**为什么需要**：保护服务器安全，只开放必要端口

**步骤**（Ubuntu/Debian）：

```bash
# 开放必要端口
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

#### 7. 配置数据库备份

**为什么需要**：定期备份数据防止丢失

**步骤**（使用 cron 定时任务）：

```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-tdp.sh
```

脚本内容：
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
docker compose exec -T postgres pg_dump -U tdp -d tdp > "$BACKUP_DIR/db_$DATE.sql"

# 备份上传文件
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" public/uploads

# 删除 7 天前的备份
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
# 设置权限
sudo chmod +x /usr/local/bin/backup-tdp.sh

# 添加到 crontab（每天凌晨 3 点执行）
echo "0 3 * * * /usr/local/bin/backup-tdp.sh" | sudo crontab -
```

---

## 📋 配置验证清单

完成上述配置后，请验证：

### 必须验证（P1）
- [ ] 访问 http://localhost:3000 正常显示首页
- [ ] Google 登录功能正常工作
- [ ] 健康检查接口返回正常：`curl http://localhost:3000/api/health`
- [ ] Docker 服务状态为 healthy：`docker compose ps`
- [ ] 可以创建文章并上传图片

### 可选验证（P2）
- [ ] 推送代码自动触发部署成功
- [ ] GitHub Actions 工作流全部通过（绿色勾号）
- [ ] 服务器自动拉取最新镜像并重启

### 生产环境验证（P3）
- [ ] HTTPS 证书配置成功，浏览器显示锁标志
- [ ] 防火墙规则已配置，`sudo ufw status` 显示正确
- [ ] 数据库备份定时任务正常运行

---

## 🆘 遇到问题？

### 常见问题快速解决

**问题 1：Google 登录失败 - Error 400**
- 检查 Google Cloud Console 的回调 URI 配置
- 确保 `.env` 中的 `NEXTAUTH_URL` 与实际访问地址一致

**问题 2：数据库连接失败**
- 检查 Docker 容器状态：`docker compose ps`
- 查看数据库日志：`docker compose logs postgres`

**问题 3：自动部署失败**
- 验证 SSH 连接：`ssh -i ~/.ssh/github_deploy_key your_user@your_server_ip`
- 检查 GitHub Secrets 配置是否完整

**详细故障排查**：参考 `docs/user-configuration-checklist.md` 第 5.2 节

---

## 📚 完整文档索引

1. **快速入门**：[docs/user-configuration-checklist.md](./docs/user-configuration-checklist.md)
   - 完整的配置流程和清单
   - Docker 和自建服务器部署指南
   - 详细的故障排查步骤

2. **Docker 部署**：[docs/docker-deployment.md](./docs/docker-deployment.md)
   - Docker Compose 配置说明
   - 健康检查和安全配置
   - CI/CD 镜像发布流程

3. **自建服务器部署**：[docs/self-host-deployment.md](./docs/self-host-deployment.md)
   - 服务器环境准备
   - Nginx 反向代理配置
   - HTTPS 证书申请

4. **自动部署配置**：[docs/auto-deployment-setup.md](./docs/auto-deployment-setup.md)
   - SSH 密钥生成和配置
   - GitHub Secrets 详细说明
   - 安全最佳实践和故障排查

---

## ✅ 配置完成后

恭喜！完成上述配置后，您的博客项目将拥有：

- ✅ 安全的用户认证系统（Google OAuth）
- ✅ 生产级别的 Docker 部署
- ✅ 完整的 CI/CD 自动化流程
- ✅ 镜像安全扫描和健康检查
- ✅ 自动部署能力（可选）
- ✅ 完善的文档和故障排查指南

**下一步建议**：
- 📝 开始创建您的第一篇文章
- 🎨 自定义网站样式和配置
- 📊 配置网站分析工具
- 🔔 设置部署通知（Slack/Discord）

祝您使用愉快！🎉