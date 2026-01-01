-- Migration: Replace AI with MOMENT in GalleryCategory enum
-- Step 1: First migrate all AI images to ORIGINAL
UPDATE "GalleryImage" SET category = 'ORIGINAL' WHERE category = 'AI';

-- Step 2: Drop the default constraint on category column temporarily
ALTER TABLE "GalleryImage" ALTER COLUMN category DROP DEFAULT;

-- Step 3: Create new enum type with MOMENT instead of AI
CREATE TYPE "GalleryCategory_new" AS ENUM ('REPOST', 'ORIGINAL', 'MOMENT');

-- Step 4: Convert existing column to new enum
ALTER TABLE "GalleryImage" 
  ALTER COLUMN category TYPE "GalleryCategory_new" 
  USING (category::text::"GalleryCategory_new");

-- Step 5: Drop old enum
DROP TYPE "GalleryCategory";

-- Step 6: Rename new enum
ALTER TYPE "GalleryCategory_new" RENAME TO "GalleryCategory";

-- Step 7: Restore default (keeping REPOST as default to match original schema)
ALTER TABLE "GalleryImage" ALTER COLUMN category SET DEFAULT 'REPOST'::"GalleryCategory";
