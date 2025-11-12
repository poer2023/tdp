# GitHub 同步功能测试指南

## 📋 前置条件

1. ✅ 数据库连接正常
2. ✅ GitHub Personal Access Token (需要以下权限):
   - `repo` (访问仓库)
   - `read:user` (读取用户信息)
   - `read:org` (可选，如果需要组织数据)

---

## 🧪 测试步骤

### 1. 检查数据库状态

```bash
# 运行验证脚本
node verify-github-tables.mjs
```

**预期输出:**

```
✓ GitHubStats table exists - 0 records
✓ GitHubContribution table exists - 0 records
✓ GitHubRepo table exists - 0 records
✓ GitHubLanguage table exists - 0 records
```

---

### 2. 添加 GitHub Credential

**方式A: 通过 Admin Panel (推荐)**

1. 启动开发服务器: `npm run dev`
2. 访问: `http://localhost:3000/admin/credentials`
3. 点击 "Add Credential"
4. 填写表单:
   - **Platform**: GitHub
   - **Type**: PERSONAL_ACCESS_TOKEN
   - **Value**: 你的 GitHub Token (ghp_xxxx...)
   - **Metadata**: `{"username": "your-github-username"}`
5. 点击保存

**方式B: 通过数据库 (开发测试)**

```javascript
// create-github-credential.mjs
import { PrismaClient } from "@prisma/client";
import { encryptCredential } from "./src/lib/encryption.js";

const prisma = new PrismaClient();

async function main() {
  const token = "ghp_your_token_here"; // 替换为你的 token
  const username = "your-github-username"; // 替换为你的用户名

  const credential = await prisma.externalCredential.create({
    data: {
      id: `github_${Date.now()}`,
      platform: "GITHUB",
      type: "PERSONAL_ACCESS_TOKEN",
      value: encryptCredential(token), // 加密存储
      metadata: { username },
      isValid: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✓ GitHub credential created:", credential.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### 3. 测试手动同步

**方式A: 通过 Admin Panel UI**

1. 访问: `http://localhost:3000/admin/credentials`
2. 找到刚创建的 GitHub credential
3. 点击 "Sync" 按钮
4. 观察同步进度和结果

**方式B: 通过 API 调用**

```bash
# 获取 credential ID
CREDENTIAL_ID="github_1234567890"

# 触发同步
curl -X POST http://localhost:3000/api/admin/credentials/$CREDENTIAL_ID/sync \
  -H "Content-Type: application/json" \
  | jq .
```

**预期响应:**

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

### 4. 验证数据库数据

```javascript
// check-sync-data.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📊 Checking GitHub sync data...\n");

  // Check stats
  const stats = await prisma.gitHubStats.findFirst({
    orderBy: { syncedAt: "desc" },
  });
  console.log("Latest Stats:", {
    commitsWeek: stats?.commitsWeek,
    reposWeek: stats?.reposWeek,
    commitsMonth: stats?.commitsMonth,
    prsMonth: stats?.prsMonth,
    starsYear: stats?.starsYear,
    currentStreak: stats?.currentStreak,
  });

  // Check contributions
  const contribCount = await prisma.gitHubContribution.count();
  console.log(`\nContributions: ${contribCount} days of data`);

  // Check repos
  const repos = await prisma.gitHubRepo.findMany({
    where: { isActive: true },
    take: 5,
    orderBy: { syncedAt: "desc" },
  });
  console.log(`\nActive Repos: ${repos.length}`);
  repos.forEach((r) => {
    console.log(`  - ${r.fullName} (${r.language || "Unknown"}) - ${r.commitsThisMonth} commits`);
  });

  // Check languages
  const languages = await prisma.gitHubLanguage.findMany({
    orderBy: { syncedAt: "desc" },
    take: 4,
  });
  console.log(`\nLanguages:`);
  languages.forEach((l) => {
    console.log(`  - ${l.name}: ${l.percentage}% (${l.hours}h)`);
  });

  // Check sync job
  const job = await prisma.syncJobLog.findFirst({
    where: { platform: "GITHUB" },
    orderBy: { createdAt: "desc" },
  });
  console.log("\nLatest Sync Job:", {
    status: job?.status,
    duration: job?.duration + "ms",
    itemsSuccess: job?.itemsSuccess,
    itemsFailed: job?.itemsFailed,
    message: job?.message,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**运行:**

```bash
node check-sync-data.mjs
```

---

### 5. 测试 About Live Dev API

```bash
# 测试 API 响应
curl http://localhost:3000/api/about/live/dev | jq .
```

**预期响应:**

```json
{
  "stats": {
    "thisWeek": { "commits": 47, "repos": 3 },
    "thisMonth": { "commits": 189, "pullRequests": 8 },
    "thisYear": { "stars": 2345, "repos": 34 },
    "currentStreak": 47
  },
  "contributionHeatmap": [
    { "date": "2025-10-21T00:00:00.000Z", "value": 5 },
    ...
  ],
  "activeRepos": [
    {
      "name": "tdp",
      "fullName": "username/tdp",
      "language": "TypeScript",
      "commitsThisMonth": 47,
      "lastCommit": {
        "date": "2025-10-21T10:30:00.000Z",
        "message": "feat: add github sync"
      }
    }
  ],
  "languages": [
    { "name": "TypeScript", "percentage": 67, "hours": 23.4 },
    { "name": "Python", "percentage": 21, "hours": 7.3 }
  ]
}
```

**访问前端页面:**

```
http://localhost:3000/about/live/dev
```

---

### 6. 测试定时同步 API

```bash
# 无需 auth header (开发环境)
curl -X POST http://localhost:3000/api/cron/sync-github | jq .

