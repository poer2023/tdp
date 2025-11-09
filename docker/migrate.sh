#!/bin/sh
set -e

echo "==> Starting Prisma migrations"
cd /app
node /app/node_modules/prisma/build/index.js migrate deploy
echo "✅ Migrations completed successfully"
