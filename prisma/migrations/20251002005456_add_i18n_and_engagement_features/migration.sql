-- CreateEnum
CREATE TYPE "PostLocale" AS ENUM ('EN', 'ZH');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "locale" "PostLocale" NOT NULL DEFAULT 'EN',
ADD COLUMN "groupId" TEXT;

-- AlterTable: Remove the unique constraint on slug first, then add new constraints
ALTER TABLE "Post" DROP CONSTRAINT "Post_slug_key";

-- CreateTable: PostAlias
CREATE TABLE "PostAlias" (
    "id" TEXT NOT NULL,
    "locale" "PostLocale" NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReactionAggregate
CREATE TABLE "ReactionAggregate" (
    "postId" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReactionAggregate_pkey" PRIMARY KEY ("postId")
);

-- CreateTable: Reaction
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sessionKeyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Comment
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "ipHash" TEXT,
    "userAgent" TEXT,
    "locale" "PostLocale" NOT NULL DEFAULT 'EN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostAlias_locale_oldSlug_key" ON "PostAlias"("locale", "oldSlug");

-- CreateIndex
CREATE INDEX "PostAlias_postId_idx" ON "PostAlias"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_sessionKeyHash_key" ON "Reaction"("postId", "sessionKeyHash");

-- CreateIndex
CREATE INDEX "Reaction_sessionKeyHash_idx" ON "Reaction"("sessionKeyHash");

-- CreateIndex
CREATE INDEX "Comment_postId_status_idx" ON "Comment"("postId", "status");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_locale_slug_key" ON "Post"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Post_groupId_locale_key" ON "Post"("groupId", "locale");

-- CreateIndex
CREATE INDEX "Post_status_locale_idx" ON "Post"("status", "locale");

-- AddForeignKey
ALTER TABLE "PostAlias" ADD CONSTRAINT "PostAlias_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionAggregate" ADD CONSTRAINT "ReactionAggregate_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
