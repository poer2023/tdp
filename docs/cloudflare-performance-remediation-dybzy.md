# dybzy.com Cloudflare 性能修复方案（保留动画）

## 目标与约束
- 目标（移动端优先）：LCP < 2.5s，TTI < 4s，TBT < 200ms，FCP < 1.8s，CLS < 0.1，TTFB < 200ms。
- 约束：保留现有动画风格与动效体验；不削弱视觉完整度；仅做性能导向的加载顺序与分层优化。
- 范围：`/`（英文首页，包含 Hero + Feed + 侧栏）及其资源加载链路。

## 修复路线概览（从收益最大到最小）
1) 首屏 LCP 资源管理：只保留 1 个真正的 LCP 资源高优先级加载，其他资源延迟或降级。
2) 主线程与水合成本控制：拆分 client 组件，延后动画初始化，减少首屏 JS 执行。
3) HTML 负载与图片 srcset 控制：减少首屏数据量，降低 HTML/内联 JSON 体积。
4) CDN/缓存策略：让首页真正被边缘缓存（避免 no-store），并启用 SWR。
5) 字体/样式与第三方脚本：优化字体加载策略，延迟非关键脚本。

---

## 1. LCP 优化（保留动画）
### 1.1 只保留 1 个 LCP 资源为高优先级
- 原则：首屏 LCP 元素只允许 1 个 `priority`/`fetchpriority="high"`。
- 其余首屏图片保持动画但降级加载：
  - `loading="lazy"` 或 `fetchpriority="low"`。
  - 避免在 `<head>` 注入多条 `rel=preload as=image`。
- 建议位置：
  - `src/components/zhi/hero.tsx` 中 hero grid 的首张图设为唯一 `priority`。
  - 其余图改为 `loading="lazy"` + `fetchpriority="low"`。

### 1.2 动画延后启动（不删动效）
- 目标：避免动画初始化占用 LCP 时间片。
- 做法：
  - hero grid 首次渲染为静态布局（保留 hover 动画）。
  - 使用 `requestIdleCallback` 或 `window.load` 后再启用 shuffle 动效。
  - `PerformanceObserver` 监听 LCP 后启用动画（LCP 一旦触发即可开始动效）。
  - 在页面不可见时暂停（`document.visibilityState`）。

### 1.3 控制首屏图片的尺寸与 srcset 密度
- 目标：减少 HTML 中的 `srcset` 大量字符串，降低解析成本。
- 方案：
  - 调整 `next.config.ts` 中 `images.deviceSizes`/`images.imageSizes`，减少自动生成的宽度档位。
  - 对非 LCP 图片使用更小的 `sizes`，减少生成的 `srcset` 列表长度。
  - 对 hero grid 以外图片使用小尺寸 `sizes`（例如 `33vw/25vw/360px`）。

---

## 2. TTI/TBT 优化（保留动画）
### 2.1 拆分 client 组件，缩小水合范围
- 现状：首页整体为 client 组件，导致所有子树水合。
- 方案：
  - `src/components/zhi/home-page.tsx` 改为 Server Component。
  - 仅将交互部分作为 client islands：
    - Feed 筛选与点赞逻辑。
    - Hero shuffle 动画逻辑。
    - 侧栏交互（如语言切换/主题切换）。
- 好处：显著降低首屏 JS 解析与执行。

### 2.2 动效保留但延迟加载（Framer Motion）
- 目标：减少首屏 JS bundle 大小，保留动画。
- 方案：
  - 使用 `LazyMotion` + `domAnimation` 按需加载 motion features。
  - 对 Hero shuffle 动效使用 `dynamic import`，首屏先渲染静态组件。
  - 仅在 hero grid 可见或 LCP 后加载 motion 逻辑。
  - 避免 `layout` 大范围触发布局计算，必要时改为 `layout="position"` 或纯 `transform` 动画。

### 2.3 将重交互组件改为“点击后才加载”
- 目标：减少初始 JS 与 HTML 体积。
- 方案：
  - `ZhiMomentDetail`、`ZhiShareCard` 等详情组件改为点击后 `dynamic import`。
  - 仅首屏可见卡片渲染完整组件，其他使用轻量占位。

---

