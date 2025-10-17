-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "MediaWatch" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover" TEXT,
    "url" TEXT,
    "watchedAt" TIMESTAMP(3) NOT NULL,
    "progress" INTEGER,
    "season" INTEGER,
    "episode" INTEGER,
    "rating" INTEGER,
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "itemsTotal" INTEGER NOT NULL DEFAULT 0,
    "itemsSuccess" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'cron',

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaWatch_platform_watchedAt_idx" ON "MediaWatch"("platform", "watchedAt");

-- CreateIndex
CREATE INDEX "MediaWatch_watchedAt_idx" ON "MediaWatch"("watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaWatch_platform_externalId_key" ON "MediaWatch"("platform", "externalId");

-- CreateIndex
CREATE INDEX "SyncJob_platform_startedAt_idx" ON "SyncJob"("platform", "startedAt");

-- CreateIndex
CREATE INDEX "SyncJob_status_idx" ON "SyncJob"("status");