# 或使用 auth header
curl -X POST http://localhost:3000/api/cron/sync-github \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  | jq .
```

**预期响应:**

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
      "credentialId": "github_1234567890",
      "username": "your-username",
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

## 🔍 验证清单

- [ ] 数据库 4 个表创建成功
- [ ] GitHub credential 添加成功
- [ ] 手动同步触发成功
- [ ] GitHubStats 表有数据
- [ ] GitHubContribution 表有 365 天数据
- [ ] GitHubRepo 表有活跃仓库数据
- [ ] GitHubLanguage 表有语言统计
- [ ] SyncJobLog 记录同步任务
- [ ] About Live Dev API 返回真实数据
- [ ] About Live Dev 页面展示正常
- [ ] Cron API 可以批量同步

---

## 🐛 故障排查

### 问题1: 同步失败 - Token 无效

**症状:**

```json
{
  "success": false,
  "error": "Bad credentials",
  "itemsTotal": 0
}
```

**解决方案:**

1. 检查 GitHub Token 权限
2. 确认 Token 未过期
3. 重新生成 Token 并更新 credential

---

### 问题2: 数据库连接失败

**症状:**

```
Can't reach database server at 38.246.246.229:5432
```

**解决方案:**

1. 检查数据库服务状态
2. 验证 DATABASE_URL 配置
3. 确认网络连接

---

### 问题3: API 返回 mock 数据

**症状:**
About Live Dev API 总是返回固定的 mock 数据

**原因:**

- 没有 GitHub credential
- 同步尚未运行
- 数据库中无数据

**解决方案:**

1. 添加 GitHub credential
2. 运行一次同步
3. 验证数据库有数据

---

## 📊 性能基准

**预期同步时间:**

- GitHub API 调用: ~2-3 秒
- 数据库写入: ~0.5-1 秒
- 总计: ~3-5 秒

**数据量:**

- Stats: 1 条记录/次同步
- Contributions: 365 条记录 (upsert)
- Repos: ~5 条活跃仓库
- Languages: ~4 条记录/次同步

**缓存策略:**

- About Live Dev API: 15 分钟缓存
- 推荐同步频率: 每 6 小时

---

## 🚀 生产部署

### Vercel Cron 配置

**vercel.json:**

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

### 环境变量

```bash
# .env.production
DATABASE_URL="postgresql://..."
CRON_SECRET="your-random-secret-here"
ENCRYPTION_KEY="your-32-character-key-here"
```

---

## 📝 注意事项

1. **GitHub API 限制**:
   - 未认证: 60 次/小时
   - 认证: 5000 次/小时
   - 推荐间隔: 至少 6 小时

2. **数据存储**:
   - Stats 和 Languages 每次同步创建新快照
   - Contributions 和 Repos 增量更新
   - 定期清理旧快照数据（可选）

3. **安全性**:
   - Token 使用加密存储
   - Cron API 使用 secret 认证
   - 避免在日志中暴露 Token

---

测试完成后，GitHub 同步功能应该完全正常工作！🎉
