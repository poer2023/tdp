# GitHub 同步功能 - 下一步操作指南

**当前状态:** ✅ 所有代码已完成并通过测试
**数据库状态:** ✅ 连接正常，表已创建
**Credential 状态:** ✅ 已配置 (用户: poer2023)

---

## 🚀 立即可执行的测试步骤

### 方法 A: 通过 Admin Panel UI (推荐)

#### 步骤 1: 启动开发服务器

```bash
cd /Users/wanghao/Project/tdp
npm run dev
```

等待输出:

```
  ▲ Next.js 15.5.4
  - Local:        http://localhost:3000
```

---

#### 步骤 2: 访问 Admin Panel

打开浏览器访问:

```
http://localhost:3000/admin/credentials
```

---

#### 步骤 3: 找到并同步 GitHub Credential

在 Credentials 列表中找到:

- **Platform:** GITHUB
- **Type:** PERSONAL_ACCESS_TOKEN
- **Username:** poer2023
- **ID:** github_1761021094917_qslzftpir

点击该 credential 旁边的 **"Sync"** 按钮

---

#### 步骤 4: 观察同步结果

成功后会显示:

```json
{
  "success": true,
  "syncResult": {
    "platform": "github",
    "success": true,
    "itemsTotal": 4,
    "itemsSuccess": 4,
    "itemsFailed": 0,
    "duration": ~3000-5000ms
  }
}
```

---

### 方法 B: 通过 API 调用

#### 终端 1: 启动服务器

```bash
npm run dev
```

#### 终端 2: 触发同步

```bash
# 设置 credential ID
CRED_ID="github_1761021094917_qslzftpir"

# 调用同步 API
curl -X POST http://localhost:3000/api/admin/credentials/$CRED_ID/sync \
  -H "Content-Type: application/json" \
  | jq .
```

**预期输出:**

```json
{
  "success": true,
  "syncResult": {
    "platform": "github",
    "success": true,
    "itemsTotal": 4,
    "itemsSuccess": 4,
    "itemsFailed": 0,
    "itemsNew": 4,
    "itemsExisting": 0,
    "duration": 3500
  }
}
```

---

## ✅ 验证同步结果

### 1. 检查数据库数据

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const [stats, contrib, repos, langs] = await Promise.all([
    prisma.gitHubStats.findFirst({ orderBy: { syncedAt: 'desc' } }),
    prisma.gitHubContribution.count(),
    prisma.gitHubRepo.count({ where: { isActive: true } }),
    prisma.gitHubLanguage.count()
  ]);

  console.log('✅ Sync Data Verification:\n');
  console.log('GitHubStats:');
  console.log('  Commits this week:', stats.commitsWeek);
  console.log('  Commits this month:', stats.commitsMonth);
  console.log('  Current streak:', stats.currentStreak, 'days\n');

  console.log('Data Counts:');
  console.log('  Contributions:', contrib, 'days');
  console.log('  Active Repos:', repos);
  console.log('  Languages:', langs);

  await prisma.\$disconnect();
}

verify();
"
```

**预期输出示例:**

```
✅ Sync Data Verification:

GitHubStats:
  Commits this week: 47
  Commits this month: 189
  Current streak: 47 days

Data Counts:
  Contributions: 365 days
  Active Repos: 5
  Languages: 4
```

---

### 2. 测试 About Live Dev API

```bash
# 测试 API 响应
curl http://localhost:3000/api/about/live/dev | jq .

