# syntax=docker/dockerfile:1.7

# === Base Stage: Shared tooling ===
FROM cgr.dev/chainguard/node:latest-dev@sha256:bead3b22234bc8406318839695d40d57b16694f833f0cd64f5180ed764952e13 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Enable corepack for pnpm (requires root for Chainguard image)
USER root
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate
USER node

# === Dependencies Stage: Install all dependencies ===
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# === Builder Stage: Build application ===
FROM deps AS builder
WORKDIR /app

# Copy source code with root privileges then hand ownership back to node user
USER root
COPY . .
RUN chown -R node:node /app
USER node
RUN pnpm run build

# Pre-compile TypeScript scripts to JavaScript for runtime use (avoids tsx/esbuild at runtime)
RUN pnpm exec tsc --esModuleInterop --module commonjs --moduleResolution node --target es2022 --outDir /app/scripts-dist /app/scripts/production-data-migration.ts || echo "Script pre-compilation skipped"

# === Production Dependencies Stage: Prune and generate Prisma client ===
FROM deps AS prod-deps
COPY prisma ./prisma
RUN pnpm prune --prod
RUN pnpm exec prisma generate

# === Migration Stage: Database migrations ===
FROM base AS migrator
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
# Prisma CLI is available in node_modules for migrations
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# === Production Stage: Runtime environment ===
FROM cgr.dev/chainguard/node:latest@sha256:cb2e23fc54f66364d4d5e5a4e18a0abe3a076c4d791df2b659b25bca256f0220 AS runner
ENV NODE_ENV=production
ENV HUSKY=0
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Copy the standalone server build
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Copy production dependencies for the Next.js standalone server and Prisma CLI
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# Bring over dev-only tooling that is still required at runtime (tsx for scripts)
# Copy the entire .pnpm store entries that tsx and esbuild need
# pnpm uses symlinks, so we need to copy both the actual module and its dependencies
# NOTE: esbuild is included in .pnpm directory via symlinks
COPY --from=builder --chown=node:node /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder --chown=node:node /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=node:node /app/node_modules/.bin ./node_modules/.bin

# Copy prisma schema and migrations from builder (not from build context)
# This ensures .dockerignore doesn't exclude any prisma files
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Copy pre-compiled scripts from builder (TypeScript -> JavaScript)
COPY --from=builder --chown=node:node /app/scripts-dist ./scripts-dist

# Copy original scripts for maintenance operations (thumbnail generation, etc.)
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node package.json ./

# Copy health check, migration, and entrypoint scripts
COPY --chown=node:node docker/healthcheck.js ./docker/healthcheck.js
COPY --chown=node:node docker/migrate.sh ./docker/migrate.sh
COPY --chown=node:node docker/entrypoint.sh ./docker/entrypoint.sh

# Chainguard node image runs as node user (UID 65532) by default
# Scripts must be executable in git repo - permissions are preserved by COPY

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", "server.js"]
