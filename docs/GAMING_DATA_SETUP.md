# 游戏数据集成配置指南

本文档介绍如何配置和使用Steam和绝区零(Zenless Zone Zero)的真实游戏数据集成功能。

## 功能概述

- ✅ **Steam**: 完整的游戏库、游戏时长、最近游戏、成就数据
- ✅ **绝区零**: 角色数据、绳网等级、登录天数、式舆防卫战记录
- ✅ **自动同步**: GitHub Actions 每3小时自动同步数据
- ✅ **手动同步**: Admin API 支持立即触发数据同步
- ✅ **数据库存储**: PostgreSQL 持久化,快速查询,历史追踪

## 前置要求

1. PostgreSQL 数据库(已配置)
2. Steam 账号和 API 密钥
3. HoYoLab 账号和绝区零游戏数据
4. 已配置 GitHub Actions(用于自动同步)

## 步骤 1: 获取 Steam API 密钥

### 1.1 申请 Steam Web API Key

1. 访问: https://steamcommunity.com/dev/apikey
2. 使用你的 Steam 账号登录
3. 填写域名(可以填写 `localhost` 或你的实际域名)
4. 点击"Register"获取 API Key
5. 复制生成的 API Key

### 1.2 获取 Steam ID (64位)

1. 访问: https://steamid.io/
2. 输入你的 Steam 个人资料 URL 或用户名
3. 找到"steamID64"字段,复制这个数字(例如: `76561198012345678`)

### 1.3 设置 Steam 个人资料为公开

**重要**: 必须将你的 Steam 个人资料设置为公开,否则 API 无法获取数据。

1. 登录 Steam
2. 点击右上角用户名 → 查看个人资料
3. 编辑个人资料 → 隐私设置
4. 将"我的个人资料"设置为"公开"
5. 将"游戏详情"设置为"公开"

## 步骤 2: 获取绝区零(HoYoLab) 数据

### 2.1 获取 HoYoLab Cookie

1. 访问: https://www.hoyolab.com
2. 使用你的米哈游/HoYo账号登录
3. 按 `F12` 打开开发者工具
4. 切换到"Application"(应用程序)或"Storage"(存储)标签
5. 左侧找到"Cookies" → `https://www.hoyolab.com`
6. 找到以下关键 Cookie:
   - `ltoken`
   - `ltuid`
   - `cookie_token`
   - `account_id`
7. 复制完整的 Cookie 字符串,格式如:
   ```
   ltoken=xxx; ltuid=xxx; cookie_token=xxx; account_id=xxx
   ```

### 2.2 获取绝区零 UID

1. 打开绝区零游戏
2. 进入游戏主菜单
3. 点击左下角的个人头像或设置
4. 找到你的 UID(一串数字,例如: `100123456`)
5. 复制这个 UID

### 2.3 确定服务器区域

根据你的游戏服务器选择:

- `cn_gf01`: 国服(中国大陆)
- `os_asia`: 亚服
- `os_usa`: 美服
- `os_euro`: 欧服

## 步骤 3: 配置环境变量

编辑 `.env` 文件,添加以下配置:

```bash
# Steam 配置
STEAM_API_KEY=你的Steam_API_Key
STEAM_USER_ID=你的Steam_64位ID

# HoYoverse / 绝区零配置
HOYO_COOKIE=ltoken=xxx;ltuid=xxx;cookie_token=xxx;account_id=xxx
HOYO_UID=你的绝区零UID
HOYO_REGION=cn_gf01

# Admin API 密钥(用于手动同步)
# 生成命令: openssl rand -hex 32
ADMIN_API_KEY=生成的随机32位密钥
```

## 步骤 4: 数据库迁移

运行 Prisma 迁移以创建游戏数据表:

```bash
npx prisma migrate dev --name add_gaming_tables
```

如果已经有数据库连接,运行:

```bash
npx prisma db push
```

## 步骤 5: 手动触发首次同步

### 方法 1: 使用 API (推荐)

```bash
curl -X POST http://localhost:3000/api/admin/gaming/sync \
  -H "Authorization: Bearer 你的ADMIN_API_KEY" \
  -H "Content-Type: application/json"
```

### 方法 2: 在代码中测试

创建测试脚本 `scripts/test-gaming-sync.ts`:

```typescript
import { getGamingSyncService } from "@/lib/gaming/sync-service";

async function testSync() {
  const service = getGamingSyncService();
  const results = await service.syncAllPlatforms();
  console.log("Sync results:", JSON.stringify(results, null, 2));
}

testSync().catch(console.error);
```

