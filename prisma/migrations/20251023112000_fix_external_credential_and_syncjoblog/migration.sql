-- Align production DB schema with current Prisma models
-- 1) ExternalCredential: add `value` (copy from legacy `encryptedValue`), add new columns
-- 2) SyncJobLog: add `jobType` and other optional columns, rename `finishedAt` -> `completedAt`

-- ExternalCredential adjustments
ALTER TABLE "ExternalCredential"
  ADD COLUMN IF NOT EXISTS "value" TEXT,
  ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "failureCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastError" TEXT,
  ADD COLUMN IF NOT EXISTS "autoSync" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "syncFrequency" TEXT,
  ADD COLUMN IF NOT EXISTS "nextCheckAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- If legacy encrypted column exists, copy values into new `value` column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ExternalCredential'
      AND column_name = 'encryptedValue'
  ) THEN
    EXECUTE 'UPDATE "ExternalCredential" SET "value" = COALESCE("value", "encryptedValue") WHERE "value" IS NULL';
  END IF;
END$$;

-- Migrate legacy lastErrorMessage -> lastError if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ExternalCredential' AND column_name = 'lastErrorMessage'
  ) THEN
    EXECUTE 'UPDATE "ExternalCredential" SET "lastError" = COALESCE("lastError", "lastErrorMessage")';
  END IF;
END$$;

-- Drop legacy encryptedValue if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ExternalCredential'
      AND column_name = 'encryptedValue'
  ) THEN
    EXECUTE 'ALTER TABLE "ExternalCredential" DROP COLUMN "encryptedValue"';
  END IF;
END$$;

-- SyncJobLog adjustments
ALTER TABLE "SyncJobLog"
  ADD COLUMN IF NOT EXISTS "jobType" TEXT,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "duration" INTEGER,
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "errorStack" TEXT,
  ADD COLUMN IF NOT EXISTS "errorDetails" JSONB,
  ADD COLUMN IF NOT EXISTS "metrics" JSONB;

-- Rename finishedAt -> completedAt if legacy column exists and new column is NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'SyncJobLog' AND column_name = 'finishedAt'
  ) THEN
    -- If completedAt is null, migrate values from finishedAt
    EXECUTE 'UPDATE "SyncJobLog" SET "completedAt" = COALESCE("completedAt", "finishedAt")';
    -- Drop legacy column
    EXECUTE 'ALTER TABLE "SyncJobLog" DROP COLUMN "finishedAt"';
  END IF;
END$$;

