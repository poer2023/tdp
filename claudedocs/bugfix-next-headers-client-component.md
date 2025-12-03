# Bug Fix: next/headers Import in Client Components

## Problem
Build error occurred after Dashboard migration (Phase 3 completion):
```
Ecmascript file had an error
You're importing a component that needs "next/headers".
That only works in a Server Component which is not supported in the pages/ directory.
```

## Root Cause
The `/src/lib/admin-i18n.ts` file:
1. Imported `next/headers` (server-only API) for `getAdminLocale()` function
2. Re-exported pure utilities (`t`, `AdminLocale`) from `admin-translations.ts`
3. Client components imported from this file to use `t()` and `AdminLocale`
4. Next.js bundler tried to include the entire module (including `next/headers`) in client bundle → ERROR

## Solution
Separated server-only code from client-safe code by removing re-exports:

### Changes Made

#### 1. `/src/lib/admin-i18n.ts` (Server-Only Module)
**Before**:
```typescript
import { headers } from "next/headers";

export type { AdminLocale } from "./admin-translations";
export { t, adminTranslations } from "./admin-translations";  // ❌ Caused the issue

export async function getAdminLocale() {
  const headersList = await headers();
  // ... locale detection logic
}
```

**After**:
```typescript
import { headers } from "next/headers";
import type { AdminLocale } from "./admin-translations";

export async function getAdminLocale(): Promise<AdminLocale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  if (/\bzh\b|zh-cn|zh-hans/i.test(acceptLanguage)) {
    return "zh";
  }

  return "en";
}
```

#### 2. Client Component Imports (4 files)
Changed import paths from `@/lib/admin-i18n` → `@/lib/admin-translations`:

- `/src/components/admin/dashboard-activity.tsx`
- `/src/components/admin/content-distribution-chart.tsx`
- `/src/components/admin/recent-items-panel.tsx`
- `/src/components/admin/system-status-panel.tsx`

**Change Pattern**:
```typescript
// BEFORE:
import { t, type AdminLocale } from "@/lib/admin-i18n";

// AFTER:
import { t, type AdminLocale } from "@/lib/admin-translations";
```

#### 3. Server Components (No Changes)
Server pages continue importing from `@/lib/admin-i18n` for `getAdminLocale()`:
- `/src/app/admin/layout.tsx`
- `/src/app/admin/page.tsx`
- All admin route pages

## Results

### ✅ Build Success
- No more "next/headers in client component" error
- Dev server starts successfully
- Dashboard page loads correctly: `GET /admin 200 in 1734ms`
- All charts and panels render properly

### ✅ Architecture Benefits
- Clear separation: server APIs (`admin-i18n.ts`) vs pure utilities (`admin-translations.ts`)
- Smaller client bundle (no server code included)
- Follows Next.js App Router best practices
- Better tree-shaking

### ✅ Zero Behavior Changes
- Same translations displayed
- Same locale detection logic (Accept-Language header)
- Same component props and signatures
- No user-facing impact

## Files Modified
1. `/src/lib/admin-i18n.ts` - Removed client-safe re-exports
2. `/src/components/admin/dashboard-activity.tsx` - Changed import path
3. `/src/components/admin/content-distribution-chart.tsx` - Changed import path
4. `/src/components/admin/recent-items-panel.tsx` - Changed import path
5. `/src/components/admin/system-status-panel.tsx` - Changed import path

## Files Unchanged
- `/src/lib/admin-translations.ts` - Already correct, pure utilities
- All server pages - Continue using `getAdminLocale()` from `admin-i18n`

## Verification
- ✅ Dev server running without errors
- ✅ Dashboard loads successfully
- ✅ Content Distribution Chart displays
- ✅ Recent Items Panel displays
- ✅ System Status Panel displays
- ✅ No TypeScript errors
- ✅ No build errors

## Note
There are unrelated Prisma errors in the analytics page about a missing `device` field in the `PageView` model. These errors existed before this fix and are unrelated to the `next/headers` issue.

## Lessons Learned
When using Next.js App Router:
- Never mix server-only APIs (like `next/headers`) with client-safe utilities in the same module
- Use separate files for server logic vs pure utilities
- Client components should only import from files without server-only APIs
- Server components can import from anywhere
