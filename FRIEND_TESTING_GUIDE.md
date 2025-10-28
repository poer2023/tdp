# Friend 功能测试指南

## 📋 功能概述

Friend 功能允许您为特定好友创建专属的 Moment（动态）内容。好友通过专属链接和密码登录后，可以查看为他们定制的私密内容。

## 🎯 功能完整度评估

### ✅ 已实现功能（80%）
- 完整的 Friend CRUD 操作
- 安全的认证系统（JWT + bcrypt）
- 速率限制保护（10次失败尝试后锁定）
- 管理员界面（创建/编辑/删除/重置密码）
- 好友认证界面
- 好友专属故事墙
- 可见性控制（PUBLIC / FRIEND_ONLY / PRIVATE）
- 双语支持（中文/英文）

### ⚠️ 待完善功能（20%）
- Moment 创建界面的好友关联选项（当前需要通过 SQL 手动关联）
- 客户端分页 API
- 实时 slug 验证
- 管理员分析面板

---

## 🚀 快速测试步骤

### 步骤 1：创建测试 Friends（5 分钟）

#### 1.1 登录管理员账号
访问：http://localhost:3000/admin

#### 1.2 创建第一个 Friend - Alice
1. 访问：http://localhost:3000/admin/friends
2. 点击「创建朋友」按钮
3. 填写表单：
   - **名称**：Alice
   - **Slug**：alice
   - **密码**：留空（自动生成）
   - **头像 URL**：`https://api.dicebear.com/7.x/avataaars/svg?seed=alice`
   - **关系描述**：我的大学室友，一起度过了难忘的青春时光
4. 点击「创建」
5. **重要**：复制弹出的密码（只显示一次）
6. 记录访问链接和密码

#### 1.3 创建更多 Friends（可选）
重复上述步骤，创建：
- **Bob** (slug: bob) - 旅行伙伴，一起环游欧洲
- **Carol** (slug: carol) - 工作同事，咖啡爱好者

**测试账号信息示例：**
```
Alice
- URL: http://localhost:3000/zh/m/friends/alice
- Slug: alice
- Password: [创建时显示的密码，类似 aBc3De5Fg7Hj]

Bob
- URL: http://localhost:3000/zh/m/friends/bob
- Slug: bob
- Password: [创建时显示的密码]

Carol
- URL: http://localhost:3000/zh/m/friends/carol
- Slug: carol
- Password: [创建时显示的密码]
```

---

### 步骤 2：创建测试 Moments（10 分钟）

由于当前 Moment 创建界面还没有好友关联选项，需要通过数据库直接创建测试数据。

#### 2.1 获取 Friend IDs
```sql
PGPASSWORD="sQy255izzBx7ezXh" psql -h 38.246.246.229 -U xin -d tdp -c "SELECT id, name, slug FROM \"Friend\" ORDER BY \"createdAt\" DESC LIMIT 3;"
```

记录输出的 Friend IDs：
```
Alice ID: clxxxxxxxxxxxxxxxxxx
Bob ID: clxxxxxxxxxxxxxxxxxx
Carol ID: clxxxxxxxxxxxxxxxxxx
```

#### 2.2 修改 SQL 脚本
打开 `scripts/create-friend-test-data.sql`，替换以下占位符：
- `REPLACE_WITH_ALICE_ID` → Alice 的实际 ID
- `REPLACE_WITH_BOB_ID` → Bob 的实际 ID
- `REPLACE_WITH_CAROL_ID` → Carol 的实际 ID

#### 2.3 执行 SQL 脚本
```bash
PGPASSWORD="sQy255izzBx7ezXh" psql -h 38.246.246.229 -U xin -d tdp -f scripts/create-friend-test-data.sql
```

#### 2.4 验证数据创建
```sql
-- 查询 Alice 的专属 Moments
PGPASSWORD="sQy255izzBx7ezXh" psql -h 38.246.246.229 -U xin -d tdp -c "
SELECT id, content, \"friendVisibility\", \"happenedAt\"
FROM \"Moment\"
WHERE \"friendId\" = 'ALICE_ID_HERE'
ORDER BY \"createdAt\" DESC;
"
```

**预期结果**：应该看到 3 条为 Alice 创建的专属 Moments

---

### 步骤 3：测试好友认证（5 分钟）

#### 3.1 测试成功登录
1. 访问：http://localhost:3000/zh/m/friends
2. 输入 Slug：`alice`
3. 输入密码：[步骤 1 中复制的密码]
4. 点击「登录」
5. **预期**：重定向到 Alice 的故事墙页面

