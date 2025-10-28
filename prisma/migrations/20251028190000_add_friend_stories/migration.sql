-- CreateEnum
CREATE TYPE "FriendVisibility" AS ENUM ('PUBLIC', 'FRIEND_ONLY', 'PRIVATE');

-- AlterTable
ALTER TABLE "Moment"
    ADD COLUMN     "friendVisibility" "FriendVisibility" NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN     "friendId" TEXT,
    ADD COLUMN     "happenedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Moment_friendVisibility_friendId_idx" ON "Moment"("friendVisibility", "friendId");

-- CreateIndex
CREATE INDEX "Moment_happenedAt_idx" ON "Moment"("happenedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_accessToken_key" ON "Friend"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_slug_key" ON "Friend"("slug");

-- CreateIndex
CREATE INDEX "Friend_slug_idx" ON "Friend"("slug");

-- CreateIndex
CREATE INDEX "Friend_accessToken_idx" ON "Friend"("accessToken");

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE SET NULL ON UPDATE CASCADE;
