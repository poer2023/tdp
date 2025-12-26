-- CreateTable
CREATE TABLE "NowPlaying" (
    "id" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "albumName" TEXT,
    "artworkUrl" TEXT,
    "duration" INTEGER,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'apple_music',

    CONSTRAINT "NowPlaying_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NowPlaying_playedAt_idx" ON "NowPlaying"("playedAt");
