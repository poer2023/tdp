---
name: tdp-merge-to-main
description: Use before merging feature branch to main or after merge when CI fails. Triggers when preparing PR, merging branches, or fixing post-merge CI failures. Covers pre-merge checks, common CI failures, and emergency fixes.
---

# TDP Merge to Main

## Overview

Merging to main often causes CI failures that require immediate fixes. This skill provides pre-merge checklist and common post-merge fixes based on project history.

## Pre-Merge Checklist

Run ALL checks on feature branch before merging:

```bash
# 1. Sync with main first
git fetch origin main
git rebase origin/main  # or merge

# 2. Run full verification
pnpm lint && pnpm type-check && pnpm test:run && pnpm build

# 3. If touched database/API code
pnpm test:integration
```

### Quick Verification Script

```bash
# All-in-one pre-merge check
pnpm lint && \
pnpm type-check && \
pnpm test:run && \
pnpm build && \
echo "✅ Ready to merge"
```

## Common Post-Merge CI Failures

### 1. ESLint Errors (most common)

**Symptoms:** CI fails on lint step

**Quick fix:**
```bash
pnpm lint:fix
git add -A && git commit -m "fix: resolve lint errors"
git push
```

### 2. Sitemap Cache Issues (commits 77e543dc, abc848d6)

**Symptoms:** E2E sitemap tests fail in CI but pass locally

**Cause:** Next.js caches sitemap routes, CI gets stale data

**Fix:** Add dynamic export to sitemap routes:
```typescript
// src/app/sitemap.xml/route.ts
export const dynamic = 'force-dynamic';
```

### 3. Database-Dependent Pages (commits 447612ec, bc0adca7)

**Symptoms:** Build fails with database connection errors

**Cause:** Pages try to fetch data at build time without database

**Fix:** Add dynamic export:
```typescript
// Any page that fetches from database
export const dynamic = 'force-dynamic';
```

**Common pages needing this:**
- `src/app/[locale]/posts/page.tsx`
- `src/app/[locale]/gallery/page.tsx`
- `src/app/[locale]/moments/page.tsx`
- Archive pages

### 4. Missing Environment Variables (commit 447612ec)

**Symptoms:** Tests fail with encryption/credential errors

**Cause:** CI missing `CREDENTIAL_ENCRYPTION_KEY`

**Fix:** Ensure CI workflow has:
```yaml
env:
  CREDENTIAL_ENCRYPTION_KEY: ${{ secrets.CREDENTIAL_ENCRYPTION_KEY }}
```

### 5. pnpm-lock.yaml Sync (commit 605ea09e)

**Symptoms:** CI fails with dependency resolution errors

**Cause:** pnpm-lock.yaml out of sync after merge

**Fix:**
```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "fix: regenerate pnpm-lock.yaml"
git push
```

### 6. Import Path Errors (commit 46773573)

**Symptoms:** Module not found errors after component restructure

**Fix:** Update import paths, use `@/` prefix:
```typescript
// ❌ Old
import { Component } from '../../../components/Component';

// ✅ New
import { Component } from '@/components/Component';
```

### 7. Flaky E2E Tests (commit 8213b093)

**Symptoms:** E2E tests pass sometimes, fail sometimes

**Temporary fix:** Skip flaky test with comment:
```typescript
test.skip('flaky test name', async () => {
  // TODO: Fix timing issue
});
```

**Proper fix:** Investigate and fix the timing issue

## Emergency: CI Failed After Push

```bash
# 1. Check what failed
gh run view --log-failed

# 2. Common quick fixes
pnpm lint:fix                    # Lint errors
pnpm format                      # Formatting
pnpm install                     # Dependency sync

# 3. Commit fix
git add -A
git commit -m "fix: resolve CI failures"
git push
```

## Merge Workflow

### Option 1: Merge via PR (Recommended)

```bash
# 1. Push feature branch
git push -u origin feature/your-feature

# 2. Create PR
gh pr create --title "feat: your feature" --body "Description"

# 3. Wait for CI to pass, then merge via GitHub UI
```

### Option 2: Direct Merge (Fast)

```bash
# 1. Ensure all checks pass locally
pnpm lint && pnpm type-check && pnpm test:run && pnpm build

# 2. Merge to main
git checkout main
git pull origin main
git merge feature/your-feature

# 3. Push
git push origin main

# 4. Monitor CI
gh run watch
```

## Post-Merge Monitoring

```bash
# Watch CI status
gh run watch

# If failed, check logs
gh run view --log-failed

# View recent runs
gh run list --limit 5
```

## Checklist

### Before Merge
- [ ] Rebased/merged with latest main
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test:run` passes
- [ ] `pnpm build` passes
- [ ] Integration tests pass (if DB changes)

### After Merge (if CI fails)
- [ ] Check `gh run view --log-failed`
- [ ] Apply appropriate fix from above
- [ ] Push fix commit
- [ ] Verify CI passes

## Quick Reference

| CI Failure | Quick Fix |
|------------|-----------|
| Lint errors | `pnpm lint:fix` |
| Type errors | Fix types, check imports |
| Sitemap test | Add `export const dynamic = 'force-dynamic'` |
| Build DB error | Add `export const dynamic = 'force-dynamic'` |
| Dependency error | `pnpm install` + commit lock file |
| Import not found | Update to `@/` paths |
| Flaky E2E | `test.skip()` temporarily |
