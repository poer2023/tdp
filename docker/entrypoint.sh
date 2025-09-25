#!/bin/sh
set -e

if [ -f /app/prisma/schema.prisma ]; then
  npm run db:migrate
fi

exec "$@"
