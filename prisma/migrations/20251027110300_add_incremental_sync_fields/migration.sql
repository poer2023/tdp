-- AlterTable
ALTER TABLE "SyncJobLog" ADD COLUMN "syncMode" TEXT,
ADD COLUMN "lastCursor" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN "itemsNew" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "itemsExisting" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "SyncJobLog_platform_syncMode_completedAt_idx" ON "SyncJobLog"("platform", "syncMode", "completedAt");
