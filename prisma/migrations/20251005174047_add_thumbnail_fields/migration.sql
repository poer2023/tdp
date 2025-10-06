/*
  Warnings:

  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- AlterTable
ALTER TABLE "public"."GalleryImage" ADD COLUMN     "mediumPath" TEXT,
ADD COLUMN     "microThumbPath" TEXT,
ADD COLUMN     "smallThumbPath" TEXT;

-- DropTable
DROP TABLE "public"."Comment";

-- DropEnum
DROP TYPE "public"."CommentStatus";
