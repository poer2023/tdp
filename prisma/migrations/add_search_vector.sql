-- 优化全文搜索性能
-- 为 Post 表添加预计算的 tsvector 列

-- 1. 添加 searchVector 列（GENERATED 列会自动更新）
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      COALESCE(title, '') || ' ' ||
      COALESCE(excerpt, '') || ' ' ||
      COALESCE(content, '') || ' ' ||
      COALESCE(tags, '')
    )
  ) STORED;

-- 2. 为 searchVector 列创建 GIN 索引以加速搜索
CREATE INDEX IF NOT EXISTS "idx_post_search_vector"
  ON "Post" USING GIN ("searchVector");

-- 3. （可选）为 GalleryImage 表添加类似优化
ALTER TABLE "GalleryImage" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      COALESCE(title, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE("locationName", '') || ' ' ||
      COALESCE(city, '') || ' ' ||
      COALESCE(country, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS "idx_gallery_search_vector"
  ON "GalleryImage" USING GIN ("searchVector");

-- 4. （可选）为 Moment 表添加类似优化
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      COALESCE(content, '') || ' ' ||
      array_to_string(tags, ' ')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS "idx_moment_search_vector"
  ON "Moment" USING GIN ("searchVector");

-- 说明：
-- 这些 GENERATED 列会在插入或更新记录时自动计算，无需手动维护。
-- 搜索时直接使用 searchVector 列可以避免实时计算 to_tsvector，大幅提升性能。
--
-- 运行此迁移：
-- psql -U your_user -d your_database -f prisma/migrations/add_search_vector.sql
--
-- 或者使用 Prisma：
-- npx prisma db execute --file prisma/migrations/add_search_vector.sql --schema prisma/schema.prisma
