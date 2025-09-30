# 自动部署配置指南

本文档说明如何配置 GitHub Actions 实现推送代码后自动部署到服务器。

## 📋 前置条件

1. ✅ 服务器已安装 Docker 和 docker-compose
2. ✅ 服务器已配置好项目环境（参考 [docker-deployment.md](./docker-deployment.md)）
3. ✅ 服务器可以通过 SSH 访问
4. ✅ GitHub 仓库已启用 Actions 功能

## 🔑 第一步：生成 SSH 密钥对

在**本地电脑**执行以下命令生成专用于部署的 SSH 密钥对：

```bash
# 生成 ED25519 密钥对（推荐）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# 或使用 RSA 密钥（如果服务器不支持 ED25519）
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

**重要**：密钥生成时**不要设置密码**（直接回车），否则 GitHub Actions 无法自动使用。

## 🖥️ 第二步：配置服务器 SSH 访问

### 1. 上传公钥到服务器

将生成的公钥（`github_deploy_key.pub`）添加到服务器的 `authorized_keys`：

```bash
# 方式 1：使用 ssh-copy-id（推荐）
ssh-copy-id -i ~/.ssh/github_deploy_key.pub your_user@your_server_ip

# 方式 2：手动复制
cat ~/.ssh/github_deploy_key.pub | ssh your_user@your_server_ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 2. 验证 SSH 连接

```bash
# 使用生成的密钥测试连接
ssh -i ~/.ssh/github_deploy_key your_user@your_server_ip

# 如果能正常登录，说明配置成功
```

### 3. 配置服务器权限

确保部署用户对项目目录有完整权限：

```bash
# 在服务器上执行
sudo chown -R your_user:your_user /path/to/project
chmod -R 755 /path/to/project

# 确保用户可以使用 docker 命令（无需 sudo）
sudo usermod -aG docker your_user
newgrp docker
```

## 🔐 第三步：配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets（Settings → Secrets and variables → Actions → New repository secret）：

| Secret 名称   | 说明                 | 示例值                                         |
| ------------- | -------------------- | ---------------------------------------------- |
| `SSH_HOST`    | 服务器 IP 地址或域名 | `38.246.246.229` 或 `blog.example.com`         |
| `SSH_PORT`    | SSH 端口             | `22`（默认）或自定义端口如 `2222`              |
| `SSH_USER`    | SSH 登录用户名       | `ubuntu` 或 `root`                             |
| `SSH_KEY`     | SSH 私钥内容         | 复制 `~/.ssh/github_deploy_key` 的**完整内容** |
| `PROJECT_DIR` | 项目在服务器上的路径 | `/var/www/tdp` 或 `/home/user/tdp`             |

### 如何复制私钥内容

**macOS/Linux:**

```bash
cat ~/.ssh/github_deploy_key | pbcopy  # macOS（自动复制到剪贴板）
cat ~/.ssh/github_deploy_key           # Linux（手动复制输出）
```

**Windows:**

```powershell
Get-Content ~\.ssh\github_deploy_key | Set-Clipboard  # PowerShell
type %USERPROFILE%\.ssh\github_deploy_key             # CMD
```

**注意**：必须复制**完整内容**，包括：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAA...（中间省略）
-----END OPENSSH PRIVATE KEY-----
```

## 🚀 第四步：验证部署流程

### 自动触发部署

推送代码到 `main` 分支会自动触发部署流程：

```bash
git add .
git commit -m "feat: trigger auto deployment"
git push origin main
```

### 手动触发部署

在 GitHub 仓库页面：

1. 进入 **Actions** 标签页
2. 选择 **Auto Deploy** 工作流
3. 点击 **Run workflow**
4. 选择环境（production/staging）
5. 点击 **Run workflow** 按钮

### 查看部署状态

在 Actions 页面可以实时查看部署进度和日志：

- ✅ **绿色勾号**：部署成功
- ❌ **红色叉号**：部署失败（点击查看详细日志）

## 🔍 部署流程说明

自动部署工作流（`.github/workflows/deploy.yml`）执行以下步骤：

1. **触发条件**：
   - Docker 镜像构建成功后自动触发
   - 或手动触发（workflow_dispatch）

2. **部署步骤**：

   ```bash
   # 1. SSH 连接到服务器
   # 2. 进入项目目录
   cd $PROJECT_DIR

   # 3. 拉取最新代码
   git pull origin main

   # 4. 拉取最新 Docker 镜像
   docker compose pull

   # 5. 重启服务
   docker compose up -d

   # 6. 等待服务启动（30秒）
   sleep 30

   # 7. 健康检查
   docker compose ps  # 检查服务是否 healthy

   # 8. 清理旧镜像
   docker image prune -f
   ```

3. **失败处理**：
   - 如果健康检查失败，自动输出服务日志
   - 部署失败会发送通知（Notification job）

## 🛠️ 服务器端配置

### 1. 确保项目目录是 Git 仓库

```bash
cd /path/to/project

