# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20.19.0

FROM node:${NODE_VERSION}-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure Prisma Client is generated with the actual schema before building
RUN npx prisma generate && npm run build

# Migration stage - used for database migrations only
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Prisma CLI is available in node_modules for migrations
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runner
ENV NODE_ENV=production
ENV HUSKY=0
ENV HOSTNAME=0.0.0.0

# Copy the standalone server build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy specific dependencies for runtime scripts (sharp for image processing, tsx for script execution)
# Standalone mode bundles most dependencies, but some native modules and dev tools are needed
COPY --from=deps /app/node_modules/sharp ./node_modules/sharp
COPY --from=deps /app/node_modules/tsx ./node_modules/tsx

# Copy scripts for maintenance operations (thumbnail generation, etc.)
COPY scripts ./scripts
COPY package.json ./

# Copy health check and entrypoint scripts
COPY docker/healthcheck.js ./docker/healthcheck.js
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh ./docker/healthcheck.js

# Set ownership to node user and switch to non-root user
RUN chown -R node:node /app
USER node

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", "server.js"]
