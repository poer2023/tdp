# Lumina UI 大改后的补齐与上线指南

面向当前分支（gemini3.0）与 `main` 的差异，梳理必须补齐的功能、数据库调整、CICD 要点，确保在保持当前 Lumina 设计语言（stone/sage 色板、Outfit/Lora 字体、简洁动效）的前提下安全上线。

## 必须补齐的功能差
- **全局导航/入口恢复**：`src/app/layout.tsx` 目前移除了 `MainNav`、登录入口、语言切换与全局搜索/命令面板，导致文章页/搜索页等无导航。方案：在 RootLayout 引入 `LuminaHeader`（或恢复原 `MainNav` 组合），保证至少有 Home、语言切换、登录/后台入口、搜索入口。
- **首页混合 Feed 排序**：`src/app/[locale]/page.tsx` 将文章与动态混排但使用 `Math.random()` 乱序。方案：基于 `publishedAt`/`createdAt` 排序（新到旧），保持 Lumina 视觉但数据有序。
- **Profile 文案硬编码**：同文件硬编码 “BaoZhi / Product Manager”。方案：从配置/环境/数据库读取真实资料或抽到常量配置文件，避免误公开。
- **Moments 点赞未落地**：`src/components/lumina/home-page.tsx`/`moment-detail.tsx` 里点赞仅 TODO/console.log，likes 永远为 0。方案：补 API（如 `/api/moments/[id]/like`）、前端状态同步与防抖，沿用现有色板。
- **Moments 管理操作缺失**：瀑布流重写后 `MomentMasonryCard` 忽略 `onDelete`/`isAdmin`，后台删除/隐藏入口丢失。方案：卡片或 Lightbox 内加管理按钮（删除/设私密），调用现有 admin API。
- **全局页脚/辅助功能**：部分页面（文章详情、搜索、登录等）现在没有 Footer/语言切换/命令面板。方案：统一在 Layout 或 `LuminaHeader/Footer` 覆盖，确保可访问性和导航一致。

## 数据库调整
- 新增表与关系：`prisma/schema.prisma` 添加 `MomentComment`（含 author/moment 外键、索引）并为 `User`、`Moment` 增加关系字段。
- 生成迁移（必做且提交）：  
  ```bash
  npx prisma migrate dev --name add_moment_comments
  npx prisma generate
  ```
  备注：仅新增表，无破坏性变更；已有数据不受影响。
- 部署阶段：CICD 已有 `npx prisma migrate deploy`。生成迁移后无需改动流程，但需确认生产 `DATABASE_URL`/权限可写入。
- 本地/预发验证：`prisma migrate deploy` 后，手动 `POST /api/moments/{id}/comments` 写入一条评论并 `GET` 验证读取。

## CICD / GitHub Actions 注意事项
- Workflows（`ci.yml` 等）已在 build 前执行 `prisma migrate deploy`。生成迁移文件后应通过现有流水线，无需新增步骤。
- 若添加新 API（like/comment），补充最低限度的单元/集成测试或在 CI 中运行相关 E2E（若已有覆盖），避免回归。
- 设计资产（Google Fonts）已在 `globals.css` 通过 @import，引入不影响 CI；确保 Vercel/自托管允许外部字体加载。

## 回归验证清单（上线前自测）
- 首页：文章/动态按时间排序，跳转正常；硬编码文案已替换。
- 导航：所有页面具备语言切换、登录/后台入口、搜索/命令面板入口（桌面与移动）。
- Moments：瀑布流加载、预览、Lightbox、评论读写正常；点赞有真实计数并可重复交互；管理员可删除/设私密。
- Gallery/Projects/About Live：Lumina Header/Footer 正常渲染，地图/统计组件不报错。
- 认证：`/login` 新皮肤下 Google/邮箱登录可达后台。
- 数据库：迁移成功，`MomentComment` 可插入/查询，`prisma generate` 已执行。
