#!/bin/sh
set -e

# Ensure uploads directory exists and is writable
mkdir -p /app/public/uploads

# Fix permissions if running as root during entrypoint (before switching to node user)
# This handles the case where volume mounts have wrong ownership
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /app/public/uploads
fi

# Generate Prisma Client and run migrations if schema exists
if [ -f /app/prisma/schema.prisma ]; then
  echo "Generating Prisma Client..."
  npx prisma generate
  echo "Running database migrations..."
  npm run db:migrate
fi

exec "$@"
