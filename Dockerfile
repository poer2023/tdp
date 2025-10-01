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

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm npm ci --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV HUSKY=0
ENV HOSTNAME=0.0.0.0

# Install curl for container healthcheck (used by docker-compose.yml)
RUN apk add --no-cache curl

# Copy the standalone server build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

# Install production dependencies from cached build stage
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Set ownership to node user and switch to non-root user
RUN mkdir -p /app/public/uploads && chown -R node:node /app
USER node

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", "server.js"]
