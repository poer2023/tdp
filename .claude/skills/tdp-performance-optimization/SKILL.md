---
name: tdp-performance-optimization
description: Use when optimizing performance, fixing Core Web Vitals issues, or improving page load speed. Triggers for LCP, INP, TBT, CLS issues, slow animations, large bundles, font loading, image optimization, or Lighthouse audits.
---

# TDP Performance Optimization

## Overview

17+ performance commits in project history. Focus areas: LCP (hero images), INP (animations), TBT (JavaScript), fonts, and hydration. This skill covers proven optimization patterns.

## Core Web Vitals Targets

| Metric | Target | What it measures |
|--------|--------|------------------|
| LCP | < 2.5s | Largest Contentful Paint (hero image) |
| INP | < 200ms | Interaction to Next Paint (click response) |
| CLS | < 0.1 | Cumulative Layout Shift (visual stability) |
| TBT | < 200ms | Total Blocking Time (JS execution) |

## LCP Optimization

### Hero Image (commits 8cd0d29f, 74dd07ff)

```typescript
// ✅ Priority loading for hero
<Image
  src={heroImage}
  priority={true}
  sizes="100vw"
  alt="Hero"
/>
```

### R2/CDN Images (commit cf22196d)

```typescript
// ❌ BAD - routing through image proxy adds latency
src="/api/image-proxy?url=..."

// ✅ GOOD - direct CDN URL
src="https://cdn.yourdomain.com/images/hero.webp"
```

### Above-fold Priority (commit from gallery-card.tsx)

```typescript
// First 6 images get priority (2 rows on desktop)
const isPriority = index < 6;

<Image
  priority={isPriority}
  loading={isPriority ? undefined : "lazy"}
/>
```

## INP Optimization

### Animation Performance (commit fc08feef)

**Problem:** INP 2976ms on gallery image switching

**Fix:** Use Spring physics, avoid setState in loops:
```typescript
// ❌ BAD - heavy re-renders
onClick={() => {
  setIndex(newIndex);
  setLoading(true);
  setTransition(true);
}}

// ✅ GOOD - single state update, spring animation
import { useMotionValue, useSpring } from 'framer-motion';

const x = useMotionValue(0);
const springX = useSpring(x, { stiffness: 300, damping: 30 });
```

### Delay Non-Critical Animations (commit 9f3fc378)

```typescript
// ❌ BAD - animation starts immediately
useEffect(() => {
  startShuffleAnimation();
}, []);

// ✅ GOOD - delay startup (5s for hero)
useEffect(() => {
  const timer = setTimeout(() => {
    startShuffleAnimation();
  }, 5000);
  return () => clearTimeout(timer);
}, []);
```

## TBT Optimization

### LazyMotion (commit 787864fe)

```typescript
// ❌ BAD - loads all framer-motion features
import { motion } from 'framer-motion';

// ✅ GOOD - lazy load only needed features
import { LazyMotion, domMax, m } from 'framer-motion';

function App() {
  return (
    <LazyMotion features={domMax} strict>
      <m.div animate={{ opacity: 1 }} />
    </LazyMotion>
  );
}
```

### Dynamic Imports for Heavy Libraries (commit 26e92a9e)

```typescript
// ❌ BAD - loads recharts in main bundle
import { AreaChart } from 'recharts';

// ✅ GOOD - lazy load
import dynamic from 'next/dynamic';

const AreaChart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart),
  { ssr: false, loading: () => <Skeleton className="h-64" /> }
);
```

### Remove SessionProvider (commit 4288ce6f)

```typescript
// ❌ BAD - SessionProvider in root layout adds JS to every page
<SessionProvider>
  <App />
</SessionProvider>

// ✅ GOOD - use server-side auth, pass session as prop
// Or only wrap admin routes that need it
```

## Font Optimization (commit 483e41ef)

```typescript
// next.config.ts - use variable fonts
import { GeistSans, GeistMono } from 'geist/font';

// In layout
<body className={`${GeistSans.variable} ${GeistMono.variable}`}>
```

```css
/* Preload critical fonts */
@font-face {
  font-family: 'Geist';
  font-display: swap; /* Prevent FOIT */
}
```

## Image Optimization

### Blur Placeholder (commit 6bb4b6d5)

```typescript
<Image
  src={imagePath}
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR..."
/>
```

### Proper Sizes Attribute

```typescript
// ❌ BAD - browser downloads largest image
<Image src={img} fill />

// ✅ GOOD - browser picks right size
<Image
  src={img}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### WebP Thumbnails

```typescript
// Always prefer optimized thumbnails
src={image.mediumPath || image.smallThumbPath || image.filePath}
```

## Hydration Optimization (commit 0e9edff1)

```typescript
// ❌ BAD - hydration mismatch causes re-render
const time = new Date().toLocaleString();

// ✅ GOOD - consistent server/client render
const [time, setTime] = useState<string>();
useEffect(() => {
  setTime(new Date().toLocaleString());
}, []);
```

## Video Optimization (commit 49fdea18)

```typescript
<video
  preload="metadata"      // Don't preload full video
  playsInline             // Mobile optimization
  poster={thumbnailPath}  // Show image while loading
>
  <source src={videoPath} type="video/mp4" />
</video>
```

## Measuring Performance

### Lighthouse

```bash
# Run Lighthouse audit
npx lighthouse https://yoursite.com --view

# Or use Chrome DevTools > Lighthouse tab
```

### Chrome DevTools

1. **Performance tab** - Record and analyze
2. **Network tab** - Check waterfall
3. **Coverage tab** - Find unused JS/CSS

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true pnpm build
```

## Quick Checklist

### Images
- [ ] Hero image has `priority={true}`
- [ ] Above-fold images (first 6) have priority
- [ ] All images have `sizes` attribute
- [ ] Using WebP thumbnails where available
- [ ] Blur placeholder for better perceived performance

### JavaScript
- [ ] Heavy libraries dynamically imported
- [ ] Using LazyMotion for framer-motion
- [ ] No SessionProvider in root layout
- [ ] Non-critical animations delayed

### Animations
- [ ] Using Spring physics (not duration-based)
- [ ] Using useMotionValue for smooth transitions
- [ ] No setState in animation loops
- [ ] Delay non-critical animations (3-5s)

### Fonts
- [ ] Using variable fonts
- [ ] font-display: swap
- [ ] Preloading critical fonts

## Quick Reference

| Issue | Solution |
|-------|----------|
| Slow LCP | `priority={true}` on hero, direct CDN URLs |
| High INP | Spring animations, useMotionValue |
| High TBT | LazyMotion, dynamic imports |
| Layout shift | Provide width/height, blur placeholder |
| Large bundle | Dynamic imports, tree shaking |
| Slow fonts | Variable fonts, font-display: swap |
