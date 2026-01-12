# TDP Project Guidelines

## Project Overview

TDP is a personal blog and life dashboard platform built with Next.js 16, React 19, and PostgreSQL.

## Project-Specific Skills

The following skills are available for this project. **Use the Read tool to load a skill when needed.**

### tdp-pre-commit-check

**Location:** `.claude/skills/tdp-pre-commit-check/SKILL.md`

**When to use:** Before committing code to prevent CI failures. Catches lint errors, type errors, console.log, unused imports, and SSR issues.

**How to invoke:**
1. Read the skill: `.claude/skills/tdp-pre-commit-check/SKILL.md`
2. Or run the script: `bash .claude/skills/tdp-pre-commit-check/scripts/pre-commit-check.sh`

### tdp-gallery-changes

**Location:** `.claude/skills/tdp-gallery-changes/SKILL.md`

**When to use:** When modifying Gallery components, adding gallery features, or fixing gallery bugs. Covers image loading, lightbox, masonry layout, Live Photos, video playback, and category switching.

**How to invoke:** Read the skill: `.claude/skills/tdp-gallery-changes/SKILL.md`

### tdp-ssr-hydration-safe

**Location:** `.claude/skills/tdp-ssr-hydration-safe/SKILL.md`

**When to use:** When creating or modifying React components to ensure SSR/hydration safety. Covers window/document access, IntersectionObserver, localStorage, useSession, dates, and browser-only APIs.

**How to invoke:** Read the skill: `.claude/skills/tdp-ssr-hydration-safe/SKILL.md`

### tdp-merge-to-main

**Location:** `.claude/skills/tdp-merge-to-main/SKILL.md`

**When to use:** Before merging feature branch to main or after merge when CI fails. Covers pre-merge checks, common CI failures (sitemap cache, database pages, lock file sync), and emergency fixes.

**How to invoke:** Read the skill: `.claude/skills/tdp-merge-to-main/SKILL.md`

### tdp-performance-optimization

**Location:** `.claude/skills/tdp-performance-optimization/SKILL.md`

**When to use:** When optimizing performance, fixing Core Web Vitals issues, or improving page load speed. Covers LCP (hero images), INP (animations), TBT (JavaScript bundles), CLS, fonts, image optimization, and Lighthouse audits.

**How to invoke:** Read the skill: `.claude/skills/tdp-performance-optimization/SKILL.md`

### tdp-prisma-patterns

**Location:** `.claude/skills/tdp-prisma-patterns/SKILL.md`

**When to use:** When writing Prisma queries, creating migrations, or fixing database issues. Covers N+1 queries, transactions, caching with unstable_cache, CI build failures, withDbFallback usage, and raw SQL queries.

**How to invoke:** Read the skill: `.claude/skills/tdp-prisma-patterns/SKILL.md`

### tdp-i18n-routing

**Location:** `.claude/skills/tdp-i18n-routing/SKILL.md`

**When to use:** When working with localization, multi-language routes, or locale-aware components. Covers [locale] params, PostLocale enum, language switcher, alternate URLs, and hreflang tags.

**How to invoke:** Read the skill: `.claude/skills/tdp-i18n-routing/SKILL.md`

### tdp-api-development

**Location:** `.claude/skills/tdp-api-development/SKILL.md`

**When to use:** When creating or modifying API routes. Covers route.ts files, NextRequest/NextResponse, auth checks, error handling, admin endpoints, and CRUD operations.

**How to invoke:** Read the skill: `.claude/skills/tdp-api-development/SKILL.md`

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev                    # Start dev server with Turbopack
pnpm build                  # Build for production

# Code Quality (run before every commit)
pnpm lint                   # Run ESLint
pnpm type-check             # Run TypeScript compiler
pnpm lint && pnpm type-check  # Quick pre-commit check

# Testing
pnpm test:run               # Run unit tests
pnpm test:integration       # Run integration tests
pnpm test:e2e:critical      # Run critical E2E tests

# Full verification before PR
pnpm lint && pnpm type-check && pnpm test:run && pnpm build
```

### Project Rules

1. **No console.log** - Use `console.warn` or `console.error` instead (except in `scripts/` and `prisma/`)
2. **Remove unused imports** - CI will fail on unused variables
3. **SSR Safety** - Wrap browser APIs in `useEffect` or check `typeof window !== 'undefined'`
4. **No useSession in public components** - Causes hydration errors
5. **IntersectionObserver needs fallback** - Default to `true` when unavailable

### File Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Business logic and utilities
- `src/config/features.ts` - Feature flags
- `prisma/schema.prisma` - Database schema

### Before Committing

Always run the pre-commit check skill or at minimum:

```bash
pnpm lint && pnpm type-check
```

If modifying database code, also run:

```bash
pnpm test:integration
```
