-- Add DEEPSEEK to CredentialPlatform enum
ALTER TYPE "CredentialPlatform" ADD VALUE IF NOT EXISTS 'DEEPSEEK';

-- Add SyncStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add SyncTriggerType enum if not exists
DO $$ BEGIN
    CREATE TYPE "SyncTriggerType" AS ENUM ('MANUAL', 'AUTO', 'VALIDATION', 'API');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable SyncLog
CREATE TABLE IF NOT EXISTS "SyncLog" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT,
    "platform" TEXT NOT NULL,
    "triggerType" "SyncTriggerType" NOT NULL DEFAULT 'MANUAL',
    "syncConfig" JSONB,
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',
    "success" BOOLEAN NOT NULL DEFAULT false,
    "itemsTotal" INTEGER NOT NULL DEFAULT 0,
    "itemsSuccess" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "itemsNew" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsExisting" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "aiDiagnosisId" TEXT,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable GamePlaytimeSnapshot
CREATE TABLE IF NOT EXISTS "GamePlaytimeSnapshot" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "playtime" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "dailyDelta" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePlaytimeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable AIDiagnosisLog (new structure)
CREATE TABLE IF NOT EXISTS "AIDiagnosisLog" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "htmlSnapshot" TEXT,
    "aiReason" TEXT NOT NULL,
    "aiSolution" TEXT NOT NULL,
    "canAutoFix" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL,
    "autoFixApplied" BOOLEAN NOT NULL DEFAULT false,
    "autoFixSuccess" BOOLEAN,
    "autoFixDetails" JSONB,
    "tokensUsed" INTEGER,
    "costYuan" DOUBLE PRECISION,
    "credentialId" TEXT,
    "syncJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIDiagnosisLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable SiteConfig
CREATE TABLE IF NOT EXISTS "SiteConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndexes for SyncLog
CREATE INDEX IF NOT EXISTS "SyncLog_platform_createdAt_idx" ON "SyncLog"("platform", "createdAt");
CREATE INDEX IF NOT EXISTS "SyncLog_credentialId_createdAt_idx" ON "SyncLog"("credentialId", "createdAt");
CREATE INDEX IF NOT EXISTS "SyncLog_status_idx" ON "SyncLog"("status");
CREATE INDEX IF NOT EXISTS "SyncLog_triggerType_idx" ON "SyncLog"("triggerType");

-- CreateIndexes for GamePlaytimeSnapshot
CREATE INDEX IF NOT EXISTS "GamePlaytimeSnapshot_gameId_snapshotAt_idx" ON "GamePlaytimeSnapshot"("gameId", "snapshotAt");
CREATE INDEX IF NOT EXISTS "GamePlaytimeSnapshot_steamId_snapshotAt_idx" ON "GamePlaytimeSnapshot"("steamId", "snapshotAt");
CREATE INDEX IF NOT EXISTS "GamePlaytimeSnapshot_snapshotAt_idx" ON "GamePlaytimeSnapshot"("snapshotAt");
CREATE UNIQUE INDEX IF NOT EXISTS "GamePlaytimeSnapshot_gameId_steamId_snapshotAt_key" ON "GamePlaytimeSnapshot"("gameId", "steamId", "snapshotAt");

-- CreateIndexes for AIDiagnosisLog
CREATE INDEX IF NOT EXISTS "AIDiagnosisLog_platform_createdAt_idx" ON "AIDiagnosisLog"("platform", "createdAt");
CREATE INDEX IF NOT EXISTS "AIDiagnosisLog_canAutoFix_autoFixApplied_idx" ON "AIDiagnosisLog"("canAutoFix", "autoFixApplied");

-- CreateIndex for ExternalCredential
CREATE INDEX IF NOT EXISTS "ExternalCredential_autoSync_idx" ON "ExternalCredential"("autoSync");

-- CreateIndex for PhotoStats
CREATE UNIQUE INDEX IF NOT EXISTS "PhotoStats_date_key" ON "PhotoStats"("date");

-- CreateIndex for StepsData
CREATE UNIQUE INDEX IF NOT EXISTS "StepsData_date_key" ON "StepsData"("date");

-- AddForeignKey for GamePlaytimeSnapshot
DO $$ BEGIN
    ALTER TABLE "GamePlaytimeSnapshot" ADD CONSTRAINT "GamePlaytimeSnapshot_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey for SyncLog
DO $$ BEGIN
    ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "ExternalCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
