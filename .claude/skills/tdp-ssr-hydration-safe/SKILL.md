---
name: tdp-ssr-hydration-safe
description: Use when creating or modifying React components to ensure SSR/hydration safety. Triggers for hydration errors, window/document access, IntersectionObserver, localStorage, useSession usage, or any browser-only API usage in components.
---

# TDP SSR & Hydration Safety

## Overview

Next.js renders components on server first, then hydrates on client. Mismatches cause hydration errors. This skill prevents common SSR issues found in project history.

## The Golden Rule

```
Server render must produce identical HTML as initial client render
```

Any difference = hydration error.

## Common Patterns

### 1. Browser API Access

**Problem:** `window`, `document`, `localStorage` don't exist on server.

```typescript
// ❌ BAD - crashes on server
const width = window.innerWidth;

// ✅ GOOD - lazy initializer
const [width, setWidth] = useState(() => {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth;
});

// ✅ GOOD - useEffect for updates
useEffect(() => {
  setWidth(window.innerWidth);
}, []);
```

### 2. IntersectionObserver (commit b7c0c194)

**Problem:** IntersectionObserver undefined on server, causes crash.

```typescript
// ❌ BAD - crashes on server
const [visible, setVisible] = useState(false);
useEffect(() => {
  const observer = new IntersectionObserver(...);  // May crash
}, []);

// ✅ GOOD - default true + fallback
const [visible, setVisible] = useState(true);  // SSR default

useEffect(() => {
  if (typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(([entry]) => {
    setVisible(entry.isIntersecting);
  });

  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

### 3. Media Queries (commit from use-tilt.ts fix)

**Problem:** `matchMedia` doesn't exist on server.

```typescript
// ❌ BAD - crashes on server
const [prefersReducedMotion, setPrefersReducedMotion] = useState(
  window.matchMedia('(prefers-reduced-motion)').matches
);

// ✅ GOOD - lazy initializer with SSR check
const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

useEffect(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

### 4. useSession (commits 4288ce6f, 921f23c5)

**Problem:** `useSession` in public components causes hydration mismatch.

```typescript
// ❌ BAD - in public component (Header, Footer, etc.)
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();  // Hydration error!
  return <div>{session?.user?.name}</div>;
}

// ✅ GOOD - use server component or pass session as prop
// Option 1: Server Component
import { auth } from '@/lib/auth';

export async function Header() {
  const session = await auth();
  return <div>{session?.user?.name}</div>;
}

// Option 2: Client component with prop
export function Header({ session }: { session: Session | null }) {
  return <div>{session?.user?.name}</div>;
}
```

### 5. Date/Time Formatting

**Problem:** Server and client may have different timezones.

```typescript
// ❌ BAD - may differ between server/client
const time = new Date().toLocaleString();

// ✅ GOOD - use consistent formatting
import { formatDate } from '@/lib/date-utils';
const time = formatDate(date, locale);

// ✅ GOOD - or render only on client
const [time, setTime] = useState<string>();
useEffect(() => {
  setTime(new Date().toLocaleString());
}, []);
```

### 6. Random Values

**Problem:** Random values differ between server and client.

```typescript
// ❌ BAD - hydration mismatch
const id = Math.random().toString(36);

// ✅ GOOD - use useId hook
import { useId } from 'react';
const id = useId();

// ✅ GOOD - or generate on client only
const [id, setId] = useState<string>();
useEffect(() => {
  setId(Math.random().toString(36));
}, []);
```

### 7. Dynamic Imports for Client-Only

```typescript
// For components that can't run on server at all
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('@/components/gallery/gallery-map'),
  { ssr: false }
);

// With loading state
const Chart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64" />
  }
);
```

## Quick Checklist

### Before Creating Component
- [ ] Does it use browser APIs? → Use lazy initializer or useEffect
- [ ] Does it use IntersectionObserver? → Add fallback
- [ ] Does it use useSession? → Use server component instead
- [ ] Does it render dates/times? → Use consistent formatting
- [ ] Does it use random values? → Use useId or client-only

### Fixing Hydration Errors
1. Check browser console for "Hydration failed" or "Text content mismatch"
2. Identify the differing content
3. Apply appropriate pattern from above
4. Test with `pnpm build && pnpm start` (dev mode hides some issues)

## Pattern Summary

| API | SSR-Safe Pattern |
|-----|------------------|
| `window.*` | `typeof window === 'undefined' ? fallback : window.*` |
| `document.*` | Use in useEffect only |
| `localStorage` | `typeof window === 'undefined'` check |
| `IntersectionObserver` | `useState(true)` + `typeof IntersectionObserver` check |
| `matchMedia` | Lazy initializer with SSR check |
| `useSession` | Server component or pass as prop |
| Dates | Use `formatDate()` utility |
| Random | Use `useId()` hook |
| Heavy libraries | `dynamic(() => import(...), { ssr: false })` |

## Testing SSR Safety

```bash
# Dev mode may hide SSR issues - always test production build
pnpm build && pnpm start

# Check for hydration warnings in browser console
# Look for: "Hydration failed" or "did not match"
```
