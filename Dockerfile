# syntax=docker/dockerfile:1.7

# Chainguard Node.js base image
# Pin to specific digest for cache stability. Update periodically for security patches:
#   docker manifest inspect cgr.dev/chainguard/node:latest-dev | jq -r '.manifests[] | select(.platform.architecture == "amd64") | .digest'
# Last updated: 2026-01-11
ARG NODE_IMAGE=cgr.dev/chainguard/node@sha256:07a515c87878ff06a41daa099345c624a446bddb24c27cf7c45122044de93513

# === Dependencies Stage: Install production dependencies ===
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Enable corepack for pnpm (requires root for Chainguard image)
USER root
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate
USER node

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY prisma ./prisma
RUN pnpm exec prisma generate

# === Builder Stage: Build application ===
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Enable corepack for pnpm (requires root for Chainguard image)
USER root
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate
USER node

# Install all dependencies (including devDependencies for build)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code with root privileges then hand ownership back to node user
USER root
COPY . .
RUN chown -R node:node /app
USER node
RUN pnpm exec prisma generate && pnpm run build

# Pre-compile TypeScript scripts to JavaScript for runtime use (avoids tsx/esbuild at runtime)
RUN pnpm exec tsc --esModuleInterop --module commonjs --moduleResolution node --target es2022 --outDir /app/scripts-dist /app/scripts/production-data-migration.ts || echo "Script pre-compilation skipped"

# === Migration Stage: Database migrations ===
FROM ${NODE_IMAGE} AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
# Prisma CLI is available in node_modules for migrations
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# === Production Stage: Runtime environment ===
# Using -dev variant to include apk for FFmpeg installation
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production
ENV HUSKY=0
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Install FFmpeg for video processing (requires root)
USER root
RUN apk add --no-cache ffmpeg
USER node


# Copy the standalone server build
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Copy production dependencies for the Next.js standalone server and Prisma CLI
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

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
