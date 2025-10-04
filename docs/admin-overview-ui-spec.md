# Admin Overview 实施任务清单（拆解版）

最近更新：2025-10-02
负责人：Design / Frontend / Backend
适用页面：`/admin`（概览）+ 相关子页/组件

目标：以“简洁优雅 + 高信息密度 + 合并同类项”为方向，按里程碑逐步落地。每条任务都包含：产出、涉及文件、验收标准与备注。

---

## 里程碑 M0 · 准备与基线（0.5–1d）

- [ ] 定义 Design Token 与图标集
  - 产出：颜色、字号、间距、圆角、阴影、过渡的统一约定；Lucide 图标清单
  - 参考 Token（Tailwind 语义）：
    - 颜色：背景 `zinc-50/950`，卡片 `white/#0b0b0d`，边框 `zinc-200/800`，主文 `zinc-900/100`，次文 `zinc-600/400`，强调 `blue-600/500`
    - 尺寸：标题 24/600；分组 14/600/uppercase；正文 14–15；数字 28–32/700；圆角 12
  - 验收：在文档 `docs/design-tokens.md` 记录；设计稿/前端认领

- [ ] 交互与可访问性基线
  - 产出：全局 focus ring、hover、disabled 的统一策略；键盘导航规范
  - 验收：在 `docs/a11y-guidelines.md` 记录；组件开发按此执行

---

## 里程碑 M1 · 布局与导航（1–2d）

- [ ] Admin Header（紧凑化）
  - 产出：顶部高度 56–60，左侧 `Admin / Overview` 面包屑，右侧用户菜单
  - 文件：`src/app/layout.tsx`、`src/components/auth-header.tsx`
  - 验收：概览页顶部不显突兀；滚动时头部固定；Esc 可关菜单；Tab 可达

- [ ] SidebarNav 分组与合并
  - 产出：分组 Content（Posts/Gallery）、Operations（Content I/O）；支持收起模式
  - 文件：`src/components/admin/admin-nav.tsx`
  - 变更：将 Import/Export 合并为单条“Content I/O”入口
  - 验收：当前路由激活态高亮（文字+左 2px 导航线）；移动端为抽屉

---

## 里程碑 M2 · 指标卡 Metrics（1–2d）

- [ ] 新建组件 `MetricCard`
  - 产出：统一规格（高 88–96，p-5，圆角 12，边框色统一），左大数字、右上 `View` 链接，下方 Meta 小字
  - 文件：`src/components/admin/metric-card.tsx`
  - 验收：hover 边框加深、focus 有 2px ring；Skeleton 占位

- [ ] 两张指标卡落地
  - Posts：数字=总文章；Meta=`Published x · Drafts y`
  - Gallery：数字=总照片；Meta=`Live x · Geotagged y`
  - 文件：`src/app/admin/page.tsx`
  - 数据：新增轻量聚合方法或查询（可于现有 lib 内补充）
    - 建议：`src/lib/posts.ts` 暴露 `countPosts() / countDrafts()`；`src/lib/gallery.ts` 暴露 `countGallery({ live?, geotagged? })`
  - 验收：首屏 1×4 布局（xl），1024 下自动变 2×2；点击 `View` 直达子页

---

## 里程碑 M3 · 快捷操作 Quick Actions（1–1.5d）

- [ ] 新建组件 `ActionCard`
  - 产出：左图标，右标题+一句副文案，最右箭头；高 72–84
  - 文件：`src/components/admin/action-card.tsx`
  - 验收：hover 轻阴影、边框提亮；键盘 Enter 触发；可禁用

- [ ] 三个动作卡
  - Posts（主 CTA：New Post；次 CTA：Manage Posts）
  - Content I/O（合并 Import/Export；卡内双按钮：Import/Export）
  - Gallery（主 CTA：Upload Photos；次 CTA：Manage Gallery）
  - 文件：`src/app/admin/page.tsx`
  - 验收：2×2 栅格；卡内 CTA 布局不抖动；移动端 1 列

---

## 里程碑 M4 · 最近动态 Activity（1.5–2d）

- [ ] Recent Posts（列表）
  - 产出：最新 5 篇；标题单行省略；右侧状态徽标（Published/Draft）；行尾 `edit →`
  - 文件：`src/components/admin/recent-posts.tsx`
  - 数据：`listRecentPosts(limit=5)`（`src/lib/posts.ts`）
  - 验收：点击进入编辑；空态有 CTA（New Post）

- [ ] Recent Uploads（缩略图）
  - 产出：最近 6 张 1:1 缩略图；圆角 8；hover “View” 蒙层
  - 文件：`src/components/admin/recent-uploads.tsx`
  - 数据：`listGalleryImages(6)`（已存在）
  - 验收：点击进入 `/gallery/[id]`

