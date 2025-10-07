-- CreateEnum
CREATE TYPE "public"."MomentVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."MomentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- CreateTable
CREATE TABLE "public"."Moment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" JSONB,
    "visibility" "public"."MomentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "slug" TEXT,
    "tags" TEXT[],
    "location" JSONB,
    "lang" TEXT NOT NULL DEFAULT 'en-US',
    "status" "public"."MomentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "scheduledAt" TIMESTAMP(3),
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Moment_slug_key" ON "public"."Moment"("slug");

-- CreateIndex
CREATE INDEX "Moment_createdAt_visibility_lang_idx" ON "public"."Moment"("createdAt", "visibility", "lang");

-- CreateIndex
CREATE INDEX "Moment_status_idx" ON "public"."Moment"("status");

-- AddForeignKey
ALTER TABLE "public"."Moment" ADD CONSTRAINT "Moment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Moment" ADD CONSTRAINT "Moment_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."Moment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
