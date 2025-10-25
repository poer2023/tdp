-- ============================================================================
-- 修复 Schema 不一致问题
-- 创建时间: 2025-10-25 06:00:00
-- 根本原因: 开发阶段使用 db push 导致迁移历史丢失
-- ============================================================================

-- 问题 1: SyncJobLog.platform 字段类型不匹配
-- 数据库: CredentialPlatform (枚举)
-- 代码期望: String
-- 解决方案: 将枚举类型转换为 TEXT
ALTER TABLE "SyncJobLog"
ALTER COLUMN "platform" TYPE TEXT
USING "platform"::TEXT;

-- 问题 2: CredentialPlatform 枚举值缺失
-- 缺失值: HOYOVERSE, DOUBAN, JELLYFIN
-- 解决方案: 添加缺失的枚举值 (PostgreSQL 12+ 支持事务内添加)
ALTER TYPE "CredentialPlatform" ADD VALUE IF NOT EXISTS 'HOYOVERSE';
ALTER TYPE "CredentialPlatform" ADD VALUE IF NOT EXISTS 'DOUBAN';
ALTER TYPE "CredentialPlatform" ADD VALUE IF NOT EXISTS 'JELLYFIN';

-- 问题 3: GitHubStats 表结构完全不同
-- 旧结构: totalRepos, totalStars, totalForks, totalCommits
-- 新结构: commitsWeek, reposWeek, commitsMonth, prsMonth, starsYear, reposYear
-- 解决方案: 备份现有数据 → 删除旧表 → 重新创建

-- 3.1 备份现有 GitHubStats 数据 (如果表存在)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'GitHubStats'
  ) THEN
    -- 创建备份表
    CREATE TABLE IF NOT EXISTS "GitHubStats_backup_20251025" AS
    SELECT * FROM "GitHubStats";

    RAISE NOTICE 'GitHubStats 数据已备份到 GitHubStats_backup_20251025';

    -- 删除旧表 (CASCADE 删除相关约束)
    DROP TABLE "GitHubStats" CASCADE;

    RAISE NOTICE 'GitHubStats 旧表已删除';
  ELSE
    RAISE NOTICE 'GitHubStats 表不存在,跳过备份';
  END IF;
END $$;

-- 3.2 根据 schema.prisma 重新创建 GitHubStats 表
CREATE TABLE "GitHubStats" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "commitsWeek" INTEGER NOT NULL DEFAULT 0,
  "reposWeek" INTEGER NOT NULL DEFAULT 0,
  "commitsMonth" INTEGER NOT NULL DEFAULT 0,
  "prsMonth" INTEGER NOT NULL DEFAULT 0,
  "starsYear" INTEGER NOT NULL DEFAULT 0,
  "reposYear" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GitHubStats_pkey" PRIMARY KEY ("id")
);

-- 3.3 创建唯一索引
CREATE UNIQUE INDEX "GitHubStats_userId_key" ON "GitHubStats"("userId");

-- 3.4 添加外键约束 (假设 User 表存在)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'User'
  ) THEN
    ALTER TABLE "GitHubStats"
    ADD CONSTRAINT "GitHubStats_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

    RAISE NOTICE 'GitHubStats 外键约束已创建';
  ELSE
    RAISE NOTICE 'User 表不存在,跳过外键约束创建';
  END IF;
END $$;

-- ============================================================================
-- 验证步骤 (部署后在生产环境执行这些命令验证)
-- ============================================================================
-- 1. 验证 SyncJobLog.platform 类型:
--    \d "SyncJobLog"
--    应该显示: platform | text
--
-- 2. 验证 CredentialPlatform 枚举值:
--    SELECT unnest(enum_range(NULL::"CredentialPlatform"));
--    应该包含: HOYOVERSE, DOUBAN, JELLYFIN
--
-- 3. 验证 GitHubStats 表结构:
--    \d "GitHubStats"
--    应该包含: commitsWeek, reposWeek, commitsMonth 等新字段
--
-- 4. 检查备份表:
--    SELECT COUNT(*) FROM "GitHubStats_backup_20251025";
--    (如果有数据则显示备份的行数)
-- ============================================================================

-- 迁移完成标记
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema 修复迁移完成';
  RAISE NOTICE '时间: 2025-10-25 06:00:00';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已修复问题:';
  RAISE NOTICE '1. SyncJobLog.platform: 枚举 → TEXT';
  RAISE NOTICE '2. CredentialPlatform: 添加 3 个新值';
  RAISE NOTICE '3. GitHubStats: 重建表结构';
  RAISE NOTICE '========================================';
  RAISE NOTICE '重要: 请立即测试凭据同步功能';
  RAISE NOTICE '========================================';
END $$;
