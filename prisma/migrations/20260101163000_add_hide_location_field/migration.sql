-- Add hideLocation field to GalleryImage
ALTER TABLE "GalleryImage" ADD COLUMN IF NOT EXISTS "hideLocation" BOOLEAN NOT NULL DEFAULT false;
