-- CreateEnum
CREATE TYPE "CredentialPlatform" AS ENUM ('STEAM', 'BILIBILI', 'GITHUB', 'NOTION');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('API_KEY', 'OAUTH_TOKEN', 'COOKIE', 'PASSWORD', 'ENCRYPTED');

-- CreateEnum
CREATE TYPE "GamePlatform" AS ENUM ('STEAM', 'HOYOVERSE', 'PSN', 'XBOX', 'SWITCH');

-- CreateTable
CREATE TABLE "ExternalCredential" (
    "id" TEXT NOT NULL,
    "platform" "CredentialPlatform" NOT NULL,
    "type" "CredentialType" NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "metadata" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "lastValidatedAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "nextCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJobLog" (
    "id" TEXT NOT NULL,
    "platform" "CredentialPlatform" NOT NULL,
    "credentialId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "itemsTotal" INTEGER DEFAULT 0,
    "itemsSuccess" INTEGER DEFAULT 0,
    "itemsFailed" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncStatistics" (
    "id" TEXT NOT NULL,
    "platform" "CredentialPlatform" NOT NULL,
    "date" DATE NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageDuration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "platform" "GamePlatform" NOT NULL,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "cover" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "platform" "GamePlatform" NOT NULL,
    "hoyoLevel" INTEGER,
    "hoyoMode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAchievement" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "description" TEXT,
    "unlockedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SteamProfile" (
    "id" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "personaName" TEXT NOT NULL,
    "profileUrl" TEXT,
    "avatar" TEXT,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SteamProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoyoProfile" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "loginDays" INTEGER,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'cn_gf01',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoyoProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamingSyncLog" (
    "id" TEXT NOT NULL,
    "platform" "GamePlatform" NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,

    CONSTRAINT "GamingSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubStats" (
    "id" TEXT NOT NULL,
    "totalRepos" INTEGER NOT NULL DEFAULT 0,
    "totalStars" INTEGER NOT NULL DEFAULT 0,
    "totalForks" INTEGER NOT NULL DEFAULT 0,
    "totalCommits" INTEGER NOT NULL DEFAULT 0,
    "publicRepos" INTEGER NOT NULL DEFAULT 0,
    "privateRepos" INTEGER NOT NULL DEFAULT 0,
    "syncJobLogId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepo" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "language" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pushedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubRepo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubLanguage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubContribution" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalCredential_platform_isValid_idx" ON "ExternalCredential"("platform", "isValid");

-- CreateIndex
CREATE INDEX "ExternalCredential_lastValidatedAt_idx" ON "ExternalCredential"("lastValidatedAt");

-- CreateIndex
CREATE INDEX "ExternalCredential_nextCheckAt_idx" ON "ExternalCredential"("nextCheckAt");

-- CreateIndex
CREATE INDEX "SyncJobLog_platform_startedAt_idx" ON "SyncJobLog"("platform", "startedAt");

-- CreateIndex
CREATE INDEX "SyncJobLog_status_startedAt_idx" ON "SyncJobLog"("status", "startedAt");

-- CreateIndex
CREATE INDEX "SyncJobLog_triggeredBy_createdAt_idx" ON "SyncJobLog"("triggeredBy", "createdAt");

-- CreateIndex
CREATE INDEX "SyncJobLog_credentialId_idx" ON "SyncJobLog"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatistics_platform_date_key" ON "SyncStatistics"("platform", "date");

-- CreateIndex
CREATE INDEX "SyncStatistics_platform_date_idx" ON "SyncStatistics"("platform", "date");

-- CreateIndex
CREATE INDEX "SyncStatistics_date_idx" ON "SyncStatistics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Game_platform_platformId_key" ON "Game"("platform", "platformId");

-- CreateIndex
CREATE INDEX "Game_platform_idx" ON "Game"("platform");

-- CreateIndex
CREATE INDEX "GameSession_gameId_startTime_idx" ON "GameSession"("gameId", "startTime");

-- CreateIndex
CREATE INDEX "GameSession_startTime_idx" ON "GameSession"("startTime");

-- CreateIndex
CREATE INDEX "GameSession_platform_startTime_idx" ON "GameSession"("platform", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "GameAchievement_gameId_achievementId_key" ON "GameAchievement"("gameId", "achievementId");

-- CreateIndex
CREATE INDEX "GameAchievement_gameId_idx" ON "GameAchievement"("gameId");

-- CreateIndex
CREATE INDEX "GameAchievement_isUnlocked_idx" ON "GameAchievement"("isUnlocked");

-- CreateIndex
CREATE UNIQUE INDEX "SteamProfile_steamId_key" ON "SteamProfile"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "HoyoProfile_uid_key" ON "HoyoProfile"("uid");

-- CreateIndex
CREATE INDEX "GamingSyncLog_platform_syncedAt_idx" ON "GamingSyncLog"("platform", "syncedAt");

-- CreateIndex
CREATE INDEX "GamingSyncLog_status_idx" ON "GamingSyncLog"("status");

-- CreateIndex
CREATE INDEX "GitHubStats_syncedAt_idx" ON "GitHubStats"("syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepo_fullName_key" ON "GitHubRepo"("fullName");

-- CreateIndex
CREATE INDEX "GitHubRepo_fullName_idx" ON "GitHubRepo"("fullName");

-- CreateIndex
CREATE INDEX "GitHubRepo_isActive_syncedAt_idx" ON "GitHubRepo"("isActive", "syncedAt");

-- CreateIndex
CREATE INDEX "GitHubLanguage_syncedAt_idx" ON "GitHubLanguage"("syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubContribution_date_key" ON "GitHubContribution"("date");

-- CreateIndex
CREATE INDEX "GitHubContribution_date_idx" ON "GitHubContribution"("date");

-- AddForeignKey
ALTER TABLE "SyncJobLog" ADD CONSTRAINT "SyncJobLog_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "ExternalCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAchievement" ADD CONSTRAINT "GameAchievement_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubStats" ADD CONSTRAINT "GitHubStats_syncJobLogId_fkey" FOREIGN KEY ("syncJobLogId") REFERENCES "SyncJobLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
