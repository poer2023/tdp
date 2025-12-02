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

# Pre-check migration status
echo "==> Checking migration status..."
MIGRATE_STATUS=$(node /app/node_modules/prisma/build/index.js migrate status 2>&1) || true
echo "$MIGRATE_STATUS"

# Check for pending migrations - if there are pending, we proceed with deploy
# If there's a drift or other issue, fail early
if echo "$MIGRATE_STATUS" | grep -q "Database schema is up to date"; then
  echo "✅ Database schema is already up to date, no migrations needed"
  exit 0
fi

if echo "$MIGRATE_STATUS" | grep -q "have not yet been applied"; then
  echo "⚠️  Pending migrations detected, proceeding with deployment..."
elif echo "$MIGRATE_STATUS" | grep -q "drift detected"; then
  echo "❌ Schema drift detected! Manual intervention required."
  echo "   Run 'npx prisma migrate diff' to investigate."
  exit 1
elif echo "$MIGRATE_STATUS" | grep -q "failed"; then
  echo "❌ Failed migration detected! Manual intervention required."
  exit 1
fi

# Execute migrations
echo "==> Executing: node /app/node_modules/prisma/build/index.js migrate deploy"
node /app/node_modules/prisma/build/index.js migrate deploy

# Post-deploy verification
echo "==> Verifying migration status..."
POST_STATUS=$(node /app/node_modules/prisma/build/index.js migrate status 2>&1) || true
if echo "$POST_STATUS" | grep -q "Database schema is up to date"; then
  echo "✅ Migrations completed and verified successfully"
else
  echo "⚠️  Migration completed but status check shows:"
  echo "$POST_STATUS"
fi
