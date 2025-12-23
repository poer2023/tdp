# ISR 性能优化完整报告

> 完成日期: 2025-12-23

## 优化概述

本次优化分三轮执行，共完成 **20+ 项** 性能改进，**不改变任何 UI 外观和交互**。

---

## 第一轮：核心 ISR 优化

### 1. 首页 ISR 恢复

| 文件 | 修改 |
|------|------|
| `src/app/[locale]/page.tsx` | 移除 `auth()` 调用，`listMoments` 不传 `viewerId` |
| `src/app/api/moments/likes/route.ts` | **新增** 批量点赞状态 API |
| `src/hooks/use-moment-likes.ts` | **新增** 客户端点赞状态 hook（localStorage 缓存） |
| `src/components/zhi/feed.tsx` | 集成 `useMomentLikes` 补齐点赞状态 |

### 2. Moments 页面静态化

| 文件 | 修改 |
|------|------|
| `src/app/[locale]/m/page.tsx` | `force-dynamic` → `ISR 60s`，移除 `auth()` |
| `src/app/[locale]/m/particles-moments-content.tsx` | 客户端 `useSession` 判断管理员 |

### 3. 服务端缓存层

| 文件 | 缓存配置 |
|------|----------|
| `src/lib/posts.ts` | `listPublishedPostSummaries` - 60s TTL + tags |
| `src/lib/dashboard-stats.ts` | `getDashboardStats` - 300s TTL |
| `src/lib/gallery.ts` | `listGalleryImagesWithLocation` - 300s TTL |

### 4. 依赖清理

- 卸载 `crypto-js` 和 `@types/crypto-js`（已替换为 Web Crypto API）

---

## 第二轮：深度优化

### 1. About 页面 ISR

```diff
-export const dynamic = "force-dynamic";
-export const revalidate = 0;
+export const dynamic = "auto";
+export const revalidate = 60;
```

### 2. `listMoments` 智能缓存

```typescript
// 对简单查询使用缓存（无 cursor/tag/q/viewerId）
const getCachedPublicMoments = unstable_cache(
  _fetchPublicMomentsCached,
  ["moments-public-list"],
  { revalidate: 60, tags: [MOMENTS_PUBLIC_TAG] }
);

export async function listMoments(options?) {
  const isCacheable = !options?.cursor && !options?.tag && !options?.q && !options?.viewerId;
  if (isCacheable) {
    return getCachedPublicMoments(options?.limit, options?.visibility, options?.lang);
  }
  return _fetchMoments(options); // 直连 DB
}
```

### 3. Moment 详情页 ISR

```diff
-export const revalidate = 0;
+// ISR: 60s for public/unlisted, auth only for private
+export const revalidate = 60;

 if (m.visibility === "PRIVATE") {
   const session = await auth(); // 仅私密时调用
   ...
 }
```

### 4. Gallery 即时更新

在 `addGalleryImage`, `updateGalleryImage`, `deleteGalleryImage` 中添加：
```typescript
revalidateTag(GALLERY_TAG, "max");
```

### 5. 匿名用户优化

```typescript
// useMomentLikes 短路
const { status } = useSession();
if (!isAuthenticated) {
  setIsLoading(false);
  localStorage.removeItem(CACHE_KEY);
  return; // 不发网络请求
}
```

---

## 第三轮：进阶优化

### 1. Dashboard 缓存即时失效

在媒体同步完成后立即失效 Dashboard 缓存，无需等待 TTL 过期：

```typescript
// src/lib/media-sync/index.ts
// 在 syncBilibili, syncDouban, syncSteam 成功后调用
if (successCount > 0) {
  revalidateTag("dashboard", "max");
}
```

### 2. 首页数据缓存

| 文件 | 优化 |
|------|------|
| `src/lib/hero.ts` | `listHeroImages` 使用 `unstable_cache`，60s TTL + `hero-images` tag |
| `src/lib/curated.ts` | **新增** `listCuratedItems`，60s TTL + `curated-items` tag |
| `src/app/[locale]/page.tsx` | 使用缓存版本的函数，降低 ISR 重建 DB 负载 |

### 3. Image Proxy CPU 优化

在 `src/app/api/uploads/[...path]/route.ts` 中添加智能跳过逻辑：

```typescript
// 当无需转换时跳过 sharp 处理
function isNoOpTransform(mime: string, options: TransformOptions): boolean {
  const hasResize = Boolean(options.width || options.height);
  const hasQuality = Boolean(options.quality);
  const hasFormatChange = Boolean(options.format) && options.format !== mimeToFormat(mime);
  return !hasResize && !hasQuality && !hasFormatChange;
}

// applyTransform 开头
if (isNoOpTransform(mime, options)) {
  return { buffer, mime }; // 直接返回原图
}
```

---

## 第四轮：完整缓存失效与 ISR 覆盖

### 1. Archive/Feed/RSS/Sitemap ISR 化

