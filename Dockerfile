# syntax=docker/dockerfile:1.7

# === Dependencies Stage: Install production dependencies ===
FROM cgr.dev/chainguard/node:latest-dev AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# === Builder Stage: Build application ===
FROM cgr.dev/chainguard/node:latest-dev AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npx prisma generate && npm run build

# === Migration Stage: Database migrations ===
FROM cgr.dev/chainguard/node:latest-dev AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Prisma CLI is available in node_modules for migrations
CMD ["npx", "prisma", "migrate", "deploy"]

# === Production Stage: Runtime environment ===
FROM cgr.dev/chainguard/node:latest AS runner
ENV NODE_ENV=production
ENV HUSKY=0
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Copy the standalone server build
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Copy specific dependencies for runtime scripts
# (sharp for image processing, tsx for script execution, prisma for migrations)
COPY --from=deps --chown=node:node /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=node:node /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=node:node /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=node:node /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Copy prisma schema for migrations
COPY --chown=node:node prisma ./prisma

# Copy scripts for maintenance operations (thumbnail generation, etc.)
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node package.json ./

# Copy health check and entrypoint scripts
COPY --chown=node:node docker/healthcheck.js ./docker/healthcheck.js
COPY --chown=node:node docker/entrypoint.sh ./docker/entrypoint.sh

# Chainguard node image runs as node user (UID 65532) by default
# No need for USER directive or chmod (scripts must be executable in repo)

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", "server.js"]
