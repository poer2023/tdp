# Moments 模块说明

短内容（瞬间/Notes）发布与展示系统，面向 10–200 字和 1–9 张图片的快速记录。

## 路由与能力

- 列表：`/m`（英文，无 /en 前缀），`/zh/m`（中文）
- 详情：`/m/[id|slug]`（含返回按钮、图片预览 Lightbox 支持左右切换；可通过 `?image=3` 指定初始索引）
- 归档：`/m/archive?y=2025&m=10`
- 订阅：`/m/rss.xml`、`/m/feed.json`，仅公开内容
- Sitemap：`/m/sitemap.xml`

## 发布与弹窗

- 弹窗打开方式：
  - 点击“+ New/发布”按钮
  - 访问地址带 `?compose=1`
- 未登录也会挂载弹窗并提示前往登录，避免无法打开的错觉
- 发布器支持：多图（1–9）、标签（逗号分隔）、地点名称、定时（计划发布）
- 性能：上传时自动生成 1280w 的 WebP 预览图（previewUrl），列表优先加载 WebP，点击看原图

## 列表与卡片

- 列表为两列网格
- 单卡图片布局参考 Twitter：
  - 1 图：全宽
  - 2 图：两列
  - 3 图：左大右两小
  - ≥4 图：2x2，右下角 `+N` 覆盖，点击进入详情页并打开 Lightbox
- 卡片底部显示地点与标签；列表不再显示 “View” 链接

## 删除与权限

- 删除仅对 ADMIN 用户显示为卡片右上角的小图标，点击二次确认后软删除（进入回收站 `/m/trash`）
- 非管理员与游客不可见删除入口

## 计划发布（Scheduler）

- 未来时间发布的瞬间会以 SCHEDULED 状态入库，到点后惰性可见
- 建议配置 CRON 主动转正：
  - 端点：`POST /api/cron/publish-scheduled-moments`
  - Header：`x-cron-secret: $CRON_SECRET`
  - 环境变量：`CRON_SECRET=<your-secret>`

## 回收站

- `/m/trash`（英文）与 `/zh/m/trash`（中文）
- 作者可在回收站恢复或彻底删除

## 开发与测试

- 迁移：Prisma 已包含 `Moment`、`RateLimitHit`；执行 `npm run db:migrate`
- E2E：Playwright 测试 `e2e/moments.spec.ts`
  - 覆盖：弹窗打开（按钮/URL）、创建瞬间、管理员删除显示、+N 覆盖跳转 Lightbox、WebP 预览
  - 执行：`npm run test:e2e` 或只跑该文件：
    ```bash
    npx playwright test e2e/moments.spec.ts --project=chromium
    ```

## 注意

- 历史数据若无 WebP 预览，将回退加载原图。可在后续补一个批处理脚本生成 previewUrl。
- 详情页 Lightbox 仅在图片数量大于 1 时启用。
