# 如何获取 B 站 Cookie（详细图文教程）

## 📋 需要获取的 3 个值

我们需要从 B 站获取以下 3 个 Cookie 值：

1. **SESSDATA** - 会话数据
2. **bili_jct** - 跨站请求令牌
3. **buvid3** - 浏览器唯一标识

---

## 🖥️ 方法 1: 使用 Chrome/Edge（推荐）

### 步骤 1: 登录 B 站

打开浏览器，访问 [https://www.bilibili.com](https://www.bilibili.com) 并登录你的账号。

### 步骤 2: 打开开发者工具

**Windows/Linux**: 按 `F12` 或 `Ctrl + Shift + I`
**Mac**: 按 `Cmd + Option + I`

或者右键点击页面 → 选择「检查」或「Inspect」

### 步骤 3: 找到 Application/应用 标签

在开发者工具顶部，找到并点击：

- 中文版: **「应用」** 标签
- 英文版: **「Application」** 标签

（如果找不到，点击开发者工具右上角的 `>>` 按钮展开更多选项）

### 步骤 4: 展开 Cookies

在左侧面板中：

1. 找到 **「Cookies」** 或 **「存储」** → **「Cookies」**
2. 展开它
3. 点击 **`https://www.bilibili.com`**

### 步骤 5: 复制 Cookie 值

在右侧面板的列表中，找到以下三个 Cookie（按字母排序）：

#### 1. **SESSDATA**

- 在列表中找到名称为 `SESSDATA` 的行
- 点击该行，右侧会显示 "Value" 值
- 完整复制 "Value" 的内容（非常长的字符串）
- **示例**: `abc123def456...` (实际约 50-100 个字符)

#### 2. **bili_jct**

- 找到名称为 `bili_jct` 的行
- 复制它的 "Value" 值
- **示例**: `1234567890abcdef...` (约 32 个字符)

#### 3. **buvid3**

- 找到名称为 `buvid3` 的行
- 复制它的 "Value" 值
- **示例**: `ABCD-1234-EFGH-5678...` (约 40 个字符)

### 步骤 6: 保存到 .env.local

打开项目根目录的 `.env.local` 文件，填入刚才复制的值：

\`\`\`env

# B 站认证 Cookie

BILIBILI_SESSDATA=粘贴你复制的SESSDATA值
BILIBILI_BILI_JCT=粘贴你复制的bili_jct值
BILIBILI_BUVID3=粘贴你复制的buvid3值
\`\`\`

**⚠️ 注意**：

- 不要有多余的空格或引号
- 确保每个值都完整复制
- 值的开头和结尾不要有空格

---

## 🦊 方法 2: 使用 Firefox

### 步骤 1-2: 同上，登录 B 站并打开开发者工具

### 步骤 3: 找到「存储」标签

在开发者工具顶部，点击 **「存储」** 标签

### 步骤 4: 展开 Cookie

在左侧面板：

1. 展开 **「Cookie」**
2. 点击 **`https://www.bilibili.com`**

### 步骤 5-6: 同方法 1，复制三个值并保存

---

## 🔧 方法 3: 使用快捷脚本（最快）

如果你觉得手动复制麻烦，可以在 B 站页面的浏览器控制台运行这个脚本：

### 步骤 1: 打开控制台

**Windows/Linux**: `Ctrl + Shift + J`
**Mac**: `Cmd + Option + J`

### 步骤 2: 粘贴并运行脚本

复制下面的代码，粘贴到控制台，按回车：

\`\`\`javascript
// 获取 B 站 Cookie 的快捷脚本
function getBilibiliCookies() {
const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
const [key, value] = cookie.split('=');
acc[key] = value;
return acc;
}, {});

const requiredCookies = ['SESSDATA', 'bili_jct', 'buvid3'];
let output = '\\n=== B 站 Cookie 配置 ===\\n\\n';

requiredCookies.forEach(name => {
if (cookies[name]) {
output += \`BILIBILI\_\${name.toUpperCase().replace('BILI_JCT', 'BILI_JCT')}=\${cookies[name]}\\n\`;
} else {
output += \`❌ 缺失: \${name}\\n\`;
}
});

output += '\\n=== 复制上面的内容到 .env.local ===\\n';
console.log(output);

// 尝试复制到剪贴板
const configText = requiredCookies
.filter(name => cookies[name])
.map(name => \`BILIBILI\_\${name.toUpperCase().replace('BILI_JCT', 'BILI_JCT')}=\${cookies[name]}\`)
.join('\\n');

navigator.clipboard.writeText(configText).then(() => {
console.log('✅ 已复制到剪贴板！直接粘贴到 .env.local 即可');
}).catch(() => {
console.log('⚠️ 请手动复制上面的配置');
});
}

getBilibiliCookies();
\`\`\`

### 步骤 3: 查看输出

脚本会自动：

1. 提取所需的 3 个 Cookie
2. 格式化成 `.env.local` 格式
3. 尝试复制到剪贴板

你只需要：

- 如果复制成功，直接粘贴到 `.env.local`
- 如果复制失败，手动复制控制台输出的配置

---

## ✅ 验证 Cookie 是否有效

配置好 `.env.local` 后，运行测试脚本验证：

\`\`\`bash

# 测试 B 站 Cookie 是否有效

npx tsx scripts/test-bilibili.ts
\`\`\`

如果看到类似这样的输出，说明成功：

\`\`\`
🧪 Testing Bilibili sync...
✅ Successfully fetched 20 items

📋 Sample items:

1. 【视频标题】
   - AID: 123456
   - Progress: 85%
     ...
     \`\`\`

---

## 🔒 安全提示

1. **不要分享你的 Cookie**
   - 这些 Cookie 相当于你的登录凭证
   - 不要截图或发送给任何人

2. **定期更新**
   - B 站 Cookie 一般 1-3 个月过期
   - 过期后重新获取即可

3. **不要提交到 Git**
   - `.env.local` 已经在 `.gitignore` 中
   - 确保不会误提交

4. **退出登录会失效**
   - 如果你在 B 站退出登录，Cookie 会立即失效
   - 需要重新登录并获取新的 Cookie

---

## ❓ 常见问题

### Q1: 我找不到某个 Cookie

**答**:

- 确保你已经登录 B 站
- 刷新页面后再查看
- 某些浏览器扩展可能会干扰 Cookie，尝试关闭扩展

### Q2: Cookie 格式是否正确？

**答**: 正确的格式示例：

\`\`\`env

# ✅ 正确

BILIBILI_SESSDATA=abc123def456...

# ❌ 错误 - 不要加引号

BILIBILI_SESSDATA="abc123def456..."

# ❌ 错误 - 不要有空格

BILIBILI_SESSDATA= abc123def456...

# ❌ 错误 - 值不完整

BILIBILI_SESSDATA=abc123
\`\`\`

### Q3: Cookie 过期了怎么办？

**答**:
重新按照上面的步骤获取新的 Cookie，替换 `.env.local` 中的旧值即可。

### Q4: 可以用手机获取吗？

**答**:
不推荐。手机浏览器的开发者工具不完整，建议使用电脑浏览器。

---

## 🎯 下一步

获取 Cookie 后：

1. 配置 `.env.local`
2. 运行测试: `npx tsx scripts/test-bilibili.ts`
3. 启动定时任务: `pm2 start scripts/sync-media-cron.ts --name media-sync --interpreter tsx`
4. 查看管理后台: `http://localhost:3000/admin/sync-dashboard`

---

需要帮助？请查看项目 Issues 或联系维护者。