- [ ] 栅格整合与响应式
  - 文件：`src/app/admin/page.tsx`
  - 验收：≥1280 三列；1024–1279 两列；<1024 单列

---

## 里程碑 M5 · Content I/O 统一入口（2–3d）

- [ ] 入口与页面/面板
  - 产出：新路由 `Content I/O` 页面或右侧抽屉面板
  - 文件（二选一）：
    - 页面：`src/app/admin/content-io/page.tsx`
    - 面板组件：`src/components/admin/content-io-panel.tsx`
  - 验收：从侧边栏与动作卡可达；返回导航清晰

- [ ] Import（左）
  - 产出：选择 zip/目录 → Dry-run（只校验）→ Apply（写库）；显示创建/更新/跳过/错误统计
  - 文件：`src/app/admin/content-io/page.tsx` 内的表单与结果区；Server Actions 放在 `src/app/admin/content-io/actions.ts`
  - 兼容：Markdown + frontmatter（遵循既定规范）+ 附件
  - 验收：Dry-run 不改库；Apply 后给出摘要与错误清单

- [ ] Export（右）
  - 产出：按时间/locale 筛选 → 导出 zip（MD+附件）
  - 文件：同上；导出 API 可走 Route Handler
  - 验收：下载成功；包含 manifest

---

## 里程碑 M6 · 视觉统一与 A11y（并行 0.5–1d）

- [ ] 视觉 Token 套用
  - 范围：指标卡、动作卡、列表与缩略图容器、徽标
  - 验收：圆角 12、边框 `zinc-200/800`、过渡 180–220ms 统一

- [ ] 可访问性
  - 范围：所有可点击元素可聚焦；Menu Esc 关闭；列表可键盘操作
  - 验收：对比度≥4.5:1；无键盘陷阱；读屏有语义

---

## 里程碑 M7 · QA 与发布（0.5–1d）

- [ ] 断点走查与手测
  - 分辨率：1280/1024/768/375；检查换行、对齐、空白
  - 链接：`View/CTA` 跳转正确；回退路径自然

- [ ] 验收清单（关键）
  - 首屏：1 屏内看到“指标 + 动作 + 最近动态”；无大块空白
  - 合并：Import/Export 只出现在 `Content I/O`；Posts 卡含 Published/Drafts，Gallery 卡含 Live/Geotagged
  - 交互：hover/focus/disabled 一致；键盘/读屏可用

---

## 文件创建/修改一览

- 新建
  - `src/components/admin/metric-card.tsx`
  - `src/components/admin/action-card.tsx`
  - `src/components/admin/recent-posts.tsx`
  - `src/components/admin/recent-uploads.tsx`
  - `src/app/admin/content-io/page.tsx` 或 `src/components/admin/content-io-panel.tsx`
  - `src/app/admin/content-io/actions.ts`
  - 文档：`docs/design-tokens.md`、`docs/a11y-guidelines.md`

- 修改
  - `src/app/admin/page.tsx`（整体布局：MetricsGrid、ActionsGrid、ActivityGrid）
  - `src/components/admin/admin-nav.tsx`（合并 Import/Export）
  - `src/app/layout.tsx`、`src/components/auth-header.tsx`（紧凑化 Header）
  - `src/lib/posts.ts`（统计/最近）、`src/lib/gallery.ts`（最近/计数）

---

## 风险与回退

- Content I/O 的导入解析需严格校验（frontmatter、附件路径）；建议先只做 Export 与 Import Dry-run，Apply 延后一小迭代。
- 指标数据聚合注意数据库压力；建议使用精简字段查询与轻缓存（revalidate 60–300s）。
- 侧边栏折叠模式为增强项，如工期紧可延后。

---

## 时间预估（理想人日）

- M0：0.5–1d
- M1：1–2d
- M2：1–2d
- M3：1–1.5d
- M4：1.5–2d
- M5：2–3d（可拆二阶段：先 Export + Dry-run）
- M6：0.5–1d（并行）
- M7：0.5–1d

---

## 验收演示脚本（DEMO 流程）

1. 进入 `/admin`，看到 3 张指标卡 + 4 个动作卡 + 3 块最近动态；无滚动或轻微滚动。
2. 点击 Posts 的 `View` → 跳到 `/admin/posts`；返回。
3. 点击 Content I/O 卡内 `Export` → 出现筛选并可下载 zip。
4. 响应式缩放到 1024/768/375，布局切换为 2×2 / 1 列；无错位。
5. Tab 键遍历所有可交互元素，Enter 可触发；Esc 关闭用户菜单。

> 本文档会持续更新。变更请在 PR 中同步修改本文件，并在顶部更新“最近更新”日期与负责人。
