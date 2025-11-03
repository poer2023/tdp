-- ============================================================================
-- Friend 功能重设计：移除 slug 字段，改为口令认证
-- ============================================================================

-- 删除 slug 相关索引
DROP INDEX IF EXISTS "Friend_slug_idx";
DROP INDEX IF EXISTS "Friend_slug_key";

-- 删除 slug 列
ALTER TABLE "Friend" DROP COLUMN IF EXISTS "slug";

-- accessToken 字段保持不变（存储 bcrypt 哈希的口令）
-- 索引 Friend_accessToken_idx 和 Friend_accessToken_key 保持不变
