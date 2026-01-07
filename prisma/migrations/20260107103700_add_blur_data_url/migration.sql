-- Add blurDataURL for smooth image loading (LQIP)
-- Base64 encoded blur placeholder for images

-- Add blurDataURL to GalleryImage
ALTER TABLE "GalleryImage" ADD COLUMN IF NOT EXISTS "blurDataURL" TEXT;

-- Add blurDataURL to HeroImage
ALTER TABLE "HeroImage" ADD COLUMN IF NOT EXISTS "blurDataURL" TEXT;
