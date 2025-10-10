-- AlterTable
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "relatedPostIds" JSONB;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_viewCount_idx" ON "Post"("viewCount");
