# Agent Operations Guide

## Environment

- Node.js 20.x (set via `actions/setup-node` or your local toolchain).
- Package manager: npm (`npm ci` is required before any command).
- PostgreSQL is required for migrations/tests; set `DATABASE_URL=postgresql://user:pass@host:port/db?schema=public`.
- Playwright browsers are needed for E2E work (`npx playwright install chromium --with-deps` on fresh runners).

## Setup Checklist

1. `npm ci`
2. `npx prisma migrate deploy` (whenever database access is needed).
3. If running E2E, seed data with `npm run test:e2e:seed` and clean via `npm run test:e2e:cleanup` when done.

## Diagnosis & Repair Strategy

1. Read `ci/last-failure.log` for the failing job context.
2. Reproduce locally in this order: ESLint/Prettier → TypeScript → Unit tests → Build → E2E (critical scenarios only).
3. After every code change, run until all pass:
   - `npm run lint`
   - `npm run type-check`
   - `npm run test:run`
   - `npm run build`
4. Keep diffs surgical; avoid unrelated formatting or refactors.

## Core Commands

- Install dependencies: `npm ci`
- Lint: `npm run lint`
- Format check: `npm run format:check`
- Type check: `npm run type-check`
- Unit tests: `npm run test:run`
- E2E smoke: `npm run test:e2e:critical` (full suite: `npm run test:e2e`)
- Build: `npm run build`

## Code & Dependency Policy

- Respect existing ESLint/Prettier configuration; do not add new dependencies without necessity and PR justification.
- Components follow PascalCase; files prefer kebab-case; Tailwind utilities handle styling.
- Implement changes in TypeScript/React idioms used in nearby modules.

## Project Reference

- `src/app`: Next.js App Router pages and the admin UI (e.g., `src/app/admin/gallery`).
- `src/lib`: Domain logic, uploads, storage, EXIF, and geocoding utilities.
- `prisma`: `schema.prisma` and migrations.
- `e2e`: Playwright tests, fixtures, and page objects.
- `docs` / `scripts`: Developer documentation and helper scripts.
- `public/uploads`: Runtime media (`covers/`, `gallery/`).