运行:

```bash
npx ts-node scripts/test-gaming-sync.ts
```

## 步骤 6: 配置 GitHub Actions 自动同步

### 6.1 设置 GitHub Secrets

在你的 GitHub 仓库中:

1. 进入 Settings → Secrets and variables → Actions
2. 添加以下 Secrets:
   - `SITE_URL`: 你的网站 URL (例如: `https://yourdomain.com`)
   - `ADMIN_API_KEY`: 与 `.env` 中相同的 Admin API 密钥

### 6.2 验证 GitHub Actions

1. 进入 GitHub 仓库的 Actions 标签
2. 找到"Sync Gaming Data"工作流
3. 点击"Run workflow"手动触发测试
4. 查看运行日志,确认同步成功

## 验证数据同步

访问: http://localhost:3000/about/live/gaming

你应该能看到:

- ✅ Steam 游戏库中的游戏
- ✅ 最近游戏记录和游戏时长
- ✅ 绝区零角色数据和等级
- ✅ 本月/本年游戏统计
- ✅ 游戏热力图

## 故障排除

### Steam 数据无法获取

**问题**: API 返回错误或空数据

**解决方案**:

1. 确认 Steam API Key 正确
2. 确认 Steam ID (64位) 正确
3. 确认个人资料和游戏详情设置为"公开"
4. 检查 Steam Web API 状态: https://steamstat.us/

### 绝区零数据无法获取

**问题**: HoYoLab API 返回错误

**解决方案**:

1. 重新获取 HoYoLab Cookie(Cookie 可能过期)
2. 确认 UID 正确(在游戏内确认)
3. 确认服务器区域设置正确
4. Cookie 格式确保包含 `ltoken`, `ltuid`, `cookie_token`

### GitHub Actions 同步失败

**问题**: 自动同步任务失败

**解决方案**:

1. 检查 GitHub Secrets 配置是否正确
2. 确认 `SITE_URL` 可以公网访问
3. 查看 Actions 运行日志获取详细错误信息
4. 确认网站已部署且 Admin API 端点可访问

### 数据库连接问题

**问题**: Prisma 无法连接数据库

**解决方案**:

1. 确认 `DATABASE_URL` 配置正确
2. 运行 `npx prisma db push` 创建表
3. 检查 PostgreSQL 服务是否运行
4. 查看应用日志获取详细错误信息

## 数据更新频率

- **自动同步**: 每 3 小时(可在 `.github/workflows/sync-gaming-data.yml` 修改)
- **手动同步**: 随时通过 Admin API 触发
- **数据缓存**: API 响应缓存 30 分钟

## 安全注意事项

1. **API 密钥保护**:
   - 不要将 `.env` 文件提交到 Git
   - 使用 `.env.local` 存储敏感信息
   - 在生产环境使用环境变量管理服务

2. **Cookie 安全**:
   - HoYoLab Cookie 包含账号敏感信息
   - 定期更新 Cookie
   - 不要在公开场合分享 Cookie

3. **Admin API**:
   - 使用强随机密钥
   - 生产环境建议添加 IP 白名单
   - 定期轮换 API 密钥

## 扩展功能

### 添加更多游戏平台

框架已支持扩展,可以添加:

- PlayStation Network (PSN)
- Xbox Live
- Nintendo Switch
- Epic Games Store

只需实现对应的客户端和同步逻辑即可。

### 自定义同步频率

编辑 `.github/workflows/sync-gaming-data.yml`:

```yaml
on:
  schedule:
    - cron: "0 */6 * * *" # 每6小时
    # 或
    - cron: "0 2 * * *" # 每天凌晨2点
```

### 数据分析和可视化

数据存储在数据库中,可以进行:

- 游戏时长趋势分析
- 平台使用率统计
- 成就解锁进度追踪
- 自定义报表生成

## 相关文档

- [Steam Web API 文档](https://developer.valvesoftware.com/wiki/Steam_Web_API)
- [HoYoLab API (非官方)](https://github.com/topics/hoyolab-api)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Prisma ORM 文档](https://www.prisma.io/docs)

## 需要帮助?

如果遇到问题:

1. 查看应用日志: `docker logs` 或控制台输出
2. 检查数据库同步日志表: `GamingSyncLog`
3. 提交 Issue 并附上错误信息和配置(隐藏敏感信息)
