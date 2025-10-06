# Repository Guidelines

## Project Structure & Module Organization

- `src/app`: Next.js App Router pages and admin UI (e.g., `src/app/admin/gallery`).
- `src/lib`: Domain logic and utilities (gallery, uploads, storage, EXIF, geocoding).
- `prisma`: `schema.prisma` and migrations.
- `e2e`: Playwright tests, fixtures, and page objects.
- `docs` and `scripts`: Developer docs and helper scripts.
- `public/uploads`: Runtime media (`covers/`, `gallery/`).

## Build, Test, and Development Commands

- Install deps: `npm ci`
- Dev server: `npm run dev` (http://localhost:3000)
- Build & start: `npm run build && npm run start`
- DB migrate: `npm run db:migrate`
- Unit tests (Vitest): `npm run test`
- E2E tests (Playwright): `npm run test:e2e` or `npm run test:e2e:critical`
- Single E2E file: `npx playwright test e2e/<file>.spec.ts --project=chromium`

## Coding Style & Naming Conventions

- TypeScript, React 19, Next.js 15 (App Router, Server Actions).
- Lint/format: ESLint + Prettier. Run `npm run lint` and `npm run format`.
- Files: kebab-case (`admin-gallery-grid.tsx`), components PascalCase, CSS via Tailwind.
- Prefer small, pure functions; match nearby patterns; avoid unnecessary comments.

## Testing Guidelines

- Unit: Vitest; name files `*.test.ts` or place under `__tests__/`.
- E2E: Playwright (`playwright.config.ts`), auth helpers in `e2e/utils/auth.ts`.
- Add tests for changed behavior; run relevant suites locally before PR.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`.
- One logical change per PR. Include description, screenshots for UI, and a test plan.
- Link related issues; update docs when behavior/config changes.

## Security & Configuration Tips

- Never commit secrets. Configure `.env` using `.env.example` as reference.
- Key env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, Google OAuth, `MAX_UPLOAD_SIZE_MB`.
- Uploads default to local `public/uploads`; for S3 set `STORAGE_TYPE=s3` and `S3_*` vars.

## Agent-Specific Instructions

- Make surgical changes; respect existing structure and naming.
- Run unit/E2E tests for impacted areas; don’t fix unrelated issues.
- Keep patches minimal and documented; update or create tests when behavior changes.
