# Media Sync Setup Guide

B 站和豆瓣观看记录同步功能配置指南。

## 📋 功能概述

- ✅ **B 站观看历史同步** - 自动获取 B 站观看记录（视频、番剧等）
- ✅ **豆瓣标记记录同步** - 获取豆瓣"看过"的电影和剧集
- ✅ **定时自动同步** - 每 3 小时自动同步最新数据
- ✅ **管理后台** - 查看同步状态、手动触发同步、查看错误日志
- ✅ **前端展示** - `/about/live/media` 页面展示混合数据

## 🚀 快速开始

### 1. 配置环境变量

复制 `.env.example` 为 `.env.local`：

\`\`\`bash
cp .env.example .env.local
\`\`\`

然后配置以下环境变量：

#### B 站配置（必需）

1. 登录 [B 站网页版](https://www.bilibili.com)
2. 打开浏览器开发者工具（F12）
3. 前往 **Application/存储 → Cookies → https://www.bilibili.com**
4. 复制以下三个值到 `.env.local`：

\`\`\`env
BILIBILI*SESSDATA=你的\_sessdata*值
BILIBILI*BILI_JCT=你的\_bili_jct*值
BILIBILI*BUVID3=你的\_buvid3*值
\`\`\`

> ⚠️ **注意**：这些 Cookie 一般 1-3 个月过期，过期后需要重新获取。

#### 豆瓣配置（必需）

**重要说明**：

- ⚠️ 如果你的豆瓣账号设置了**隐私保护**（推荐设置），必须配置 `DOUBAN_COOKIE` 才能获取完整观影记录
- ❌ **没有 Cookie 的情况**：只能获取最近 10-15 部电影
- ✅ **有 Cookie 的情况**：可以获取全部观影记录（例如：全部 304 部）

**详细教程请查看**: [docs/GET_DOUBAN_COOKIE.md](./GET_DOUBAN_COOKIE.md)

快速步骤：

1. **获取用户 ID**：
   - 访问 [https://www.douban.com/people/me/](https://www.douban.com/people/me/)
   - 地址栏中的数字就是你的用户 ID（如 `257644246`）

2. **获取 Cookie**（必需）：
   - 打开开发者工具 (F12) → Application/存储 → Cookies
   - 找到 `dbcl2` 的值
   - 完整复制（包含引号）

3. 配置到 `.env.local`：

\`\`\`env
DOUBAN_USER_ID=257644246

# 格式: dbcl2="你的cookie值" (保留引号)

DOUBAN_COOKIE=dbcl2="123456789:AbCdEfGh1234567"
\`\`\`

> ⚠️ **注意**：Cookie 格式必须是 `dbcl2="值"`，保留引号！

### 2. 运行数据库迁移

\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

### 3. 启动定时任务

有三种方式启动定时同步：

#### 方式 A：使用 PM2（推荐 - 适合自己部署）

\`\`\`bash

# 安装 PM2（如果还没安装）

npm install -g pm2

# 启动定时任务

pm2 start scripts/sync-media-cron.ts --name media-sync --interpreter tsx

# 查看日志

pm2 logs media-sync

# 查看状态

pm2 status

# 重启

pm2 restart media-sync

# 停止

pm2 stop media-sync
\`\`\`

#### 方式 B：使用系统 Crontab

\`\`\`bash

# 编辑 crontab

crontab -e

# 添加以下行（每 3 小时执行一次）

0 _/3 _ \* \* cd /path/to/tdp && npx tsx scripts/sync-media-cron.ts --once >> /var/log/media-sync.log 2>&1
\`\`\`

#### 方式 C：手动执行（测试用）

\`\`\`bash

# 执行一次同步

npx tsx scripts/sync-media-cron.ts --once
\`\`\`

## 🎛️ 管理后台使用

访问管理后台查看同步状态：

\`\`\`
http://localhost:3000/admin/sync-dashboard
\`\`\`

**功能**：

- 📊 **同步统计** - 查看总同步次数、成功率、媒体项数量
- 🔄 **手动触发** - 点击按钮手动触发 B 站、豆瓣或全部同步
- 📋 **同步历史** - 查看最近 50 次同步记录、状态、耗时
- ⚠️ **错误日志** - 查看失败任务的错误信息和堆栈

> ⚠️ **权限要求**：需要使用管理员账号登录（在 `ADMIN_EMAILS` 中配置的邮箱）

## 📊 前端展示

前端页面会自动从数据库读取并展示：

- **路径**: `/about/live/media`
- **数据来源**: B 站 + 豆瓣 + Jellyfin（如果有）
- **刷新频率**: 每 5 分钟（CDN 缓存）

## 🔧 高级配置

### 修改同步频率

在 `.env.local` 中修改：

\`\`\`env

# Cron 表达式格式: 分 时 日 月 周

SYNC_CRON_SCHEDULE=0 _/3 _ \* \* # 每 3 小时（默认）

# SYNC_CRON_SCHEDULE=0 0 _/6 _ \* # 每 6 小时

# SYNC_CRON_SCHEDULE=0 2 \* \* \* # 每天凌晨 2 点

\`\`\`

### 修改同步数量

编辑 `src/lib/media-sync/index.ts`：

\`\`\`typescript
// Bilibili: 每页 20 条，最多 5 页 = 100 条
const bilibiliResult = await syncBilibili({
sessdata: process.env.BILIBILI_SESSDATA,
biliJct: process.env.BILIBILI_BILI_JCT,
buvid3: process.env.BILIBILI_BUVID3,
maxPages: 5, // 修改这里
});

// Douban: 每页 15 条，最多 5 页 = 75 条
const doubanResult = await syncDouban({
userId: process.env.DOUBAN_USER_ID,
cookie: process.env.DOUBAN_COOKIE,
maxPages: 5, // 修改这里
});
\`\`\`

## 🐛 故障排查

### B 站同步失败

**问题**: `Bilibili API error: 401 Unauthorized`

**解决方案**:

1. Cookie 可能已过期，重新获取 `SESSDATA`、`BILI_JCT`、`BUVID3`
2. 确保 Cookie 值没有多余的空格或引号
3. 检查 B 站账号是否被封禁或限制

### 豆瓣同步失败

**问题 1**: 只获取到 10-15 部电影，但实际有 300+ 部

**原因**: 豆瓣账号设置了隐私保护，未配置 Cookie 导致只能访问最近的公开记录

**解决方案**:

1. ✅ **配置 DOUBAN_COOKIE**（最重要！）
   - 参考 [docs/GET_DOUBAN_COOKIE.md](./GET_DOUBAN_COOKIE.md) 获取 Cookie
   - 格式必须是：`DOUBAN_COOKIE=dbcl2="你的值"`（保留引号）
2. 重启定时任务：`pm2 restart media-sync`
3. 手动触发一次同步测试：`npx tsx scripts/test-douban.ts`

**问题 2**: `Failed to parse item` 或返回空数据

**解决方案**:

1. 检查 `DOUBAN_USER_ID` 是否正确
2. 验证 `DOUBAN_COOKIE` 格式是否正确（必须包含 `dbcl2=` 前缀和引号）
3. Cookie 可能已过期，重新获取
4. 豆瓣可能改版导致 HTML 解析失败（查看错误日志）

### 定时任务不执行

**解决方案**:

1. 检查 PM2 状态：`pm2 status`
2. 查看日志：`pm2 logs media-sync`
3. 确认 Cron 表达式格式正确
4. 检查文件权限和执行权限

### 管理后台 401 错误

**解决方案**:

1. 确保已登录管理员账号
2. 检查 `ADMIN_EMAILS` 环境变量是否包含当前登录邮箱
3. 清除浏览器 Cookie 并重新登录

## 📝 API 文档

### GET /api/about/live/media

获取媒体观看数据（公开 API）

**响应示例**:

\`\`\`json
{
"stats": {
"thisWeek": { "movies": 3, "series": 2 },
"thisMonth": { "movies": 12, "series": 8 },
"thisYear": { "totalHours": 156, "totalItems": 289 }
},
"recentlyWatched": [...],
"currentlyWatching": [...]
}
\`\`\`

### GET /api/admin/sync/status

获取同步状态（需要管理员权限）

\`\`\`bash
curl -X GET http://localhost:3000/api/admin/sync/status \
 -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
\`\`\`

### POST /api/admin/sync/trigger

手动触发同步（需要管理员权限）

\`\`\`bash
curl -X POST http://localhost:3000/api/admin/sync/trigger \
 -H "Content-Type: application/json" \
 -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
 -d '{"platform": "bilibili"}' # 或 "douban" 或 "all"
\`\`\`

## 🔒 安全注意事项

1. **不要提交 Cookie 到 Git**
   - `.env.local` 已在 `.gitignore` 中
   - 永远不要硬编码 Cookie 到代码中

2. **定期更新 Cookie**
   - B 站 Cookie 每 1-3 个月过期
   - 定期检查同步状态确保正常运行

3. **限制管理后台访问**
   - 只有 `ADMIN_EMAILS` 中的邮箱可以访问
   - 考虑添加 IP 白名单或 VPN 访问

4. **数据隐私**
   - 观看记录存储在你自己的数据库中
   - 不会分享给第三方
   - 可以随时删除数据

## 📚 数据库 Schema

\`\`\`sql
-- 媒体观看记录
CREATE TABLE "MediaWatch" (
id TEXT PRIMARY KEY,
platform TEXT NOT NULL, -- 'bilibili' | 'douban' | 'jellyfin'
externalId TEXT NOT NULL,
type TEXT NOT NULL, -- 'movie' | 'series'
title TEXT NOT NULL,
cover TEXT,
url TEXT,
watchedAt TIMESTAMP NOT NULL,
progress INT,
rating INT,
...
);

-- 同步任务记录
CREATE TABLE "SyncJob" (
id TEXT PRIMARY KEY,
platform TEXT NOT NULL,
status TEXT NOT NULL, -- 'SUCCESS' | 'FAILED' | 'RUNNING'
startedAt TIMESTAMP NOT NULL,
completedAt TIMESTAMP,
duration INT,
itemsTotal INT,
itemsSuccess INT,
itemsFailed INT,
errorMessage TEXT,
...
);
\`\`\`

## 🎯 未来扩展

可以轻松添加更多平台：

- Netflix
- Spotify
- Steam
- YouTube

只需在 `src/lib/media-sync/` 目录下添加新的平台文件即可。

## 💡 常见问题

**Q: 数据同步会影响网站性能吗？**

A: 不会。同步是后台异步执行的，不会影响前端访问。前端读取的是数据库缓存数据。

**Q: 可以删除历史同步记录吗？**

A: 可以。直接在数据库中删除 `SyncJob` 表的记录即可，不影响 `MediaWatch` 数据。

**Q: 同步失败了怎么办？**

A: 查看管理后台的错误日志，根据错误信息排查。也可以查看 PM2 日志：`pm2 logs media-sync`。

**Q: 可以同步历史数据吗？**

A: 可以。修改 `maxPages` 参数获取更多历史记录（注意 API 限流）。

---

如有问题，请查看项目 Issues 或联系维护者。