# 如果不是 Git 仓库，初始化
git init
git remote add origin https://github.com/your-username/tdp.git
git pull origin main

# 配置 Git（允许 pull 不冲突）
git config pull.rebase false
```

### 2. 配置 docker-compose.yml 使用远程镜像

修改 `docker-compose.yml`：

```yaml
services:
  app:
    # 使用 GHCR 镜像而非本地构建
    image: ghcr.io/your-username/tdp:latest
    pull_policy: always

    # 注释掉 build 配置
    # build:
    #   context: .
    #   dockerfile: Dockerfile
```

### 3. 配置环境变量

确保 `.env` 文件存在且包含所有必需变量：

```bash
cp .env.example .env
nano .env  # 编辑实际配置
```

### 4. 确保 Docker 服务运行

```bash
# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证 Docker 正常运行
docker ps
docker compose version
```

## 🔒 安全最佳实践

### 1. 使用专用部署密钥

- ✅ **推荐**：为部署生成专用 SSH 密钥
- ❌ **避免**：使用个人主密钥或带密码的密钥

### 2. 限制 SSH 密钥权限

在服务器上配置 `~/.ssh/authorized_keys`：

```bash
# 限制密钥只能执行部署命令（可选高级配置）
command="cd /var/www/tdp && git pull && docker compose pull && docker compose up -d",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...
```

### 3. 使用非标准 SSH 端口

编辑服务器 `/etc/ssh/sshd_config`：

```bash
Port 2222  # 修改为非标准端口
PermitRootLogin no
PasswordAuthentication no
```

重启 SSH 服务：

```bash
sudo systemctl restart sshd
```

记得在 GitHub Secrets 中更新 `SSH_PORT`。

### 4. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 2222/tcp  # SSH 端口
sudo ufw allow 3000/tcp  # 应用端口
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=2222/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 🐛 故障排查

### 问题 1：SSH 连接失败

**错误信息**：`Permission denied (publickey)`

**解决方案**：

```bash
# 1. 检查公钥是否正确添加到服务器
ssh your_user@your_server_ip "cat ~/.ssh/authorized_keys"

# 2. 检查服务器 SSH 权限
ssh your_user@your_server_ip "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# 3. 检查服务器 SSH 配置
ssh your_user@your_server_ip "sudo cat /var/log/auth.log | tail -20"
```

### 问题 2：Docker 权限问题

**错误信息**：`permission denied while trying to connect to the Docker daemon socket`

**解决方案**：

```bash
# 将用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证
docker ps
```

### 问题 3：健康检查失败

**错误信息**：`Deployment may have issues - checking service status`

**解决方案**：

```bash
# 1. 检查服务状态
docker compose ps

# 2. 查看服务日志
docker compose logs app --tail=100

# 3. 检查健康接口
curl http://localhost:3000/api/health

# 4. 手动测试迁移
docker compose exec app npm run db:migrate
```

### 问题 4：镜像拉取失败

**错误信息**：`Error response from daemon: pull access denied`

**解决方案**：

确保 docker-compose.yml 中的镜像名称正确：

```yaml
image: ghcr.io/your-github-username/tdp:latest
```

如果是私有仓库，需要在服务器登录 GHCR：

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
```

## 📊 监控部署状态

### 查看部署历史

在 GitHub Actions 页面可以查看：

- 部署时间和持续时间
- 部署日志和错误信息
- 每次部署的 Git commit

### 服务器端监控

```bash
# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f app

# 查看资源使用
docker stats

# 查看最近部署日志
journalctl -u docker -n 100 --no-pager
```

## 🎯 进阶配置

### 1. 多环境部署

修改 `deploy.yml` 支持 staging 和 production 环境：

```yaml
# 为不同环境配置不同的 Secrets
# 例如：STAGING_SSH_HOST, PROD_SSH_HOST

- name: Deploy to environment
  run: |
    if [ "${{ github.event.inputs.environment }}" == "staging" ]; then
      ssh -p ${{ secrets.STAGING_SSH_PORT }} ...
    else
      ssh -p ${{ secrets.PROD_SSH_PORT }} ...
    fi
```

### 2. 部署通知

集成 Slack/Discord/Email 通知：

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. 蓝绿部署

使用 Docker Compose 的服务副本实现零停机：

```yaml
services:
  app-blue:
    image: ghcr.io/your-username/tdp:latest
    # ... 配置

  app-green:
    image: ghcr.io/your-username/tdp:previous
    # ... 配置
```

## ✅ 配置完成检查清单

- [ ] SSH 密钥对已生成并测试连接成功
- [ ] GitHub Secrets 已正确配置（5 个必需值）
- [ ] 服务器项目目录已配置为 Git 仓库
- [ ] docker-compose.yml 已配置使用远程镜像
- [ ] .env 文件已正确配置
- [ ] 部署用户已加入 docker 组
- [ ] 防火墙规则已配置
- [ ] 手动触发部署测试成功
- [ ] 健康检查接口返回正常

完成以上配置后，每次推送到 `main` 分支都会自动部署到服务器！🎉
