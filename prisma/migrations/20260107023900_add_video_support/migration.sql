-- AddVideoSupport Migration
-- Add video support to Moment and HeroImage models

-- Add videos column to Moment table
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "videos" JSONB;

-- Add video columns to HeroImage table
ALTER TABLE "HeroImage" ADD COLUMN IF NOT EXISTS "mediaType" TEXT NOT NULL DEFAULT 'image';
ALTER TABLE "HeroImage" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "HeroImage" ADD COLUMN IF NOT EXISTS "posterUrl" TEXT;
