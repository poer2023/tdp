#!/bin/sh
set -e

echo "==> Starting Prisma migrations"
echo "Working directory: $(pwd)"
echo "User: $(id -un) ($(id -u))"

# Check if prisma exists
if [ -f "/app/node_modules/prisma/build/index.js" ]; then
  echo "✓ Prisma CLI found"
else
  echo "✗ Prisma CLI NOT FOUND at /app/node_modules/prisma/build/index.js"
  ls -la /app/node_modules/ | head -20
  exit 1
fi

cd /app
echo "==> Executing: node /app/node_modules/prisma/build/index.js migrate deploy"
node /app/node_modules/prisma/build/index.js migrate deploy
echo "✅ Migrations completed successfully"
