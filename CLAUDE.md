# TDP Project Guidelines

## Project Overview

TDP (The Dashboard Platform) is a personal blog and life dashboard platform with 735+ commits.

**Tech Stack:**
- **Framework:** Next.js 16.1.1 + React 19.2.1 (App Router)
- **Database:** PostgreSQL + Prisma 6.18.0 (40+ models)
- **Runtime:** Node.js >= 22.0.0, pnpm 10.16.1
- **Styling:** Tailwind CSS 4, Framer Motion
- **Auth:** NextAuth v5 (Google OAuth)
- **Storage:** Local + Cloudflare R2
- **i18n:** EN (default) / ZH with `[locale]` routing

**Core Features:**
- Blog posts with multi-language support
- Photo gallery with Live Photos, EXIF, map view
- Moments (微博-style short posts)
- Life dashboard (gaming, media, reading, finance tracking)
- External data sync (Steam, Bilibili, Douban, GitHub)

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

### tdp-update-claude-md

**Location:** `.claude/skills/tdp-update-claude-md/SKILL.md`

**When to use:** When updating CLAUDE.md, after major dependency upgrades, adding new directories, or establishing new patterns. Covers version extraction, structure scanning, and content validation.

**How to invoke:** Read the skill: `.claude/skills/tdp-update-claude-md/SKILL.md`

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev                    # Start dev server with Turbopack
pnpm build                  # Build for production

# Code Quality (run before every commit)
pnpm lint                   # Run ESLint
pnpm lint:fix               # Auto-fix lint errors
pnpm type-check             # Run TypeScript compiler
pnpm format                 # Format with Prettier

# Testing
pnpm test:run               # Run unit tests
pnpm test:integration       # Run integration tests
pnpm test:e2e:critical      # Run critical E2E tests

# Database
pnpm db:studio              # Open Prisma Studio
pnpm db:migrate             # Run migrations
pnpm db:generate            # Generate Prisma Client

# Full verification before PR
pnpm lint && pnpm type-check && pnpm test:run && pnpm build
```

### Project Rules

1. **No console.log** - Use `console.warn` or `console.error` instead (except in `scripts/` and `prisma/`)
2. **Remove unused imports** - CI will fail on unused variables
3. **SSR Safety** - Wrap browser APIs in `useEffect` or use lazy initializer: `useState(() => { if (typeof window === 'undefined') return fallback; ... })`
4. **No useSession in public components** - Causes hydration errors, use server components instead
5. **IntersectionObserver needs fallback** - Default to `true` when unavailable
6. **Await params in Next.js 15+** - Use `const { id } = await params` in routes
7. **Revalidate both locales** - Call `revalidatePath("/path")` and `revalidatePath("/zh/path")`

### File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n pages (EN default, /zh for Chinese)
│   ├── api/                # API routes (16 categories)
│   ├── admin/              # Admin dashboard
│   └── *.xml/              # Sitemap, RSS feeds
├── components/
│   ├── ui/                 # Radix UI primitives
│   ├── zhi/                # Main site components
│   ├── admin/              # Admin components
│   ├── gallery/            # Gallery components
│   └── shared/             # Shared components
├── lib/                    # Business logic (70+ modules)
│   ├── gallery.ts          # Gallery queries
│   ├── posts.ts            # Post queries
│   ├── moments.ts          # Moments queries
│   └── prisma.ts           # Prisma client singleton
├── hooks/                  # Custom React hooks
├── contexts/               # React contexts
├── config/features.ts      # Feature flags
├── types/                  # TypeScript types
└── auth.ts                 # NextAuth configuration

prisma/schema.prisma        # Database schema (40+ models)
scripts/                    # Utility scripts
e2e/                        # Playwright E2E tests
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Prisma client singleton with CI fallback |
| `src/lib/utils/db-fallback.ts` | `withDbFallback()` for graceful degradation |
| `src/config/features.ts` | Feature flags (`FEATURE_*` env vars) |
| `src/auth.ts` | NextAuth v5 configuration |
| `next.config.ts` | Next.js configuration |

### Before Committing

Always run the pre-commit check skill or at minimum:

```bash
pnpm lint && pnpm type-check
```

If modifying database code, also run:

```bash
pnpm test:integration
```
