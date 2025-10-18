# 如何获取豆瓣 Cookie（详细教程）

## 🤔 为什么需要豆瓣 Cookie？

如果你的豆瓣账号设置了**隐私保护**（推荐），那么你的"看过"列表只有登录后才能完整查看。

**没有 Cookie 的情况**：

- ❌ 只能获取到最近的 10-15 部电影
- ❌ 无法获取完整的观影记录

**有 Cookie 的情况**：

- ✅ 可以获取全部观影记录（即使设置了隐私保护）
- ✅ 保持你的豆瓣账号隐私设置不变
- ✅ 只有你自己能看到完整数据

---

## 📝 需要获取的 Cookie 值

我们只需要一个值：**`dbcl2`**

这是豆瓣的会话 Cookie，用于验证你的登录状态。

---

## 🖥️ 方法 1: 使用 Chrome/Edge（推荐）

### 步骤 1: 登录豆瓣

打开浏览器，访问 [https://www.douban.com](https://www.douban.com) 并登录你的账号。

### 步骤 2: 打开开发者工具

**Windows/Linux**: 按 `F12` 或 `Ctrl + Shift + I`
**Mac**: 按 `Cmd + Option + I`

或者右键点击页面 → 选择「检查」或「Inspect」

### 步骤 3: 找到 Application/应用 标签

在开发者工具顶部，找到并点击：

- 中文版: **「应用」** 标签
- 英文版: **「Application」** 标签

### 步骤 4: 展开 Cookies

在左侧面板中：

1. 找到 **「Cookies」** 或 **「存储」** → **「Cookies」**
2. 展开它
3. 点击 **`https://www.douban.com`**

### 步骤 5: 复制 Cookie 值

在右侧面板的列表中，找到名称为 **`dbcl2`** 的行：

1. 点击该行
2. 右侧会显示 "Value" 值
3. 完整复制 "Value" 的内容
4. **示例**: `"123456789:AbCdEfGh1234567"` (实际约 30-50 个字符)

**⚠️ 重要**：

- 复制的值会包含引号，比如 `"123456789:AbCdEfGh1234567"`
- **保留引号**，完整复制

### 步骤 6: 保存到 .env.local

打开项目根目录的 `.env.local` 文件，填入刚才复制的值：

\`\`\`env

# 豆瓣 Cookie（必需 - 用于获取完整观影记录）

DOUBAN_COOKIE=dbcl2="123456789:AbCdEfGh1234567"
\`\`\`

**格式要求**：

- 必须以 `dbcl2=` 开头
- 值要包含引号（如上面示例）
- 不要有多余的空格

---

## 🦊 方法 2: 使用 Firefox

### 步骤 1-2: 同上，登录豆瓣并打开开发者工具

### 步骤 3: 找到「存储」标签

在开发者工具顶部，点击 **「存储」** 标签

### 步骤 4: 展开 Cookie

在左侧面板：

1. 展开 **「Cookie」**
2. 点击 **`https://www.douban.com`**

### 步骤 5-6: 同方法 1，复制 `dbcl2` 并保存

---

## 🔧 方法 3: 使用快捷脚本（最快）

### 步骤 1: 打开控制台

**Windows/Linux**: `Ctrl + Shift + J`
**Mac**: `Cmd + Option + J`

### 步骤 2: 粘贴并运行脚本

复制下面的代码，粘贴到控制台，按回车：

\`\`\`javascript
// 获取豆瓣 Cookie 的快捷脚本
function getDoubanCookie() {
const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
const [key, value] = cookie.split('=');
acc[key] = value;
return acc;
}, {});

if (!cookies['dbcl2']) {
console.error('❌ 未找到 dbcl2 Cookie');
console.error('请确保：');
console.error('1. 你已经登录豆瓣');
console.error('2. 在豆瓣网站上运行此脚本');
return;
}

const cookieValue = \`dbcl2="\${cookies['dbcl2']}"\`;
const output = \`
=== 复制以下内容到 .env.local ===

DOUBAN_COOKIE=\${cookieValue}

=== 配置完成后运行测试 ===
npx tsx scripts/test-douban.ts
\`.trim();

console.log(output);

navigator.clipboard.writeText(\`DOUBAN_COOKIE=\${cookieValue}\`).then(() => {
console.log('\\n✅ 已复制到剪贴板！直接粘贴到 .env.local 即可');
}).catch(() => {
console.log('\\n⚠️ 请手动复制上面的配置');
});
}

getDoubanCookie();
\`\`\`

### 步骤 3: 查看输出并复制

脚本会：

1. 自动提取 `dbcl2` Cookie
2. 格式化成 `.env.local` 格式
3. 尝试复制到剪贴板

你只需要粘贴到 `.env.local` 文件中。

---

## ✅ 验证 Cookie 是否有效

配置好 `.env.local` 后，运行测试脚本：

\`\`\`bash
npx tsx scripts/test-douban.ts
\`\`\`

**成功的输出**：

\`\`\`
🧪 Testing Douban sync...

✅ Found Douban Cookie

- Cookie: dbcl2="123456..."

Fetching data for user: 257644246
✅ Successfully fetched 304 items ← 应该看到你的完整数量

📋 Sample items:

1. 花月杀手
   ...
   \`\`\`

**失败的输出**：

\`\`\`
⚠️ No items found or limited items
This means:

1. Cookie might be expired or invalid
2. Re-login to Douban and get fresh cookie
   \`\`\`

如果失败，重新获取 Cookie 并替换 `.env.local` 中的值。

---

## 🔒 安全提示

1. **不要分享你的 Cookie**
   - `dbcl2` Cookie 相当于你的豆瓣登录凭证
   - 不要截图或发送给任何人

2. **Cookie 有效期**
   - 豆瓣 Cookie 一般有效期较长（数月）
   - 如果你在豆瓣退出登录，Cookie 会立即失效
   - 失效后重新获取即可

3. **不要提交到 Git**
   - `.env.local` 已经在 `.gitignore` 中
   - 确保不会误提交

4. **隐私保护**
   - Cookie 只在你的服务器上使用
   - 不会发送给第三方
   - 只用于获取你自己的观影记录

---

## ❓ 常见问题

### Q1: 我找不到 `dbcl2` Cookie

**答**:

- 确保你已经登录豆瓣
- 刷新页面后再查看
- 尝试在豆瓣首页查看（不是电影页面）

### Q2: Cookie 格式是否正确？

**答**: 正确的格式示例：

\`\`\`env

# ✅ 正确 - 注意 dbcl2= 开头，值有引号

DOUBAN_COOKIE=dbcl2="123456789:AbCdEfGh1234567"

# ❌ 错误 - 缺少 dbcl2= 前缀

DOUBAN_COOKIE="123456789:AbCdEfGh1234567"

# ❌ 错误 - 外层不要加引号

DOUBAN_COOKIE="dbcl2=\"123456789:AbCdEfGh1234567\""

# ❌ 错误 - 值没有引号

DOUBAN_COOKIE=dbcl2=123456789:AbCdEfGh1234567
\`\`\`

### Q3: 为什么不设置为公开？

**答**:
设置为公开后，**任何人**都可以看到你的观影记录，包括：

- 看过的所有电影和剧集
- 你的评分和评论
- 观看时间

使用 Cookie 可以：

- ✅ 保持隐私设置
- ✅ 只有你自己能通过 Cookie 访问
- ✅ 更安全

### Q4: Cookie 过期了怎么办？

**答**:

1. 重新登录豆瓣
2. 按照上面的步骤获取新的 `dbcl2` Cookie
3. 替换 `.env.local` 中的 `DOUBAN_COOKIE` 值
4. 重启定时任务：`pm2 restart media-sync`

---

## 📋 完整配置示例

你的 `.env.local` 应该包含：

\`\`\`env

# 豆瓣配置

DOUBAN_USER_ID=257644246
DOUBAN_COOKIE=dbcl2="你的dbcl2值"
\`\`\`

---

## 🎯 下一步

1. ✅ 配置豆瓣 Cookie
2. ✅ 测试: `npx tsx scripts/test-douban.ts`
3. ✅ 确认获取到完整的 304 部电影
4. 🚀 启动定时同步
5. 📊 查看管理后台数据

---

需要帮助？请查看项目 Issues 或联系维护者。
