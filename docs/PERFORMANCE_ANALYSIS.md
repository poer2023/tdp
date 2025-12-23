# 性能分析报告

> 分析日期: 2025-12-23
> 更新日期: 2025-12-23 (第二次优化)

## 1. ISR 配置修改

### 已修改文件

#### `src/app/layout.tsx`
```diff
-export const dynamic = "force-dynamic";
+// ISR: Allow Next.js to auto-detect caching strategy
+export const dynamic = "auto";
```

#### `src/app/page.tsx`
```diff
-// Keep root page config aligned with localized page; force dynamic to avoid build-time DB
+// ISR: Revalidate every 60 seconds for fresh content with CDN caching
 export const runtime = "nodejs";
-export const dynamic = "force-dynamic";
-export const revalidate = 0;
+export const dynamic = "auto";
+export const revalidate = 60;
 export const dynamicParams = false;
-export const dynamicIO = true;
```

#### `src/app/[locale]/gallery/page.tsx`
```diff
-// Force dynamic to avoid DB during build pipelines without DATABASE_URL
-export const dynamic = "force-dynamic";
-export const revalidate = 0;
-export const dynamicIO = true;
+// ISR: Revalidate every 5 minutes for gallery updates with CDN caching
+export const dynamic = "auto";
+export const revalidate = 300; // 5 minutes
+const GALLERY_PAGE_LIMIT = 100;
```

### ISR 生效状态

> ⚠️ **ISR 受限（首页）**
> 
> 首页仍显示为 Dynamic (ƒ)，原因是 `auth()` 调用读取了 cookies，导致 Next.js 无法预渲染页面。
> 
> **解决方案**：
> 1. 移除首页的 `auth()` 调用，或
> 2. 将需要认证状态的组件放入 Suspense 边界并在客户端获取

---

## 2. Bundle 体积分析

**总 Bundle 大小**: 2.52 MB (Parsed Size)

### Header/Hero/Feed 首屏组件体积

| 组件 | 源码大小 | Bundle 大小 | 占比 |
|------|----------|-------------|------|
| Header.tsx | 15.7 KB | 8.73 KB | 0.35% |
| Hero.tsx | 10.7 KB | 5.87 KB | 0.23% |
| Feed.tsx | 11.1 KB | 4.83 KB | 0.19% |
| **合计** | **37.5 KB** | **19.43 KB** | **0.77%** |

> ⚠️ **注意**：上述统计仅为组件源码体积。Hero 组件引入了 `framer-motion` (~113KB)，该依赖体积未计入组件源码统计。实际首屏依赖可能更大。

### 主要体积贡献者

| 依赖库 | 大小 | 说明 |
|--------|------|------|
| **React DOM** | ~570 KB | 核心框架，无法优化 |
| **Recharts** | 347.56 KB | 图表库，含 decimal.js, immer, buffer |
| **Leaflet** | 145 KB | 地图库 |
| **React Markdown** | 141 KB | Markdown 渲染 |
| **Framer Motion** | 113 KB | 动画库 (Hero 组件使用) |
| **Polyfills** | 112 KB | 浏览器兼容 |
| ~~**crypto-js**~~ | ~~50 KB~~ | ~~已替换为 Web Crypto API~~ ✅ |

---

## 3. Web Vitals 指标

### 测试结果汇总

| 指标 (ms) | 首页 | 文章列表 | 文章详情 |
|-----------|------|----------|----------|
| **TTFB** | 🔴 3130 | 🟡 931 | 🟢 533 |
| **LCP** | 🔴 3896 | 🟡 996 | 🟢 600 |
| **DOM Loaded** | 3827 | 957 | 565 |
| **Load Complete** | 4589 | 989 | 606 |

> ⛔ 首页 TTFB 高达 3.1 秒，LCP 接近 4 秒，严重影响用户体验！

---

## 4. 优化建议（按优先级排序）

### 🔴 P0 - 紧急修复

| 优化点 | 预期收益 | 实施难度 | 状态 |
|--------|----------|----------|------|
| **移除首页 `auth()` 调用** | TTFB ↓ 2-3s | 低 | 待处理 |
| **首页数据缓存策略优化** | TTFB ↓ 0.5-1s | 低 | 待处理 |

> 💡 首页数据已使用 `Promise.all` 并行获取，进一步优化应转向：减少 Prisma 查询字段、添加服务端缓存层。

