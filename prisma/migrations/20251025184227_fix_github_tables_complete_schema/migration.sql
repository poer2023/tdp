-- ============================================================================
-- 完整修复 GitHub 相关表架构
-- 创建时间: 2025-10-25 18:42:27
-- 原因: 之前的迁移使用了旧架构,与当前代码不匹配
-- ============================================================================

-- 修复 GitHubStats 表 (重建为正确架构)
-- 问题: 当前表有 userId, longestStreak, lastUpdated 但缺少 syncJobLogId, syncedAt
-- 解决: 先删除外键,删除旧列,添加新列

-- 1.1 删除 userId 外键约束 (如果存在)
ALTER TABLE "GitHubStats" DROP CONSTRAINT IF EXISTS "GitHubStats_userId_fkey";

-- 1.2 删除 userId 唯一索引 (如果存在)
DROP INDEX IF EXISTS "GitHubStats_userId_key";

-- 1.3 删除旧列
ALTER TABLE "GitHubStats" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "GitHubStats" DROP COLUMN IF EXISTS "longestStreak";
ALTER TABLE "GitHubStats" DROP COLUMN IF EXISTS "lastUpdated";
ALTER TABLE "GitHubStats" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "GitHubStats" DROP COLUMN IF EXISTS "updatedAt";

-- 1.4 添加新列
ALTER TABLE "GitHubStats" ADD COLUMN IF NOT EXISTS "syncJobLogId" TEXT;
ALTER TABLE "GitHubStats" ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 1.5 创建新索引
CREATE INDEX IF NOT EXISTS "GitHubStats_syncedAt_idx" ON "GitHubStats"("syncedAt");
CREATE INDEX IF NOT EXISTS "GitHubStats_syncJobLogId_idx" ON "GitHubStats"("syncJobLogId");

-- 1.6 添加外键约束到 SyncJobLog (如果 SyncJobLog 表存在)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'SyncJobLog'
  ) THEN
    ALTER TABLE "GitHubStats"
    ADD CONSTRAINT "GitHubStats_syncJobLogId_fkey"
    FOREIGN KEY ("syncJobLogId") REFERENCES "SyncJobLog"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

    RAISE NOTICE 'GitHubStats 外键约束已创建';
  END IF;
END $$;

-- 修复 GitHubContribution 表
-- 问题: 使用 count, level, createdAt 列,代码期望 value 列
ALTER TABLE "GitHubContribution" DROP COLUMN IF EXISTS "count";
ALTER TABLE "GitHubContribution" DROP COLUMN IF EXISTS "level";
ALTER TABLE "GitHubContribution" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "GitHubContribution" ADD COLUMN IF NOT EXISTS "value" INTEGER NOT NULL DEFAULT 0;

-- 修复 GitHubLanguage 表
-- 问题: 使用 bytes 列和 DOUBLE PRECISION percentage,代码期望 hours 列和 INTEGER percentage
ALTER TABLE "GitHubLanguage" DROP COLUMN IF EXISTS "bytes";
ALTER TABLE "GitHubLanguage" ADD COLUMN IF NOT EXISTS "hours" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "GitHubLanguage" ALTER COLUMN "percentage" DROP DEFAULT;
ALTER TABLE "GitHubLanguage" ALTER COLUMN "percentage" TYPE INTEGER USING "percentage"::integer;
ALTER TABLE "GitHubLanguage" ALTER COLUMN "percentage" SET DEFAULT 0;

-- 修复 GitHubRepo 表
-- 问题: 缺少 updatedAt, commitsThisMonth, lastCommitDate, lastCommitMsg
--       有额外的 description, url, stars, forks, isPrivate, pushedAt
ALTER TABLE "GitHubRepo" DROP COLUMN IF EXISTS "description";
ALTER TABLE "GitHubRepo" DROP COLUMN IF EXISTS "forks";
ALTER TABLE "GitHubRepo" DROP COLUMN IF EXISTS "isPrivate";
ALTER TABLE "GitHubRepo" DROP COLUMN IF EXISTS "pushedAt";
ALTER TABLE "GitHubRepo" DROP COLUMN IF EXISTS "stars";
ALTER TABLE "GitHubRepo" DROP COLUMN IF EXISTS "url";
ALTER TABLE "GitHubRepo" ADD COLUMN IF NOT EXISTS "commitsThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GitHubRepo" ADD COLUMN IF NOT EXISTS "lastCommitDate" TIMESTAMP(3);
ALTER TABLE "GitHubRepo" ADD COLUMN IF NOT EXISTS "lastCommitMsg" TEXT;
ALTER TABLE "GitHubRepo" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 迁移完成通知
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GitHub 表架构完整修复完成';
  RAISE NOTICE '时间: 2025-10-25 18:42:27';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已修复的表:';
  RAISE NOTICE '1. GitHubStats: 添加 syncJobLogId, syncedAt';
  RAISE NOTICE '2. GitHubContribution: 添加 value 列';
  RAISE NOTICE '3. GitHubLanguage: 添加 hours 列';
  RAISE NOTICE '4. GitHubRepo: 添加 updatedAt 等 4 列';
  RAISE NOTICE '========================================';
  RAISE NOTICE '所有表结构现在与代码完全匹配';
  RAISE NOTICE '可以进行 GitHub 数据同步测试';
  RAISE NOTICE '========================================';
END $$;
