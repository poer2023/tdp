# Steam Gaming Data Setup Guide

## 当前状态分析

你的 `/about/live/gaming` 页面显示模拟数据（Mock Data）是因为数据库中还没有真实的游戏数据。

## 解决方案

### 方式 1: 通过管理后台界面（推荐）

1. **访问凭据管理页面**

   ```
   http://localhost:3000/admin/credentials
   ```

2. **创建 Steam 凭据**
   - 点击"添加凭据"按钮
   - 填写以下信息：
     - 平台（Platform）: `STEAM`
     - 类型（Type）: `API_KEY`
     - 值（Value）: `C5083BA4529514944D4BABFFDA82C1ED`（来自 `.env` 中的 `STEAM_API_KEY`）
     - 元数据（Metadata - JSON 格式）:
       ```json
       {
         "steamId": "76561198795431974",
         "description": "Steam API credential for gaming data sync"
       }
       ```
   - 点击"保存"

3. **触发数据同步**
   - 在凭据列表中找到刚创建的 Steam 凭据
   - 点击"同步"按钮
   - 等待同步完成（可能需要几秒到几分钟）

4. **验证数据**
   - 访问 `http://localhost:3000/about/live/gaming`
   - 页面应该显示你的真实 Steam 游戏数据

### 方式 2: 使用 curl 命令（需要先登录）

如果你已经登录了管理后台，可以使用以下命令：

#### Step 1: 创建凭据（手动通过界面）

先通过管理界面创建凭据，获取凭据 ID

#### Step 2: 触发同步

```bash
curl -X POST http://localhost:3000/api/admin/credentials/{CREDENTIAL_ID}/sync \
  -H "Content-Type: application/json" \
  -b "你的 session cookie"
```

### 方式 3: 使用 Prisma Studio（开发环境）

1. **打开 Prisma Studio**

   ```bash
   npx prisma studio
   ```

2. **在 ExternalCredential 表中创建记录**
   - id: 自动生成的 UUID
   - platform: `STEAM`
   - type: `API_KEY`
   - value: `C5083BA4529514944D4BABFFDA82C1ED`
   - metadata:
     ```json
     {
       "steamId": "76561198795431974",
       "description": "Steam API credential for gaming data sync"
     }
     ```
   - isValid: `true`
   - isEncrypted: `false`
   - usageCount: `0`
   - failureCount: `0`
   - autoSync: `false`
   - createdAt: 当前时间
   - updatedAt: 当前时间

3. **手动触发同步**（通过管理界面或 API）

## 已配置的环境变量

你的 `.env` 文件中已经配置了必要的 Steam API 凭据：

```env
# Steam API 配置
STEAM_API_KEY=C5083BA4529514944D4BABFFDA82C1ED
STEAM_USER_ID=76561198795431974
```

## 数据同步说明

Steam 数据同步会获取以下信息：

- 🎮 游戏库（拥有的游戏）
- 📊 游戏时长统计
- 🏆 成就数据
- 👤 Steam 个人资料信息

同步后，`/about/live/gaming` 页面将显示：

- 本月和今年的游戏时长统计
- 当前正在玩的游戏
- 最近游戏会话
- 游戏时长热图（heatmap）

## 故障排除

### 如果同步失败：

1. **检查 Steam API Key 是否有效**
   - 访问: https://steamcommunity.com/dev/apikey
   - 确认 API Key 是否正确

2. **检查 Steam ID 是否正确**
   - 访问: https://steamid.io/
   - 确认使用的是 64 位 Steam ID

3. **确认 Steam 个人资料为公开**
   - 访问你的 Steam 个人资料
   - 设置 → 隐私设置 → 游戏详情：公开

4. **检查网络连接**
   - 确保可以访问 Steam API
   - 测试: `curl "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={你的API_KEY}&steamids={你的STEAM_ID}"`

## 下一步

完成 Steam 数据设置后，你还可以：

1. **配置其他平台数据**
   - Bilibili（已有凭据）
   - Douban（已有凭据）
   - 创建相应的平台凭据并触发同步

2. **启用自动同步**
   - 编辑凭据，设置 `autoSync: true`
   - 配置同步频率（如 daily, weekly）

3. **查看同步日志**
   - 访问 `http://localhost:3000/admin/sync`
   - 查看所有平台的同步历史和状态