### 🟡 P1 - 重要优化

| 优化点 | 预期收益 | 实施难度 | 状态 |
|--------|----------|----------|------|
| **Recharts 按需加载** | Bundle ↓ 350KB | 中 | 待处理 |
| **Leaflet 动态导入** | Bundle ↓ 145KB | 中 | 待处理 |
| **Hero Framer Motion 动态导入** | 首屏 JS ↓ 113KB | 中 | 待处理 |

### 🟢 P2 - 长期改进

| 优化点 | 预期收益 | 实施难度 | 状态 |
|--------|----------|----------|------|
| **React Markdown 替换为轻量方案** | Bundle ↓ 100KB | 高 | 待处理 |
| **CDN 边缘缓存** | TTFB ↓ 90% | 中 | 待处理 |

---

## 5. 本次已完成的优化

### ✅ 移除 x-locale Cookie 写入

**文件**: `middleware.ts`

**问题**: Middleware 在每次请求时写入 `x-locale` cookie，导致 CDN 无法有效缓存页面。

**修复**: 移除 cookie 写入，改用 URL 路径 + 请求头传递 locale 信息。

```diff
-  res.cookies.set("x-locale", currentLocale, {...});
+  // Note: We no longer set x-locale cookie to preserve CDN caching.
+  // Locale is derived from the URL path (x-locale header is still set for server components).
```

### ✅ Image Proxy 支持 w/q 参数

**文件**: `src/app/api/image-proxy/route.ts`

**问题**: 自定义 loader 传入了 `w` 和 `q` 参数，但 proxy 未实际处理，导致仍传输大图。

**修复**: 根据 `w` 参数实际调用 sharp 进行图片缩放。

```diff
+const targetWidth = parseInt(searchParams.get("w") || "0", 10);
+const targetQuality = parseInt(searchParams.get("q") || "78", 10);
+
+if (targetWidth > 0 && targetWidth < 4000) {
+  sharpInstance = sharpInstance.resize(targetWidth, null, {
+    withoutEnlargement: true,
+    fit: "inside",
+  });
+}
```

### ✅ Gallery 页启用 ISR + 限制查询

**文件**: `src/app/[locale]/gallery/page.tsx`

**问题**: 
1. Gallery 页使用 `force-dynamic`，无缓存
2. `listGalleryImages` 无上限，数据量大时 TTFB 飙升

**修复**: 
1. 改为 ISR (`revalidate = 300`)
2. 添加 `GALLERY_PAGE_LIMIT = 100` 限制

### ✅ 替换 crypto-js 为 Web Crypto API

**文件**: `src/components/analytics-tracker.tsx`

**问题**: 使用 crypto-js 生成指纹，增加首屏 JS 体积 (~50KB) 与 CPU 开销。

**修复**: 替换为原生 Web Crypto API (`crypto.subtle.digest`)。

```diff
-import crypto from "crypto-js";
-return crypto.SHA256(fingerprintData).toString();

+async function sha256(message: string): Promise<string> {
+  const msgBuffer = new TextEncoder().encode(message);
+  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
+  return Array.from(new Uint8Array(hashBuffer))
+    .map((b) => b.toString(16).padStart(2, "0")).join("");
+}
```

---

## 附录

### 修复的 Suspense 边界问题

修复了以下页面缺少 Suspense 包裹导致构建失败的问题：

- `src/app/[locale]/about/live/media/page.tsx` - 用 Suspense 包裹 `MediaDetailPage`
- `src/app/[locale]/search/page.tsx` - 重构为服务端组件 + Suspense 包裹客户端内容

### Hero 图片预加载状态

Hero 组件已对前 4 张图片设置 `priority={true}`：

```tsx
// hero.tsx line 262
priority={sq.id < 4}
loading={sq.id < 4 ? "eager" : "lazy"}
```

此优化已覆盖，但 LCP 元素可能不是 Hero 图片，需进一步验证。

### 完整分析报告位置

- Client Bundle: `.next/analyze/client.html`
- Server Bundle: `.next/analyze/nodejs.html`
- Edge Bundle: `.next/analyze/edge.html`

### 生成分析报告命令

```bash
# 使用 webpack 模式运行 bundle analyzer
ANALYZE=true pnpm next build --webpack
```
