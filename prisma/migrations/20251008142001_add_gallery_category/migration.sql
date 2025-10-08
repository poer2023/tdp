-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('REPOST', 'ORIGINAL', 'AI');

-- AlterTable
ALTER TABLE "GalleryImage" ADD COLUMN     "category" "GalleryCategory" NOT NULL DEFAULT 'REPOST';
