---
name: tdp-gallery-changes
description: Use when modifying Gallery components, adding gallery features, or fixing gallery bugs. Triggers for files in src/components/gallery/, src/app/**/gallery/, or gallery-related issues like image loading, lightbox, masonry layout, Live Photos, video playback, or category switching.
---

# TDP Gallery Development

## Overview

Gallery is the most bug-prone module (12+ fixes in commit history). Common issues: image caching, category switching crashes, Live Photo handling, video playback, and SSR/hydration errors.

## File Structure

```
src/components/gallery/
├── gallery-card.tsx          # Card with metadata, Live Photo support
├── gallery-grid.tsx          # Simple grid layout
├── gallery-masonry.tsx       # CSS multi-column masonry
├── gallery-category-tabs.tsx # Category switching (ORIGINAL/REPOST/AI/MOMENT)
├── gallery-map.tsx           # MapLibre integration
└── gallery-map-wrapper.tsx   # Map client wrapper

src/app/[locale]/gallery/
├── page.tsx                  # Gallery listing
├── [id]/page.tsx             # Image detail/lightbox
└── map/page.tsx              # Map view
```

## Common Patterns

### 1. Image Source Priority

Always use thumbnail fallback chain:
```typescript
src={image.mediumPath || image.smallThumbPath || image.filePath}
```

### 2. Image Dimensions

Always provide width/height to prevent layout shift:
```typescript
const w = img.width || 1600;
const h = img.height || 1000;

<Image width={w} height={h} ... />
```

### 3. Live Photo Detection

```typescript
{image.isLivePhoto && image.livePhotoVideoPath ? (
  <LivePhotoPlayer
    imageSrc={image.filePath}
    videoSrc={image.livePhotoVideoPath}
    alt={image.title || "Photo"}
  />
) : (
  <Image ... />
)}
```

### 4. Priority Loading

First 6 images get priority (2 rows on desktop):
```typescript
const isPriority = index < 6;

<Image
  priority={isPriority}
  loading={isPriority ? undefined : "lazy"}
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
/>
```

## Critical Bug Patterns

### Image Caching Detection (commit b615193e)

**Problem:** `img.onload` doesn't fire for cached images.

**Fix:** Check `img.complete` before adding listener:
```typescript
const img = new Image();
img.src = url;

if (img.complete) {
  handleLoad();  // Already cached
} else {
  img.onload = handleLoad;
}
```

### Category Switching Crash (commit e15393ee)

**Problem:** Masonic grid crashes when category changes.

**Fix:** Add defensive null checks:
```typescript
if (!images?.length) return <EmptyState />;

{images.map((img) => {
  if (!img) return null;  // Defensive check
  return <GalleryCard key={img.id} image={img} />;
})}
```

### IntersectionObserver SSR (commit b7c0c194)

**Problem:** IntersectionObserver undefined in SSR.

**Fix:** Default to visible, add fallback:
```typescript
const [isInViewport, setIsInViewport] = useState(true); // SSR default

useEffect(() => {
  if (typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver(([entry]) => {
    setIsInViewport(entry.isIntersecting);
  });
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

### Video Playback (commits 86053e95, 82f5ab46)

**Problems:** Video not playing in lightbox, audio track stripped.

**Fixes:**
```typescript
<video
  controls
  autoPlay
  playsInline
  muted={false}  // Don't mute if has audio
  src={videoPath}
/>
```

### Animation Performance (commit fc08feef)

**Problem:** INP 2976ms on image switching.

**Fix:** Use Spring physics, avoid heavy re-renders:
```typescript
transition={{ type: "spring", stiffness: 300, damping: 30 }}
// Use useMotionValue for smooth transitions
```

## Checklist

### Before Starting
- [ ] Identify which component(s) to modify
- [ ] Check if change affects category switching
- [ ] Check if change affects image loading

### Image Loading
- [ ] Use thumbnail fallback chain
- [ ] Provide width/height for all images
- [ ] Handle `img.complete` for cached images
- [ ] Use priority loading for above-fold images

### SSR Safety
- [ ] IntersectionObserver has SSR fallback
- [ ] No direct window/document access
- [ ] useState lazy initializer for browser APIs

### Live Photo / Video
- [ ] Check `isLivePhoto && livePhotoVideoPath`
- [ ] Video has `playsInline` for mobile
- [ ] Audio track preserved

### Category Switching
- [ ] Null checks on image arrays
- [ ] Reset state on category change
- [ ] Handle empty state gracefully

## Quick Reference

| Task | Pattern |
|------|---------|
| Image src | `mediumPath \|\| smallThumbPath \|\| filePath` |
| Dimensions | `width={img.width \|\| 1600} height={img.height \|\| 1000}` |
| Live Photo | Check `isLivePhoto && livePhotoVideoPath` |
| Priority | First 6 images: `priority={index < 6}` |
| Empty state | `if (!images?.length) return <EmptyState />` |
| SSR observer | `useState(true)` + check `typeof IntersectionObserver` |
