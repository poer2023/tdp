---
name: tdp-pre-commit-check
description: Use before committing code in TDP project to prevent CI failures. Triggers when preparing to commit, push, or create PR. Catches lint errors, TypeScript errors, console.log statements, unused imports, and SSR/hydration issues that cause CI failures.
---

# TDP Pre-Commit Check

## Overview

Prevents CI failures by running local checks before committing. Based on analysis of 734+ commits where 54% were fixes, many caused by preventable CI failures.

## Workflow

```
Start → Quick Checks → Lint → TypeScript → SSR Safety → [Optional: Build/Test] → Commit
```

### Phase 1: Quick Checks (30 seconds)

**Check for console.log** (project forbids it):
```bash
grep -r "console\.log" --include="*.ts" --include="*.tsx" src/ | grep -v "__tests__" | head -10
```
Fix: Replace with `console.warn` or `console.error`.

**Check for unused imports**:
```bash
pnpm lint 2>&1 | grep -E "no-unused-vars" | head -5
```
Fix: Remove import or prefix with `_`.

### Phase 2: Lint Check

```bash
pnpm lint
```

Auto-fix: `pnpm lint:fix`

| Error | Fix |
|-------|-----|
| `no-unused-vars` | Remove or prefix with `_` |
| `console` | Use `console.warn`/`console.error` |
| `react-hooks/exhaustive-deps` | Add missing deps to useEffect |
| `@next/next/no-img-element` | Use `next/image` |

### Phase 3: TypeScript Check

```bash
pnpm type-check
```

| Error | Fix |
|-------|-----|
| `Property does not exist` | Add type or use `?.` |
| `Type not assignable` | Fix type or add assertion |
| `Cannot find module` | Check path, use `@/` prefix |

### Phase 4: SSR Safety Check

```bash
grep -rn "window\." --include="*.tsx" src/components/ | grep -v "typeof window" | head -5
```

**Common SSR issues:**
- `window`/`document` - Wrap in useEffect or check `typeof window`
- `IntersectionObserver` - Default state to `true`, add fallback
- `useSession` - DO NOT use in public components (hydration error)

**Pattern for IntersectionObserver:**
```typescript
const [isVisible, setIsVisible] = useState(true); // SSR default

useEffect(() => {
  if (typeof IntersectionObserver === 'undefined') return;
  // ... observer logic
}, []);
```

### Phase 5: Build Check (Optional, 3-5 min)

```bash
pnpm build
```

If database error: Add `export const dynamic = 'force-dynamic'` to page.

### Phase 6: Test Check (If modified logic)

```bash
pnpm test:run              # Unit tests
pnpm test:integration      # If touched database/API
```

## Quick Commands

```bash
# Minimum before commit
pnpm lint && pnpm type-check

# Full check before PR
pnpm lint && pnpm type-check && pnpm test:run && pnpm build

# Auto-fix
pnpm lint:fix && pnpm format
```

## CI Failed Despite Local Pass?

1. **Node version** - CI uses Node 22
2. **Missing env vars** - CI needs `CREDENTIAL_ENCRYPTION_KEY`
3. **Database pages** - Add `export const dynamic = 'force-dynamic'`
4. **Cached deps** - Run `pnpm install --frozen-lockfile`

## Red Flags

Stop and fix if thinking:
- "I'll fix lint after pushing" → NO
- "Just one console.log" → NO, CI fails
- "TypeScript error but it works" → NO, build fails
