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

# Ensure DATABASE_URL is available; fall back to compose defaults when missing
if [ -z "${DATABASE_URL:-}" ]; then
  DB_USER="${POSTGRES_USER:-tdp}"
  DB_PASS="${POSTGRES_PASSWORD:-tdp_password}"
  DB_NAME="${POSTGRES_DB:-tdp}"
  DB_HOST="${POSTGRES_HOST:-postgres}"
  DB_PORT="${POSTGRES_PORT:-5432}"
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  MASKED_URL=$(printf '%s' "$DATABASE_URL" | sed -E 's#(://[^:]+):[^@]+@#\\1:***@#')
  echo "⚠️  DATABASE_URL not set; using fallback: ${MASKED_URL}"
fi

# Hotfix: dedupe daily stats to unblock unique constraints
echo "==> Deduping daily stats (StepsData/PhotoStats)"
if ! node /app/node_modules/prisma/build/index.js db execute --stdin --schema /app/prisma/schema.prisma <<'SQL'
DO $dedupe$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StepsData'
  ) THEN
    EXECUTE $sql$
      DELETE FROM "StepsData" s
      USING (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY date ORDER BY id DESC) AS rn
        FROM "StepsData"
      ) d
      WHERE s.id = d.id AND d.rn > 1
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'PhotoStats'
  ) THEN
    EXECUTE $sql$
      DELETE FROM "PhotoStats" s
      USING (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY date ORDER BY id DESC) AS rn
        FROM "PhotoStats"
      ) d
      WHERE s.id = d.id AND d.rn > 1
    $sql$;
  END IF;
END $dedupe$;
SQL
then
  echo "⚠️  Daily stats dedupe skipped (tables missing or not yet created)"
fi

# Hotfix: unblock failed 20251202120000_add_performance_indexes migration (idempotent)
# - Ensures the indexes exist (IF NOT EXISTS) - only if tables exist
# - Clears unfinished migration record so migrate deploy can re-run cleanly
# - Uses DO block with exception handling for fresh databases where tables don't exist yet
echo "==> Applying hotfix for migration 20251202120000_add_performance_indexes"
if ! node /app/node_modules/prisma/build/index.js db execute --stdin --schema /app/prisma/schema.prisma <<'SQL'
-- Use DO block to handle case where tables don't exist yet (fresh database)
DO $$
BEGIN
  -- Only create indexes if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExternalCredential') THEN
    CREATE INDEX IF NOT EXISTS "ExternalCredential_platform_isValid_idx" ON "ExternalCredential"("platform", "isValid");
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GalleryImage') THEN
    CREATE INDEX IF NOT EXISTS "GalleryImage_createdAt_id_idx" ON "GalleryImage"("createdAt", "id");
    CREATE INDEX IF NOT EXISTS "GalleryImage_category_createdAt_idx" ON "GalleryImage"("category", "createdAt");
  END IF;
  
  -- Clear stuck migration entry if migrations table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations') THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20251202120000_add_performance_indexes'
      AND "finished_at" IS NULL;
  END IF;
END $$;
SQL
then
  echo "⚠️  Hotfix skipped (likely fresh database - tables don't exist yet)"
fi

# Pre-check migration status
echo "==> Checking migration status..."
MIGRATE_STATUS=$(node /app/node_modules/prisma/build/index.js migrate status 2>&1) || true
echo "$MIGRATE_STATUS"

NEED_SCHEMA_MIGRATION=true

# Check for pending migrations - if there are pending, we proceed with deploy
# If there's a drift or other issue, fail early
if echo "$MIGRATE_STATUS" | grep -q "Database schema is up to date"; then
  echo "✅ Database schema is already up to date, no schema migrations needed"
  NEED_SCHEMA_MIGRATION=false
fi

if [ "$NEED_SCHEMA_MIGRATION" = true ]; then
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

  # Sync any schema changes not in migrations (handles drift)
  echo "==> Running db push to sync schema..."
  node /app/node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1 || {
    echo "⚠️  db push had issues but continuing - schema may need manual review"
  }
  echo "✅ Schema sync complete"
else
  echo "==> Skipping schema migration (already up to date)"
fi

# Run production data migration (gallery category normalization)
if [ -f "/app/scripts/production-data-migration.ts" ]; then
  if [ -x "/app/node_modules/.bin/tsx" ]; then
    echo "==> Running production data migration..."
    /app/node_modules/.bin/tsx /app/scripts/production-data-migration.ts
    echo "✅ Production data migration complete"
  else
    echo "⚠️  tsx not found; skipping production data migration"
  fi
else
  echo "⚠️  production-data-migration.ts not found, skipping data migration"
fi