## 3. HTML 与数据体积优化
### 3.1 减少首页一次性渲染的 feed 数量
- 现状：首屏加载 feed 数据过多，导致 HTML 内联 JSON 膨胀。
- 方案：
  - `src/app/[locale]/page.tsx` 中 `listMoments` / `listPublishedPostSummaries` / `listCuratedItems` 的 `limit` 降到首屏可见数量（建议 6~8）。
  - 剩余数据使用“加载更多”或分页（客户端拉取）。

### 3.2 精简首屏 feed 的字段
- 方案：
  - 仅传首图、标题、摘要、日期。
  - 多图/视频等细节延后到详情弹层加载。
  - `moment.images` 只保留第一张用于卡片。

---

## 4. 图片优化（保留视觉与动画）
### 4.1 R2 图片缓存策略
- 对 R2 资源设置长期缓存：
  - `Cache-Control: public, max-age=31536000, immutable`。
- 确保 Cloudflare `cf-cache-status` 能命中。

### 4.2 Hero 图片策略
- LCP 图使用更高质量（保持视觉）。
- 非 LCP 图使用低质量或较小尺寸（不影响体验）。
- 允许 hover/动效保留，但加载优先级降级。

### 4.3 视觉保留但减少主线程负载
- 对动画只使用 `transform/opacity`，避免 `box-shadow` 或会触发 layout 的属性。
- 添加 `will-change: transform`，但只对少量元素使用。

---

## 5. 缓存与 CDN（Cloudflare 侧）
### 5.1 让首页具备可缓存属性
- 修复 `cache-control: private, no-store` 的问题：
  - 确保首页不触发 `cookies()`/`headers()` 等动态标记。
  - 如无需用户特定内容，将首页设置为 `force-static`/ISR（如 `revalidate=60`）。
- Cloudflare Cache Rules：
  - `cache everything` for `/` 和 `/zh`。
  - 排除 `/admin/*` `/api/*` `/login` 等路径。
  - 对带登录 cookie 的请求设置 bypass。

### 5.2 开启 SWR / Stale-While-Revalidate
- 推荐 header：
  - `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`。
- 目标：让边缘节点持续输出快速响应，同时后台刷新。

---

## 6. 字体与 CSS 优化
### 6.1 字体加载策略
- 首屏仅保留 1~2 个字体高优先级加载。
- 其余字体 `preload: false`，通过 `font-display: swap` 延迟加载。
- 确保首屏文字只使用一个字体族，减少字体阻塞。

### 6.2 CSS 体积控制
- 检查 Tailwind 生成 CSS 是否包含无用样式。
- 拆分首页 CSS 与非首页 CSS（按路由分块）。

---

## 7. 其他脚本与安全挑战
### 7.1 Cloudflare JS Challenge
- 如果首页不需要挑战，可为 `/` 配置规则跳过 `jsd` challenge。
- 仅对高风险路径（登录/表单）保留挑战。

### 7.2 分析与第三方脚本延后
- 所有分析脚本 `defer/async`，并延迟到交互后加载。
- 推荐在 LCP/TTI 后或首次用户交互后执行。

---

## 8. 监控与验证
### 8.1 必要的性能指标
- Web Vitals（LCP/INP/TBT/CLS/TTFB）+ 分国家/设备分析。
- 重点监控 `/` 的变化趋势与回归。

### 8.2 验证步骤
- Lighthouse：移动端模拟 4x CPU + 4G 网络。
- Cloudflare 性能报告：对比修复前后 7 天趋势。
- 真实用户 RUM（建议 Cloudflare Browser Insights 或自建）。

---

## 9. 实施优先级建议
1) 首屏 LCP 资源管理（1~2 天）
2) 拆分 client islands + 动画延迟初始化（2~3 天）
3) feed 数据与 HTML 体积优化（1~2 天）
4) CDN 缓存规则 + SWR（半天）
5) 字体与 CSS 调整（半天）

---

## 10. 需要你确认的参数
- 首页初始 feed 数量（建议 6~8）。
- Hero grid 初始显示图片数量（建议 4~6）。
- 允许的缓存时长（建议 s-maxage=60，SWR=300）。
- 是否允许首页跳过 Cloudflare JS Challenge。

---

## 备注（不删动画的关键原则）
- 动画不移除，只是延后启动。
- 动画只做 `transform/opacity`，避免 layout 计算。
- 动画在 LCP 后启动，确保性能评分改善。
