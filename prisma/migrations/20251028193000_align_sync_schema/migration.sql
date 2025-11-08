-- Drop temporary backup table if present
DROP TABLE IF EXISTS "GitHubStats_backup_20251025";

-- Prepare SyncStatistics.platform for TEXT conversion
DROP INDEX IF EXISTS "SyncStatistics_platform_date_idx";
DROP INDEX IF EXISTS "SyncStatistics_platform_date_key";
ALTER TABLE "SyncStatistics" ADD COLUMN IF NOT EXISTS "platform_text" TEXT;
UPDATE "SyncStatistics" SET "platform_text" = "platform"::text WHERE "platform_text" IS NULL;
ALTER TABLE "SyncStatistics" ALTER COLUMN "platform_text" SET NOT NULL;
ALTER TABLE "SyncStatistics" DROP COLUMN "platform";
ALTER TABLE "SyncStatistics" RENAME COLUMN "platform_text" TO "platform";
CREATE UNIQUE INDEX IF NOT EXISTS "SyncStatistics_platform_date_key" ON "SyncStatistics"("platform", "date");
CREATE INDEX IF NOT EXISTS "SyncStatistics_platform_date_idx" ON "SyncStatistics"("platform", "date");

-- Prepare SyncJobLog.platform for TEXT conversion and clean old indexes
DROP INDEX IF EXISTS "SyncJobLog_status_startedAt_idx";
DROP INDEX IF EXISTS "SyncJobLog_platform_startedAt_idx";
DROP INDEX IF EXISTS "SyncJobLog_platform_syncMode_completedAt_idx";
ALTER TABLE "SyncJobLog" ADD COLUMN IF NOT EXISTS "platform_text" TEXT;
UPDATE "SyncJobLog" SET "platform_text" = "platform"::text WHERE "platform_text" IS NULL;
ALTER TABLE "SyncJobLog" ALTER COLUMN "platform_text" SET NOT NULL;
ALTER TABLE "SyncJobLog" DROP COLUMN "platform";
ALTER TABLE "SyncJobLog" RENAME COLUMN "platform_text" TO "platform";

-- Prepare ExternalCredential.platform for TEXT conversion (必须在更新数据之前)
ALTER TABLE "ExternalCredential" ADD COLUMN IF NOT EXISTS "platform_text" TEXT;
UPDATE "ExternalCredential" SET "platform_text" = "platform"::text WHERE "platform_text" IS NULL;
ALTER TABLE "ExternalCredential" ALTER COLUMN "platform_text" SET NOT NULL;
ALTER TABLE "ExternalCredential" DROP COLUMN "platform";
ALTER TABLE "ExternalCredential" RENAME COLUMN "platform_text" TO "platform";

-- Prepare ExternalCredential.type for TEXT conversion (必须在更新数据之前)
ALTER TABLE "ExternalCredential" ADD COLUMN IF NOT EXISTS "type_text" TEXT;
UPDATE "ExternalCredential" SET "type_text" = "type"::text WHERE "type_text" IS NULL;
ALTER TABLE "ExternalCredential" ALTER COLUMN "type_text" SET NOT NULL;
ALTER TABLE "ExternalCredential" DROP COLUMN "type";
ALTER TABLE "ExternalCredential" RENAME COLUMN "type_text" TO "type";

-- Normalize legacy enum values (现在所有列都是 TEXT 类型,可以安全地更新)
UPDATE "ExternalCredential" SET "platform" = 'GITHUB' WHERE "platform" = 'NOTION';
UPDATE "SyncJobLog" SET "platform" = 'GITHUB' WHERE "platform" = 'NOTION';
UPDATE "ExternalCredential" SET "type" = 'API_KEY' WHERE "type" IN ('PASSWORD', 'ENCRYPTED');

-- Recreate CredentialPlatform enum without deprecated variants
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CredentialPlatform_new') THEN
        DROP TYPE "CredentialPlatform_new";
    END IF;
END $$;

