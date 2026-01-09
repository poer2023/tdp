# Gallery 组件性能优化方案（基于现状校验）

> 本文基于当前代码实现复核后给出“最优解”，优先级按用户体验收益与改动成本排序。

---

## 现状核对（基于代码）

- Grid 已使用 `SmoothImage`（Next/Image）+ 自定义 loader + `sizes`，走 `/api/uploads` 与 `/api/image-proxy`，具备 WebP 与响应式宽度能力。
- Grid 仍是手工列分配 + 全量渲染；页面层 `GALLERY_PAGE_LIMIT=100`，暂无虚拟化。
- Lightbox 主图为原生 `<img>`，没有 `srcset/sizes`；原图通过 XHR -> blob，但未复用 LRU 缓存。
- Lightbox 缩略条 `items.map` 全量渲染，无 windowing。
- LCP `priority` 基于 `colIndex * column.length + index`，列分配下会偏向第一列，不能稳定覆盖首屏。
- 缩略图 `loading="lazy"` 依赖 CSS 定宽/定高，未明确尺寸属性。

---

## 最优解（按优先级）

### P0：Lightbox 主图统一到响应式链路 + LRU 缓存

- 主图默认显示 `mediumPath`，通过 `buildImageUrl/buildImageSrcSet` 提供 `src` + `srcset`，并设置 `sizes="(min-width: 1024px) 55vw, 95vw"`。
- 仅在 `zoomLevel > 1` 或用户触发“高清”时才拉原图（XHR -> blob）。
- 复用现有 `useImageCache`（LRU=8）缓存 blob，避免来回切换重复下载。
- 当 `displaySrc` 为 blob 时保留 `<img>`；非 blob 状态使用 `srcset/sizes`，避免一次性下载原图。

### P0：LCP 优先级修正

- `priority` 改为按首屏“行数”或“索引”判断，例如 `index < columnCount * 2`，将高优先资源控制在 4-6 张以内。
- 仅 Grid 使用 `priority`，缩略图全部保持低优先级。

### P1：虚拟化策略（按规模触发）

- 当图片数量突破 100 或出现滚动卡顿时，Grid 使用 Masonic 虚拟化，overscan 1-2 行。
- Lightbox 缩略条使用 TanStack Virtual（水平列表），只渲染当前 ±N。

### P2：细节优化

- 缩略图补充明确尺寸（width/height 或 aspect-ratio），保留 `loading="lazy"` + `decoding="async"`。
- 相邻图预加载改用 `imageCache.preload`，复用缓存与去重逻辑。
- 如出现跨域直连图片再考虑 `preconnect`，使用 `/api/image-proxy` 场景不需要。

---

## 实施路径（建议）

### 阶段 1：高收益低风险
- Lightbox 主图响应式 `srcset/sizes` + 原图延迟加载
- 接入 `useImageCache` LRU
- 修正 Grid `priority` 计算逻辑

### 阶段 2：缩略条减负
- Lightbox 缩略条 windowing（TanStack Virtual）

### 阶段 3：Grid 虚拟化（视数据量）
- 引入 Masonic 并替换手动列分配

---

## 依赖选择

```bash
# Grid Masonry 虚拟化（阶段 3）
npm install masonic

# 缩略条 windowing（阶段 2）
npm install @tanstack/react-virtual
```

---

## 验收指标

- LCP：首屏图片命中高优先级，LCP 明显下降（优先观察移动端）
- DOM 规模：缩略条与 Grid 的节点数明显下降
- 滚动性能：长列表滚动无明显掉帧
- 网络：原图下载次数下降（LRU 命中率提升）

---

## 最佳实践依据

- https://web.dev/learn/performance/image-performance/
- https://web.dev/learn/performance/resource-hints
- https://web.dev/articles/virtualize-long-lists-react-window
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img

---

## 相关文件

- `src/components/zhi/gallery/gallery-grid.tsx`
- `src/components/zhi/gallery/gallery-lightbox.tsx`
- `src/components/zhi/gallery/hooks/use-gallery-image-loading.ts`
- `src/components/zhi/gallery/thumbnail-item.tsx`
- `src/components/ui/smooth-image.tsx`
- `src/lib/image-resize.ts`
- `src/app/api/image-proxy/route.ts`
- `src/hooks/use-image-cache.ts`
- `src/app/[locale]/gallery/page.tsx`
