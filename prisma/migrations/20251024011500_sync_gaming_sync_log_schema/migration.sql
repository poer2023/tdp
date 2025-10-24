-- Fix GamingSyncLog table schema to match Prisma model
-- This migration adds missing columns and removes obsolete ones

-- Add missing columns
ALTER TABLE "GamingSyncLog"
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "errorStack" TEXT,
  ADD COLUMN IF NOT EXISTS "duration" INTEGER;

-- Migrate data from old errorMessage to new message field
UPDATE "GamingSyncLog"
SET "message" = "errorMessage"
WHERE "message" IS NULL AND "errorMessage" IS NOT NULL;

-- Drop obsolete columns
ALTER TABLE "GamingSyncLog"
  DROP COLUMN IF EXISTS "errorMessage",
  DROP COLUMN IF EXISTS "itemsProcessed";

-- Update status column type from TEXT to SyncJobStatus enum if needed
-- Note: This requires careful handling to preserve existing data
DO $$
BEGIN
  -- Check if status column is TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'GamingSyncLog'
      AND column_name = 'status'
      AND data_type = 'text'
  ) THEN
    -- Update TEXT values to match enum values
    UPDATE "GamingSyncLog" SET "status" = 'PENDING' WHERE "status" = 'pending';
    UPDATE "GamingSyncLog" SET "status" = 'SUCCESS' WHERE "status" = 'success';
    UPDATE "GamingSyncLog" SET "status" = 'FAILED' WHERE "status" = 'failed';
    UPDATE "GamingSyncLog" SET "status" = 'RUNNING' WHERE "status" = 'running';

    -- Convert column to use SyncJobStatus enum
    ALTER TABLE "GamingSyncLog"
      ALTER COLUMN "status" TYPE "SyncJobStatus"
      USING "status"::"SyncJobStatus";

    -- Set default value
    ALTER TABLE "GamingSyncLog"
      ALTER COLUMN "status" SET DEFAULT 'PENDING'::SyncJobStatus;
  END IF;
END $$;

-- Create index on status column if not exists
CREATE INDEX IF NOT EXISTS "GamingSyncLog_status_idx" ON "GamingSyncLog"("status");
