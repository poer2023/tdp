#!/bin/sh
set -e

# Generate Prisma Client and run migrations if schema exists
if [ -f /app/prisma/schema.prisma ]; then
  echo "Generating Prisma Client..."
  npx prisma generate
  echo "Running database migrations..."
  npm run db:migrate
fi

exec "$@"
