#!/bin/sh
set -e

# Ensure uploads directory exists and is writable
mkdir -p /app/public/uploads

# Run database migrations if schema exists
if [ -f /app/prisma/schema.prisma ]; then
  npm run db:migrate
fi

exec "$@"