CREATE TYPE "CredentialPlatform_new" AS ENUM ('STEAM', 'HOYOVERSE', 'BILIBILI', 'DOUBAN', 'JELLYFIN', 'GITHUB');
ALTER TABLE "ExternalCredential" ALTER COLUMN "platform" TYPE "CredentialPlatform_new" USING "platform"::text::"CredentialPlatform_new";
DROP TYPE IF EXISTS "CredentialPlatform";
ALTER TYPE "CredentialPlatform_new" RENAME TO "CredentialPlatform";

-- Recreate CredentialType enum without deprecated variants
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CredentialType_new') THEN
        DROP TYPE "CredentialType_new";
    END IF;
END $$;

CREATE TYPE "CredentialType_new" AS ENUM ('COOKIE', 'API_KEY', 'OAUTH_TOKEN', 'PERSONAL_ACCESS_TOKEN');
ALTER TABLE "ExternalCredential" ALTER COLUMN "type" TYPE "CredentialType_new" USING "type"::text::"CredentialType_new";
DROP TYPE IF EXISTS "CredentialType";
ALTER TYPE "CredentialType_new" RENAME TO "CredentialType";

-- Align MediaWatchSyncLog structure
ALTER TABLE "MediaWatchSyncLog" DROP COLUMN IF EXISTS "itemsProcessed";
ALTER TABLE "MediaWatchSyncLog" DROP COLUMN IF EXISTS "itemsAdded";
ALTER TABLE "MediaWatchSyncLog" DROP COLUMN IF EXISTS "itemsUpdated";

-- Ensure Friend updatedAt matches @updatedAt behavior (no default needed for @updatedAt)
UPDATE "Friend" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- Guard against NULL friendVisibility
UPDATE "Moment" SET "friendVisibility" = 'PUBLIC' WHERE "friendVisibility" IS NULL;

-- Enforce GitHubRepo column requirements
UPDATE "GitHubRepo" SET "lastCommitDate" = COALESCE("lastCommitDate", CURRENT_TIMESTAMP);
UPDATE "GitHubRepo" SET "lastCommitMsg" = COALESCE("lastCommitMsg", '');
UPDATE "GitHubRepo" SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);
ALTER TABLE "GitHubRepo" ALTER COLUMN "lastCommitDate" SET NOT NULL;
ALTER TABLE "GitHubRepo" ALTER COLUMN "lastCommitMsg" SET NOT NULL;
-- Remove default for updatedAt (@updatedAt in schema handles updates automatically)
ALTER TABLE "GitHubRepo" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Convert SyncJobLog.status to SyncJobStatus enum
ALTER TABLE "SyncJobLog" ADD COLUMN IF NOT EXISTS "status_tmp" "SyncJobStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "SyncJobLog"
SET "status_tmp" = (CASE LOWER(COALESCE("status", 'pending'))
    WHEN 'running' THEN 'RUNNING'
    WHEN 'success' THEN 'SUCCESS'
    WHEN 'failed' THEN 'FAILED'
    WHEN 'partial' THEN 'PARTIAL'
    WHEN 'pending' THEN 'PENDING'
    ELSE 'PENDING'
END)::"SyncJobStatus";
ALTER TABLE "SyncJobLog" DROP COLUMN "status";
ALTER TABLE "SyncJobLog" RENAME COLUMN "status_tmp" TO "status";
ALTER TABLE "SyncJobLog" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Recreate indexes impacted by conversions
CREATE INDEX IF NOT EXISTS "SyncJobLog_status_startedAt_idx" ON "SyncJobLog"("status", "startedAt");
CREATE INDEX IF NOT EXISTS "SyncJobLog_platform_startedAt_idx" ON "SyncJobLog"("platform", "startedAt");
CREATE INDEX IF NOT EXISTS "SyncJobLog_platform_syncMode_completedAt_idx" ON "SyncJobLog"("platform", "syncMode", "completedAt");
CREATE INDEX IF NOT EXISTS "SyncJobLog_triggeredBy_createdAt_idx" ON "SyncJobLog"("triggeredBy", "createdAt");
CREATE INDEX IF NOT EXISTS "SyncStatistics_date_idx" ON "SyncStatistics"("date");