将以下路由从 `force-dynamic` 改为 ISR 60s：

| 路由 | 修改 |
|------|------|
| `/[locale]/m/archive` | `revalidate = 60` |
| `/[locale]/m/feed.json` | `revalidate = 60` |
| `/[locale]/m/rss.xml` | `revalidate = 60` |
| `/[locale]/m/sitemap.xml` | `revalidate = 60` |
| `/m/archive` | `revalidate = 60` |
| `/m/feed.json` | `revalidate = 60` |
| `/m/rss.xml` | `revalidate = 60` |
| `/m/sitemap.xml` | `revalidate = 60` |

### 2. Hero 图片缓存失效

在 Hero 图片管理 API 中添加即时失效：

```typescript
// POST/PUT/DELETE 成功后
revalidateTag(HERO_IMAGES_TAG, "max");
```

### 3. Moments 删除/恢复/清理缓存失效

在 `softDeleteMoment`, `restoreMoment`, `purgeMoment` 后添加：

```typescript
revalidatePath("/m");
revalidatePath("/zh/m");
revalidateTag(MOMENTS_PUBLIC_TAG, "max");
```

### 4. Posts 删除缓存失效

```typescript
export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
  revalidateTag(POSTS_PUBLIC_TAG, "max"); // 新增
}
```

### 5. 文章列表页缓存优化

```diff
-const allPosts = await listPublishedPosts(); // 无缓存
+const allPosts = await listPublishedPostSummaries(); // 60s 缓存
```

---

## ISR 配置总结

| 页面 | revalidate | 备注 |
|------|------------|------|
| `/` (首页) | 60s | 内部数据通过 `unstable_cache` 缓存 |
| `/[locale]/m` | 60s | 管理员按钮客户端判断 |
| `/[locale]/m/[id]` | 60s | 私密内容仍需 auth |
| `/[locale]/m/archive` | 60s | 按查询参数缓存 |
| `/[locale]/m/feed.json` | 60s | JSON Feed |
| `/[locale]/m/rss.xml` | 60s | RSS Feed |
| `/[locale]/m/sitemap.xml` | 60s | Sitemap |
| `/[locale]/posts` | 60s | 使用缓存摘要接口 |
| `/[locale]/about` | 60s | `getLiveHighlightsData` 已缓存 |
| `/[locale]/about/live` | 60s | Dashboard 数据 300s 缓存 |
| `/[locale]/gallery` | 300s | 限制 100 张图片 |
| `/[locale]/gallery/map` | 300s | Location 数据 300s 缓存 |

---

## 预期性能提升

| 场景 | 优化前 | 优化后 |
|------|--------|--------|
| 首页 TTFB（缓存命中） | ~3s | < 100ms |
| Moments 列表 TTFB | ~1s | < 100ms |
| Moment 详情（公开） | 每次查询 DB | ISR 60s |
| 匿名用户首页 | 发起 likes API 请求 | 不发请求 |
| Gallery 更新后 | 等待 TTL 过期 | 立即生效 |
| Dashboard 同步后 | 等待 300s TTL | 立即生效 |
| 首页 ISR 重建 | 4 次 DB 查询 | 缓存命中 |
| 已优化 WebP 请求 | sharp 处理 | 直接返回 |
| Hero 图片更新 | 等待 60s TTL | 立即生效 |
| Moments 删除/恢复 | 等待 60s TTL | 立即生效 |
| Posts 删除 | 等待 60s TTL | 立即生效 |
| Archive/Feed/RSS | force-dynamic | ISR 60s |

---

## 新增/修改文件清单

### 新增文件
- `src/app/api/moments/likes/route.ts`
- `src/hooks/use-moment-likes.ts`
- `src/lib/curated.ts`

### 修改文件
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/about/page.tsx`
- `src/app/[locale]/m/page.tsx`
- `src/app/[locale]/m/[id]/page.tsx`
- `src/app/[locale]/m/archive/page.tsx`
- `src/app/[locale]/m/feed.json/route.ts`
- `src/app/[locale]/m/rss.xml/route.ts`
- `src/app/[locale]/m/sitemap.xml/route.ts`
- `src/app/[locale]/m/particles-moments-content.tsx`
- `src/app/[locale]/posts/page.tsx`
- `src/app/m/page.tsx`
- `src/app/m/archive/page.tsx`
- `src/app/m/feed.json/route.ts`
- `src/app/m/rss.xml/route.ts`
- `src/app/m/sitemap.xml/route.ts`
- `src/app/api/admin/hero/route.ts`
- `src/app/api/admin/hero/[id]/route.ts`
- `src/components/zhi/feed.tsx`
- `src/lib/posts.ts`
- `src/lib/moments.ts`
- `src/lib/gallery.ts`
- `src/lib/dashboard-stats.ts`
- `src/lib/hero.ts`
- `src/lib/media-sync/index.ts`
- `src/app/api/uploads/[...path]/route.ts`
