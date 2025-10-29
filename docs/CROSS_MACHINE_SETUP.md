# 跨机器开发设置指南

本指南帮助你在多台机器之间无缝切换开发环境,确保配置一致性和开发效率。

## 📋 目录

- [前提条件](#前提条件)
- [机器 A (首次设置)](#机器-a-首次设置)
- [机器 B (同步设置)](#机器-b-同步设置)
- [日常切换流程](#日常切换流程)
- [环境差异排查](#环境差异排查)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 前提条件

### 两台机器都需要安装

#### 1. Node.js 版本管理器

选择以下任一工具:

```bash
# 方式 1: nvm (推荐,macOS/Linux 最流行)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 方式 2: fnm (Rust 编写,速度极快)
brew install fnm

# 方式 3: volta (跨平台,自动管理)
brew install volta
```

#### 2. 必需工具

```bash
# macOS
brew install direnv git

# 验证安装
node -v    # 应显示 v22.x.x
npm -v     # 应显示 v10.x.x
git --version
direnv --version
```

#### 3. 配置 Shell Hook

```bash
# zsh (macOS 默认)
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
source ~/.zshrc

# bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc
```

#### 4. 配置 nvm 自动切换 (可选但推荐)

```bash
# 在 ~/.zshrc 或 ~/.bashrc 中添加
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
echo 'autoload -U add-zsh-hook' >> ~/.zshrc
echo 'load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc' >> ~/.zshrc

source ~/.zshrc
```

---

## 机器 A (首次设置)

### 步骤 1: 克隆项目

```bash
# 克隆仓库
git clone https://github.com/poer2023/tdp.git
cd tdp

# 检出你的开发分支 (如果有)
git checkout feature/your-branch
```

### 步骤 2: 安装 Node.js 正确版本

项目会自动检测 `.nvmrc` 文件:

```bash
# 使用 nvm
nvm install  # 自动安装 .nvmrc 指定的版本
nvm use      # 切换到项目版本

# 使用 fnm
fnm use      # 自动安装并切换

# 使用 volta (自动,无需手动操作)
# 进入项目目录后会自动切换
```

验证版本:
```bash
node -v   # 应显示 v22.x.x
npm -v    # 应显示 v10.x.x
```

### 步骤 3: 运行自动化设置脚本

```bash
# 一键完成所有设置
npm run setup:local
```

脚本会自动执行:
1. ✅ 检查 Node/npm 版本
2. ✅ 创建 `.env.local` 模板 (如果不存在)
3. ✅ 安装项目依赖 (`npm ci`)
4. ✅ 生成 Prisma Client
5. ✅ 测试数据库连接
6. ✅ 同步数据库 Schema
7. ✅ 安装 Playwright 浏览器
8. ✅ 运行健康检查

### 步骤 4: 配置环境变量

脚本会提示你编辑 `.env.local`,填写以下必需变量:

```bash
# 云端数据库 (两台机器共用)
DATABASE_URL=postgresql://user:password@cloud-host:5432/database?schema=public

# NextAuth 密钥 (自动生成,需要在两台机器保持一致)
NEXTAUTH_SECRET=<已自动生成>

# Google OAuth (从 Google Cloud Console 获取)
GOOGLE_CLIENT_ID=<your-id>
GOOGLE_CLIENT_SECRET=<your-secret>

# 管理员邮箱
ADMIN_EMAILS=your-email@gmail.com
```

**重要:** 保存好 `.env.local` 文件,稍后需要同步到机器 B。

### 步骤 5: 初始化数据库 (可选)

```bash
# 创建管理员用户和示例数据
npm run db:seed
```

### 步骤 6: 验证环境

```bash
# 运行健康检查
npm run health-check

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 ,确认应用正常运行。

### 步骤 7: 备份环境变量

**方式 1: 复制到安全位置**
```bash
# 复制到 iCloud/Dropbox (便于同步)
cp .env.local ~/Dropbox/tdp-env/.env.local

# 或加密后保存
tar czf - .env.local | openssl enc -aes-256-cbc -out env.tar.gz.enc
```

**方式 2: 使用密钥管理器 (推荐)**
```bash
# 1Password CLI
op document create .env.local --title "TDP Env Local" --vault "Development"

# Bitwarden CLI
bw create item '{"name":"TDP Env", "type":2, "notes":"'$(cat .env.local)'"}' --session <session>
```

---

## 机器 B (同步设置)

### 步骤 1: 克隆项目

```bash
git clone https://github.com/poer2023/tdp.git
cd tdp

# 同步相同的分支
git checkout feature/your-branch
```

### 步骤 2: 同步环境变量

选择以下任一方式:

**方式 1: 从机器 A 直接复制**
```bash
# 在机器 A 执行
scp .env.local user@machine-b:/path/to/tdp/.env.local

# 或使用 rsync
rsync -av .env.local user@machine-b:/path/to/tdp/
```

**方式 2: 从云存储同步**
```bash
# 从 iCloud/Dropbox 复制
cp ~/Dropbox/tdp-env/.env.local .env.local

# 或解密备份
openssl enc -aes-256-cbc -d -in env.tar.gz.enc | tar xz
```

**方式 3: 从密钥管理器获取**
```bash
# 1Password
op document get "TDP Env Local" --vault "Development" > .env.local

# Bitwarden
bw get notes <item-id> > .env.local
```

### 步骤 3: 运行自动化设置

```bash
npm run setup:local
```

### 步骤 4: 验证环境

```bash
# 运行健康检查
npm run health-check

# 确认配置一致性
diff <(cat .env.local | sort) <(ssh machine-a "cat /path/to/tdp/.env.local | sort")
```

### 步骤 5: 启动开发

```bash
npm run dev
```

---

## 日常切换流程

### 从机器 A 切换到机器 B

#### 在机器 A (离开前)

```bash
# 1. 提交所有更改
git add .
git commit -m "WIP: 切换到机器 B"
git push

# 2. 记录当前工作状态 (可选)
git status > /tmp/work-status.txt

# 3. 确保数据库迁移已推送 (如果有新迁移)
npm run db:migrate
```

#### 在机器 B (到达后)

```bash
# 1. 进入项目目录 (direnv 自动加载环境变量)
cd /path/to/tdp

# 2. 拉取最新代码
git pull

# 3. 检查是否有更新
if [ package-lock.json -nt node_modules ]; then
  echo "依赖有更新,重新安装..."
  npm ci
fi

# 4. 应用数据库迁移 (如果有新迁移)
npm run db:migrate

# 5. 快速健康检查
npm run health-check

# 6. 开始工作
npm run dev
```

### 快速切换脚本 (推荐)

创建 `scripts/sync-machine.sh`:

```bash
#!/bin/bash
# 快速同步脚本

echo "🔄 同步项目环境..."

# 拉取最新代码
git pull || { echo "❌ Git pull 失败"; exit 1; }

# 检查并更新依赖
if [ package-lock.json -nt node_modules ]; then
  echo "📦 更新依赖..."
  npm ci
fi

# 应用数据库迁移
echo "🗄️  同步数据库..."
npm run db:migrate

# 健康检查
echo "🏥 运行健康检查..."
npm run health-check

echo "✅ 同步完成!可以开始工作了"
```

使用方法:
```bash
chmod +x scripts/sync-machine.sh
./scripts/sync-machine.sh
```

---

## 环境差异排查

### 检查清单

#### 1. Node/npm 版本一致性

```bash
# 检查两台机器的版本
node -v && npm -v

# 预期输出:
# v22.x.x
# v10.x.x
```

如果版本不一致:
```bash
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
```

#### 2. 环境变量一致性

```bash
# 比较关键环境变量
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}..."

# 或使用健康检查
npm run health-check
```

#### 3. 数据库 Schema 一致性

```bash
# 检查迁移状态
npx prisma migrate status

# 如果不同步:
npm run db:migrate
```

#### 4. 依赖版本一致性

```bash
# 检查 package-lock.json 是否一致
git diff package-lock.json

# 如果有差异,重新安装
npm ci
```

### 自动化差异检测脚本

创建 `scripts/check-env-diff.sh`:

```bash
#!/bin/bash
# 检查两台机器的环境差异

MACHINE_A_HOST="machine-a"  # 修改为实际主机名

echo "检查环境差异..."

# 比较 Node 版本
NODE_VERSION=$(node -v)
REMOTE_NODE_VERSION=$(ssh $MACHINE_A_HOST "cd /path/to/tdp && node -v")

if [ "$NODE_VERSION" != "$REMOTE_NODE_VERSION" ]; then
  echo "❌ Node 版本不一致: 本地=$NODE_VERSION, 远程=$REMOTE_NODE_VERSION"
else
  echo "✅ Node 版本一致: $NODE_VERSION"
fi

# 比较 package-lock.json 哈希
LOCAL_HASH=$(md5sum package-lock.json | cut -d' ' -f1)
REMOTE_HASH=$(ssh $MACHINE_A_HOST "cd /path/to/tdp && md5sum package-lock.json | cut -d' ' -f1")

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
  echo "❌ package-lock.json 不一致"
else
  echo "✅ package-lock.json 一致"
fi

# 比较环境变量哈希 (不泄露内容)
LOCAL_ENV_HASH=$(cat .env.local | md5sum | cut -d' ' -f1)
REMOTE_ENV_HASH=$(ssh $MACHINE_A_HOST "cd /path/to/tdp && cat .env.local | md5sum | cut -d' ' -f1")

if [ "$LOCAL_ENV_HASH" != "$REMOTE_ENV_HASH" ]; then
  echo "⚠️  .env.local 可能不一致 (哈希不同)"
else
  echo "✅ .env.local 一致"
fi
```

---

## 最佳实践

### ✅ 推荐做法

1. **使用自动化脚本**
   - 总是运行 `npm run setup:local` 而不是手动安装
   - 切换机器后运行 `./scripts/sync-machine.sh`

2. **版本管理**
   - 提交前确保 `package-lock.json` 已更新
   - 不要手动修改 `.nvmrc`

3. **环境变量管理**
   - 使用 direnv 自动加载环境变量
   - 定期验证两台机器的 `.env.local` 一致性
   - 生产密钥和开发密钥分开管理

4. **数据库同步**
   - 每次切换机器后先运行 `npm run db:migrate`
   - 使用云端数据库避免本地数据库状态不一致

5. **Git 工作流**
   - 提交前运行 `npm run lint` 和 `npm run type-check`
   - 使用有意义的分支名 (`feature/`, `fix/`, `refactor/`)

### ❌ 避免做法

- ❌ 不要在两台机器使用不同的 Node 版本
- ❌ 不要手动修改 `node_modules/`
- ❌ 不要在不同机器使用不同的 `NEXTAUTH_SECRET`
- ❌ 不要跳过健康检查直接开始开发
- ❌ 不要使用本地数据库 (会导致状态不一致)

---

## 常见问题

### Q1: 切换机器后启动失败

**错误:** `Error: Cannot find module ...`

**原因:** 依赖没有同步

**解决:**
```bash
npm ci
npm run db:generate
```

---

### Q2: 数据库 Schema 不一致

**错误:** `Prisma schema is out of sync`

**解决:**
```bash
# 应用所有迁移
npm run db:migrate

# 重新生成 Prisma Client
npm run db:generate
```

---

### Q3: 环境变量未加载

**现象:** 数据库连接失败或 NextAuth 错误

**检查:**
```bash
# 检查 direnv 是否生效
direnv status

# 如果未允许
direnv allow
```

---

### Q4: 两台机器的代码不一致

**检查:**
```bash
# 查看本地更改
git status
git diff

# 拉取最新代码
git pull

# 如果有冲突
git stash
git pull
git stash pop
```

---

### Q5: Playwright 测试失败

**错误:** `Browser executable not found`

**解决:**
```bash
npx playwright install --with-deps chromium
```

---

### Q6: 如何在三台及以上机器间同步?

**建议方案:**

1. **选择主机器** (例如 机器 A)
2. **其他机器都从主机器同步 `.env.local`**
3. **使用云存储或密钥管理器**:
   ```bash
   # 所有机器从同一来源获取
   cp ~/Dropbox/tdp-env/.env.local .env.local
   ```

---

## 检查清单

### 首次设置机器 B ✓

- [ ] 已安装 Node.js 版本管理器 (nvm/fnm/volta)
- [ ] 已安装 direnv 并配置 shell hook
- [ ] 已克隆项目并切换到正确分支
- [ ] 已从机器 A 同步 `.env.local`
- [ ] 已运行 `npm run setup:local`
- [ ] 已运行 `npm run health-check` 且通过
- [ ] 已验证 `npm run dev` 正常启动

### 日常切换机器 ✓

- [ ] 在离开机器前已提交所有更改
- [ ] 在新机器上已运行 `git pull`
- [ ] 已检查并更新依赖 (如需要)
- [ ] 已应用数据库迁移 (如需要)
- [ ] 已运行 `npm run health-check`
- [ ] 已验证开发服务器正常启动

---

## 进阶优化

### 自动同步脚本

将以下内容添加到 `.git/hooks/post-checkout` (自动执行):

```bash
#!/bin/bash
# Git checkout 后自动同步环境

echo "🔄 检测到分支切换,自动同步环境..."

# 检查依赖更新
if [ package-lock.json -nt node_modules ]; then
  echo "📦 更新依赖..."
  npm ci
fi

# 应用迁移
echo "🗄️  同步数据库..."
npm run db:migrate || true

echo "✅ 环境同步完成"
```

```bash
chmod +x .git/hooks/post-checkout
```

---

**需要帮助?**

- 查看 [环境变量设置指南](./ENVIRONMENT_SETUP.md)
- 运行 `npm run health-check` 诊断问题
- 查看项目 README.md
- 联系项目维护者
