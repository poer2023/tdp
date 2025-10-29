# 环境变量设置指南

本文档详细说明如何配置 TDP 项目的环境变量,确保开发环境正确运行。

## 📋 目录

- [快速开始](#快速开始)
- [必需环境变量](#必需环境变量)
- [可选环境变量](#可选环境变量)
- [密钥生成方法](#密钥生成方法)
- [第三方平台凭据获取](#第三方平台凭据获取)
- [跨机器同步](#跨机器同步)
- [常见问题](#常见问题)

## 快速开始

### 1. 创建环境变量文件

```bash
# 复制模板文件
cp .env.local.example .env.local

# 编辑配置
vim .env.local  # 或使用 VS Code: code .env.local
```

### 2. 填写必需变量

以下变量**必须**配置,否则应用无法正常运行:

```bash
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
NEXTAUTH_SECRET=<生成的32字符密钥>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<你的Google OAuth ID>
GOOGLE_CLIENT_SECRET=<你的Google OAuth密钥>
ADMIN_EMAILS=your-email@gmail.com
```

### 3. 验证配置

```bash
# 运行健康检查
npm run health-check
```

## 必需环境变量

### 数据库配置

#### `DATABASE_URL`

PostgreSQL 数据库连接字符串。

**格式:**

```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?schema=public
```

**示例:**

```bash
# 本地开发
DATABASE_URL=postgresql://tdp:tdp_password@localhost:5432/tdp_dev?schema=public

# 云端数据库 (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.abc123.supabase.co:5432/postgres?schema=public

# 云端数据库 (Neon)
DATABASE_URL=postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**注意事项:**

- ✅ 确保数据库支持 PostgreSQL 扩展 `pg_trgm` (全文搜索需要)
- ✅ 生产环境必须使用 SSL 连接 (`?sslmode=require`)
- ⚠️ 不要在代码中硬编码数据库密码

---

### 认证配置

#### `NEXTAUTH_SECRET`

用于加密会话令牌的密钥,**长度必须 ≥ 32 字符**。

**生成方法:**

```bash
# 方法1: 使用 openssl (推荐)
openssl rand -base64 32

# 方法2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法3: 在线生成
# https://generate-secret.vercel.app/32
```

**示例:**

```bash
NEXTAUTH_SECRET=abc123XYZ456ThisIsMyVeryLongSecretKey789==
```

#### `NEXTAUTH_URL`

应用的完整 URL,用于 OAuth 回调。

**配置:**

```bash
# 本地开发
NEXTAUTH_URL=http://localhost:3000

# 生产环境
NEXTAUTH_URL=https://yourdomain.com
```

---

### Google OAuth 认证

#### `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`

Google OAuth 2.0 客户端凭据,用于社交登录。

**获取步骤:**

1. **访问 Google Cloud Console**
   - 打开 https://console.cloud.google.com/apis/credentials
   - 创建或选择项目

2. **创建 OAuth 2.0 客户端 ID**
   - 点击 "创建凭据" → "OAuth 客户端 ID"
   - 应用类型: "Web应用"
   - 名称: `TDP - Local Development`

3. **配置授权重定向 URI**

   ```
   本地开发:
   http://localhost:3000/api/auth/callback/google

   生产环境:
   https://yourdomain.com/api/auth/callback/google
   ```

4. **复制凭据**
   - 客户端 ID → `GOOGLE_CLIENT_ID`
   - 客户端密钥 → `GOOGLE_CLIENT_SECRET`

**配置示例:**

```bash
GOOGLE_CLIENT_ID=123456789012-abc123xyz456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ABCdef123456XYZ789
```

---

### 管理员配置

#### `ADMIN_EMAILS`

管理员邮箱白名单,这些邮箱登录后自动获得管理员权限。

**格式:** 逗号分隔的邮箱列表

**示例:**

```bash
# 单个管理员
ADMIN_EMAILS=admin@example.com

# 多个管理员
ADMIN_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com
```

## 可选环境变量

### Bilibili 平台同步

用于同步 B 站观看历史和追番数据。

```bash
BILIBILI_SESSDATA=your_sessdata_here
BILIBILI_BILI_JCT=your_bili_jct_here
BILIBILI_BUVID3=your_buvid3_here
```

**获取方法:**

1. 登录 https://www.bilibili.com
2. 打开开发者工具 (F12)
3. Application/存储 → Cookies → https://bilibili.com
4. 复制 `SESSDATA`, `bili_jct`, `buvid3` 的值

---

### 豆瓣平台同步

用于同步豆瓣观影记录。

```bash
DOUBAN_USER_ID=123456789
DOUBAN_COOKIE=dbcl2="your_dbcl2_value_here"
```

**获取方法:**

1. **用户 ID**: 访问你的豆瓣主页,地址栏中的数字即为用户 ID
   - 例如: `https://www.douban.com/people/123456789/` → ID 是 `123456789`

2. **Cookie**:
   - 登录豆瓣后,打开开发者工具 (F12)
   - Application → Cookies → https://douban.com
   - 复制 `dbcl2` 的值 (保留引号)

---

### Steam 平台同步

用于同步 Steam 游戏库和游戏时长。

```bash
STEAM_API_KEY=ABCDEF1234567890ABCDEF1234567890
STEAM_USER_ID=76561198012345678
```

**获取方法:**

1. **API Key**: https://steamcommunity.com/dev/apikey
   - 填写域名 (可以随意填,如 `localhost`)

2. **Steam ID (64位)**: https://steamid.io/
   - 输入你的 Steam 个人资料链接
   - 复制 steamID64

---

### HoYoverse (绝区零) 平台同步

用于同步绝区零游戏数据。

```bash
HOYO_COOKIE=ltoken=xxx; ltuid=xxx; cookie_token=xxx
HOYO_UID=10001234567
HOYO_REGION=cn_gf01
```

**获取方法:**

1. **Cookie**:
   - 登录 https://www.hoyolab.com
   - 打开开发者工具 (F12) → Application → Cookies
   - 复制包含 `ltoken`, `ltuid`, `cookie_token` 的完整 Cookie 字符串

2. **UID**: 游戏内查看角色 UID

3. **Region**:
   - `cn_gf01`: 国服
   - `os_asia`: 亚服
   - `os_usa`: 美服
   - `os_euro`: 欧服

---

### Uptime Kuma 监控

用于集成基础设施监控数据。

```bash
UPTIME_KUMA_URL=http://localhost:3001
UPTIME_KUMA_API_KEY=your_api_key_here
NEXT_PUBLIC_UPTIME_KUMA_URL=https://status.example.com
```

**配置步骤:**

1. 部署 Uptime Kuma 服务
2. 在 Settings → API Keys 中创建 API 密钥
3. 配置监控项并启用 API

---

### 管理端 API 密钥

用于手动触发同步任务。

```bash
ADMIN_API_KEY=your_random_admin_api_key_here
```

**生成方法:**

```bash
openssl rand -hex 32
```

---

### 凭证加密密钥

用于加密存储在数据库中的第三方平台凭据。

```bash
ENCRYPTION_KEY=your_32_byte_base64_encoded_key
```

**生成方法:**

```bash
npm run generate-key
```

该命令会自动生成并输出加密密钥。

---

### 功能开关 (Feature Flags)

控制新功能的启用/禁用,避免部署整个代码库。

**配置:** `on`/`true`/`1` (启用) 或 `off`/`false`/`0` (禁用)

```bash
FEATURE_ADMIN_CREDENTIALS=on      # 凭据管理
FEATURE_ADMIN_ANALYTICS=on        # 访问分析
FEATURE_ADMIN_GALLERY=on          # 相册管理
FEATURE_ADMIN_POSTS=on            # 文章管理
FEATURE_ADMIN_SYNC=on             # 同步任务
FEATURE_ADMIN_EXPORT=on           # 内容导出
FEATURE_ADMIN_DASHBOARD=on        # 仪表盘统计
FEATURE_GALLERY_INSIGHTS=on       # 图库洞察
```

**建议:** 本地开发环境建议全部启用以便测试完整功能。

## 密钥生成方法

### 通用密钥生成

```bash
# 方法1: OpenSSL (推荐)
openssl rand -base64 32   # Base64 编码,适合大多数场景
openssl rand -hex 32      # 十六进制,适合 API 密钥

# 方法2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法3: 项目内置命令
npm run generate-key     # 生成凭证加密密钥 (ENCRYPTION_KEY)
```

### 密钥长度要求

| 变量名            | 最小长度 | 推荐长度 | 格式   |
| ----------------- | -------- | -------- | ------ |
| `NEXTAUTH_SECRET` | 32 字符  | 44 字符  | Base64 |
| `ADMIN_API_KEY`   | 32 字符  | 64 字符  | Hex    |
| `ENCRYPTION_KEY`  | 32 字节  | 32 字节  | Base64 |

## 跨机器同步

### 方式 1: 手动复制 (推荐用于少量机器)

```bash
# 在机器 A
scp .env.local user@machine-b:/path/to/project/

# 或使用 rsync
rsync -av .env.local user@machine-b:/path/to/project/
```

### 方式 2: iCloud/Dropbox 同步

```bash
# 将 .env.local 放在同步文件夹,然后创建软链接
ln -s ~/Dropbox/tdp/.env.local .env.local
```

### 方式 3: 密钥管理工具 (推荐用于团队)

#### 使用 1Password CLI

```bash
# 安装 1Password CLI
brew install 1password-cli

# 存储密钥
op item create --category=Password \
  --title="TDP Environment Variables" \
  --vault="Development" \
  NEXTAUTH_SECRET="<your-secret>"

# 在 .envrc 中引用
export NEXTAUTH_SECRET=$(op read "op://Development/TDP Environment Variables/NEXTAUTH_SECRET")
```

#### 使用 direnv (推荐)

```bash
# 1. 安装 direnv
brew install direnv

# 2. 配置 shell hook
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
source ~/.zshrc

# 3. 进入项目目录
cd /path/to/tdp

# 4. 允许 direnv
direnv allow

# 5. 之后每次进入项目目录,自动加载 .env.local
```

## 常见问题

### Q1: 数据库连接失败

**错误信息:**

```
Error: P1001: Can't reach database server at `host:port`
```

**解决方案:**

1. 检查 `DATABASE_URL` 格式是否正确
2. 确认数据库服务器正在运行
3. 检查网络连接和防火墙设置
4. 验证数据库用户名和密码

```bash
# 测试数据库连接
npx prisma db execute --stdin <<< "SELECT 1;"
```

---

### Q2: NEXTAUTH_SECRET 长度不足

**错误信息:**

```
Error: NEXTAUTH_SECRET must be at least 32 characters
```

**解决方案:**

```bash
# 重新生成密钥
openssl rand -base64 32

# 更新 .env.local
NEXTAUTH_SECRET=<新生成的密钥>
```

---

### Q3: Google OAuth 回调错误

**错误信息:**

```
Error: redirect_uri_mismatch
```

**解决方案:**

1. 检查 `NEXTAUTH_URL` 是否正确
2. 在 Google Cloud Console 中添加回调 URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
3. 等待 5-10 分钟让 Google 配置生效

---

### Q4: 环境变量未生效

**现象:** 修改 `.env.local` 后没有效果

**解决方案:**

```bash
# 方法1: 重启开发服务器
# Ctrl+C 停止,然后重新运行:
npm run dev

# 方法2: 使用 direnv 自动重载
direnv allow

# 方法3: 手动加载环境变量
source .env.local  # (仅限简单测试)
```

---

### Q5: 如何查看当前环境变量

```bash
# 方法1: 使用健康检查脚本
npm run health-check

# 方法2: 在 Node.js 中查看
node -e "console.log(process.env.DATABASE_URL)"

# 方法3: 使用 dotenv-cli (可选)
npx dotenv-cli -p .env.local -- env | grep -E "DATABASE|NEXTAUTH"
```

---

### Q6: 密钥在两台机器不一致怎么办?

**问题:** 机器 A 和机器 B 使用了不同的 `NEXTAUTH_SECRET`,导致会话失效

**解决方案:**

1. **选择一个主密钥源** (通常是机器 A)
2. **同步到所有机器**:
   ```bash
   # 从机器 A 复制
   scp .env.local user@machine-b:/path/to/tdp/
   ```
3. **验证同步成功**:
   ```bash
   # 在机器 B 运行
   npm run health-check
   ```

---

## 最佳实践

### ✅ 推荐做法

- 使用 `.env.local` 存放敏感配置,永远不要提交到 Git
- 定期轮换密钥 (至少每 3 个月)
- 为不同环境使用不同的密钥 (开发/测试/生产)
- 使用密钥管理工具存储生产环境密钥
- 定期运行 `npm run health-check` 验证配置

### ❌ 避免做法

- ❌ 不要在代码中硬编码密钥
- ❌ 不要将 `.env.local` 提交到版本控制
- ❌ 不要在公共聊天工具中分享密钥
- ❌ 不要使用弱密钥 (如 `secret123`)
- ❌ 不要在多个项目间共享同一密钥

---

## 参考资源

- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [NextAuth.js 配置指南](https://next-auth.js.org/configuration/options)
- [Prisma 数据库连接](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Google OAuth 设置](https://developers.google.com/identity/protocols/oauth2)
- [direnv 官方文档](https://direnv.net/)

---

**需要帮助?**

如果遇到问题,请检查:

1. [常见问题](#常见问题)章节
2. 运行 `npm run health-check` 诊断配置
3. 查看项目 README.md
4. 联系项目维护者
