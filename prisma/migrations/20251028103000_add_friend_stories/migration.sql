-- CreateEnum
CREATE TYPE "FriendVisibility" AS ENUM ('PUBLIC', 'FRIEND_ONLY', 'PRIVATE');

-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Moment"
    ADD COLUMN     "friendVisibility" "FriendVisibility" NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN     "friendId" TEXT,
    ADD COLUMN     "happenedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Friend_accessToken_key" ON "Friend"("accessToken");
CREATE UNIQUE INDEX "Friend_slug_key" ON "Friend"("slug");
CREATE INDEX "Friend_slug_idx" ON "Friend"("slug");
CREATE INDEX "Friend_accessToken_idx" ON "Friend"("accessToken");
CREATE INDEX "Moment_friendVisibility_friendId_idx" ON "Moment"("friendVisibility", "friendId");
CREATE INDEX "Moment_happenedAt_idx" ON "Moment"("happenedAt");

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE SET NULL ON UPDATE CASCADE;