#### 3.2 测试失败登录
1. 打开新的隐身窗口
2. 访问：http://localhost:3000/zh/m/friends
3. 输入 Slug：`alice`
4. 输入错误密码：`wrongpassword`
5. **预期**：显示错误消息「密码错误」

#### 3.3 测试速率限制
1. 连续输入错误密码 10 次
2. 第 11 次尝试时
3. **预期**：显示「尝试次数过多，请稍后再试」

---

### 步骤 4：测试好友故事墙（10 分钟）

#### 4.1 查看 Alice 的故事墙
1. 成功登录后，应该看到：
   - Alice 的头像和名称
   - 关系描述
   - Moment 时间线

#### 4.2 验证可见性控制
Alice 应该能看到的 Moments：
- ✅ 所有 PUBLIC Moments（公开动态）
- ✅ 为 Alice 创建的 FRIEND_ONLY Moments（专属动态）
- ❌ 为 Bob/Carol 创建的 FRIEND_ONLY Moments
- ❌ PRIVATE Moments

**测试方法**：
```sql
-- 查询 Alice 应该看到的 Moments
PGPASSWORD="sQy255izzBx7ezXh" psql -h 38.246.246.229 -U xin -d tdp -c "
SELECT content, \"friendVisibility\", \"happenedAt\"
FROM \"Moment\"
WHERE \"friendVisibility\" = 'PUBLIC'
   OR (\"friendVisibility\" = 'FRIEND_ONLY' AND \"friendId\" = 'ALICE_ID_HERE')
ORDER BY \"createdAt\" DESC;
"
```

#### 4.3 测试不同好友看到不同内容
1. 登出 Alice 账号
2. 使用 Bob 的凭据登录
3. 访问：http://localhost:3000/zh/m/friends/bob
4. **预期**：只看到 PUBLIC Moments 和 Bob 的专属 Moments，看不到 Alice 的专属内容

---

### 步骤 5：测试管理员功能（5 分钟）

#### 5.1 编辑 Friend 信息
1. 访问：http://localhost:3000/admin/friends
2. 点击 Alice 行的「编辑」按钮
3. 修改名称为：Alice (Updated)
4. 修改描述
5. 保存
6. **预期**：列表中显示更新后的信息

#### 5.2 重置密码
1. 点击 Alice 行的「重置密码」按钮
2. 确认操作
3. **重要**：复制新密码
4. 登出并用新密码测试登录
5. **预期**：旧密码失效，新密码可用

#### 5.3 删除 Friend
1. 点击测试账号的「删除」按钮
2. 确认删除
3. **预期**：
   - Friend 从列表中消失
   - 相关 Moments 的 friendId 设为 null（Moment 本身不删除）

---

## 📍 重要页面和 URL

### 管理员页面（需要 ADMIN 角色）
- **Friend 列表**：http://localhost:3000/admin/friends
- **创建 Friend**：http://localhost:3000/admin/friends/create
- **编辑 Friend**：http://localhost:3000/admin/friends/[friendId]

### 公开 Friend 页面
- **认证页面（中文）**：http://localhost:3000/zh/m/friends
- **认证页面（英文）**：http://localhost:3000/en/m/friends
- **Alice 故事墙（中文）**：http://localhost:3000/zh/m/friends/alice
- **Alice 故事墙（英文）**：http://localhost:3000/en/m/friends/alice
- **Bob 故事墙**：http://localhost:3000/zh/m/friends/bob
- **Carol 故事墙**：http://localhost:3000/zh/m/friends/carol

### API 端点
```bash
# 认证
curl -X POST http://localhost:3000/api/friends/auth \
  -H "Content-Type: application/json" \
  -d '{"slug": "alice", "password": "your-password"}'

# 登出
curl -X POST http://localhost:3000/api/friends/logout

# 重置密码（管理员）
curl -X POST http://localhost:3000/api/admin/friends/[friendId]/reset-password \
  -H "Cookie: authjs.session-token=your-admin-token"

# 删除 Friend（管理员）
curl -X DELETE http://localhost:3000/api/admin/friends/[friendId] \
  -H "Cookie: authjs.session-token=your-admin-token"
```

---

## 🔒 安全特性

### 密码安全
- ✅ bcrypt 加密（12 rounds）
- ✅ 密码只在创建时显示一次
- ✅ 不可逆加密，无法查看原始密码

### 认证安全
- ✅ JWT Token（30 天有效期）
- ✅ HTTP-only Cookie
- ✅ Production 环境使用 Secure Cookie
- ✅ 速率限制（10 次失败后锁定）

### 访问控制
- ✅ 管理员功能需要 ADMIN 角色
- ✅ Friend 页面需要认证 Cookie
- ✅ 未认证自动重定向到登录页
- ✅ Moment 可见性严格控制