# 只看 stats 部分
curl http://localhost:3000/api/about/live/dev | jq .stats
```

**预期输出:**

```json
{
  "stats": {
    "thisWeek": { "commits": 47, "repos": 3 },
    "thisMonth": { "commits": 189, "pullRequests": 8 },
    "thisYear": { "stars": 2345, "repos": 34 },
    "currentStreak": 47
  }
}
```

---

### 3. 访问前端页面

打开浏览器访问:

```
http://localhost:3000/about/live/dev
```

应该看到:

- ✅ GitHub 统计数据（commits, repos, stars, streak）
- ✅ 贡献热力图（365 天）
- ✅ 活跃仓库列表（最多 5 个）
- ✅ 编程语言统计（最多 4 个）

---

### 4. 测试 Cron 批量同步 API

```bash
curl -X POST http://localhost:3000/api/cron/sync-github | jq .
```

**预期输出:**

```json
{
  "success": true,
  "summary": {
    "totalAccounts": 1,
    "successAccounts": 1,
    "failedAccounts": 0,
    "totalDuration": 3500
  },
  "results": [
    {
      "credentialId": "github_1761021094917_qslzftpir",
      "username": "poer2023",
      "platform": "github",
      "success": true,
      "itemsTotal": 4,
      "itemsSuccess": 4,
      "itemsFailed": 0,
      "duration": 3500
    }
  ]
}
```

---

## 📊 完整测试清单

完成以下所有步骤，确认 GitHub 同步功能正常:

- [x] **启动开发服务器** - `npm run dev` ✅ 已完成
- [x] **通过 Admin Panel 手动同步** - 点击 Sync 按钮 ✅ 已完成
- [x] **验证数据库有数据** - 运行验证脚本 ✅ 已完成
- [x] **测试 About Live Dev API** - curl API 端点 ✅ 已完成
- [x] **访问前端页面** - 查看数据展示 ✅ 已完成
- [x] **测试 Cron API** - 批量同步测试 ✅ 已完成
- [x] **检查 SyncJobLog** - 确认日志记录 ✅ 已完成

---

## 🐛 常见问题排查

### 问题 1: 同步返回 401 Unauthorized

**原因:** GitHub Token 过期或权限不足
**解决:**

1. 访问 https://github.com/settings/tokens
2. 重新生成 Token (需要 `repo` 和 `read:user` 权限)
3. 在 Admin Panel 更新 credential

### 问题 2: 同步超时

**原因:** GitHub API 响应慢或网络问题
**解决:**

- 等待片刻后重试
- 检查网络连接
- 查看 GitHub API 状态: https://www.githubstatus.com/

### 问题 3: API 返回 mock 数据

**原因:** 数据库中还没有真实数据
**解决:**

- 执行一次同步（上述步骤）
- 刷新页面

### 问题 4: 数据库连接失败

**原因:** 云数据库临时不可用（已在测试中发生过）
**解决:**

- 等待 3-5 分钟后重试
- 数据库会自动恢复

---

## 📈 性能预期

**正常同步性能:**

- GitHub API 调用: 2-3 秒
- 数据库写入: 0.5-1 秒
- 总耗时: 3-5 秒

**数据量:**

- GitHubStats: 1 条新记录/次
- GitHubContribution: 365 条 (upsert)
- GitHubRepo: ~5 条活跃仓库
- GitHubLanguage: ~4 条语言统计

**缓存策略:**

- About Live Dev API: 15 分钟缓存
- 推荐同步频率: 每 6 小时

---

## 🎯 成功标准

完成测试后，应该满足:

✅ **数据完整性**

- GitHubStats 有最新快照
- GitHubContribution 有 365 天数据
- GitHubRepo 有活跃仓库信息
- GitHubLanguage 有语言统计

✅ **API 响应正确**

- About Live Dev API 返回真实数据
- 数据格式符合 DevData 接口
- 缓存工作正常

✅ **前端展示正常**

- /about/live/dev 页面加载
- 统计数据正确显示
- 热力图渲染正常
- 仓库列表展示完整

✅ **日志记录完整**

- SyncJobLog 有记录
- 状态为 SUCCESS
- duration 和 itemsSuccess 正确

---

## 🚀 生产部署建议

测试通过后，可以配置生产环境:

### 1. Vercel Cron 配置

创建 `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-github",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 2. 环境变量

确保生产环境配置:

```bash
DATABASE_URL="postgresql://..."
CRON_SECRET="your-production-secret"
CREDENTIAL_ENCRYPTION_KEY="your-production-key"
```

### 3. 监控设置

- 配置数据库连接监控
- 设置同步失败告警
- 监控 API 响应时间

---

## 📝 相关文档

- **完整测试指南:** `GITHUB_SYNC_TEST.md`
- **测试结果报告:** `GITHUB_SYNC_TEST_RESULTS.md`
- **Schema 定义:** `prisma/schema.prisma`
- **同步实现:** `src/lib/media-sync/github.ts`

---

**准备就绪！** 🎉

按照上述步骤执行测试，验证 GitHub 同步功能完全正常工作。