---

## 🐛 已知问题和待改进

### 当前限制
1. **Moment 创建界面缺少好友关联选项**
   - 影响：需要通过 SQL 手动关联 Moments 和 Friends
   - 解决方案：需要更新 Moment 创建表单，添加好友选择器

2. **无法直接在前端创建带好友关联的 Moments**
   - 影响：测试需要数据库操作权限
   - 解决方案：添加管理员 Moment 创建界面，包含好友可见性控制

3. **无实时 slug 验证**
   - 影响：可能输入已存在的 slug，提交后才发现错误
   - 解决方案：添加防抖验证 API

### 建议改进
1. 添加 Moment 创建/编辑界面的好友关联功能
2. 添加管理员分析面板（登录次数、访问统计）
3. 添加好友活动日志
4. 添加批量操作（批量删除、导出）
5. 添加搜索和过滤功能

---

## 📊 测试检查清单

### 基础功能测试
- [ ] 创建 Friend 成功
- [ ] 复制密码成功
- [ ] 复制访问链接成功
- [ ] 好友列表显示正确
- [ ] 编辑 Friend 信息成功
- [ ] 重置密码成功
- [ ] 删除 Friend 成功

### 认证功能测试
- [ ] 正确密码登录成功
- [ ] 错误密码显示错误消息
- [ ] 速率限制生效（10次后锁定）
- [ ] Cookie 保存成功
- [ ] 登出清除 Cookie

### 故事墙功能测试
- [ ] Alice 看到自己的专属 Moments
- [ ] Alice 看到 PUBLIC Moments
- [ ] Alice 看不到 Bob 的专属 Moments
- [ ] Alice 看不到 PRIVATE Moments
- [ ] 故事墙显示好友头像和描述
- [ ] Moment 按时间倒序排列

### 安全功能测试
- [ ] 未认证访问重定向到登录页
- [ ] JWT Token 有效期 30 天
- [ ] 密码 bcrypt 加密
- [ ] 管理员页面需要 ADMIN 角色
- [ ] Cookie 设置 HTTP-only

### 双语测试
- [ ] 中文认证页面正常
- [ ] 英文认证页面正常
- [ ] 中文故事墙正常
- [ ] 英文故事墙正常

---

## 💡 快速验证命令

### 检查 Friend 数据
```bash
PGPASSWORD="sQy255izzBx7ezXh" psql -h 38.246.246.229 -U xin -d tdp -c "
SELECT id, name, slug, \"createdAt\"
FROM \"Friend\"
ORDER BY \"createdAt\" DESC;
"
```

### 检查 Moment 数据
```bash
PGPASSWORD="sQy255izzBx7ezXh" psql -h 38.246.246.229 -U xin -d tdp -c "
SELECT id, content, \"friendVisibility\", \"friendId\", \"happenedAt\"
FROM \"Moment\"
WHERE \"friendVisibility\" != 'PRIVATE'
ORDER BY \"createdAt\" DESC
LIMIT 10;
"
```

### 检查 Alice 的可见 Moments
```bash
# 替换 ALICE_ID 为实际 ID
PGPASSWORD="sQy255izzBx7ezXh" psql -h 38.246.246.229 -U xin -d tdp -c "
SELECT content, \"friendVisibility\"
FROM \"Moment\"
WHERE \"friendVisibility\" = 'PUBLIC'
   OR (\"friendVisibility\" = 'FRIEND_ONLY' AND \"friendId\" = 'ALICE_ID')
ORDER BY \"createdAt\" DESC;
"
```

---

## 🎉 完成测试后

### 清理测试数据（可选）
```sql
-- 删除测试 Friends
DELETE FROM \"Friend\" WHERE slug IN ('alice', 'bob', 'carol');

-- 删除测试 Moments
DELETE FROM \"Moment\" WHERE id LIKE 'moment_alice_%';
DELETE FROM \"Moment\" WHERE id LIKE 'moment_bob_%';
DELETE FROM \"Moment\" WHERE id LIKE 'moment_carol_%';
DELETE FROM \"Moment\" WHERE id LIKE 'moment_public_%';
```

### 反馈和问题报告
如果发现任何问题，请记录：
1. 重现步骤
2. 预期行为
3. 实际行为
4. 浏览器和环境信息
5. 错误消息和截图

---

## 📚 相关文档

- **Friend 核心逻辑**：`src/lib/friends.ts`
- **认证逻辑**：`src/lib/friend-auth.ts`
- **数据库 Schema**：`prisma/schema.prisma`
- **测试文件**：`src/lib/__tests__/friends.test.ts`
- **SQL 脚本**：`scripts/create-friend-test-data.sql`
