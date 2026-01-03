/**
 * Fix image dimensions in Moment table
 *
 * Problem: Images uploaded before the fix have swapped width/height due to EXIF rotation
 * The images are stored in Moment.images JSON field, not GalleryImage table
 * This script downloads each image, extracts actual dimensions, and updates the Moment.images
 *
 * Usage: npx tsx scripts/fix-moment-image-dimensions.ts
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

interface MomentImage {
  url: string;
  w?: number | null;
  h?: number | null;
  previewUrl?: string;
  microThumbUrl?: string;
  smallThumbUrl?: string;
  mediumUrl?: string;
}

async function fixMomentImageDimensions() {
  console.log('🔍 Fetching all moments with images...');

  const moments = await prisma.moment.findMany({
    where: {
      images: { not: null },
    },
    select: {
      id: true,
      images: true,
    },
  });

  console.log(`📊 Found ${moments.length} moments to check`);

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const moment of moments) {
    try {
      const images = moment.images as MomentImage[];

      if (!Array.isArray(images) || images.length === 0) {
        skippedCount++;
        continue;
      }

      console.log(`\n📷 Checking moment ${moment.id} (${images.length} images)`);

      let needsUpdate = false;
      const updatedImages: MomentImage[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i]!;

        // Get the URL to fetch - prefer mediumUrl for faster download
        const fetchUrl = img.mediumUrl || img.url;

        if (!fetchUrl) {
          console.log(`   Image ${i + 1}: No URL, keeping as-is`);
          updatedImages.push(img);
          continue;
        }

        console.log(`   Image ${i + 1}: Current ${img.w}×${img.h}`);

        try {
          // Download and check actual dimensions
          const response = await fetch(fetchUrl);
          if (!response.ok) {
            console.log(`   ❌ Failed to fetch: ${response.status}`);
            updatedImages.push(img);
            errorCount++;
            continue;
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          const metadata = await sharp(buffer).metadata();

          const actualWidth = metadata.width ?? null;
          const actualHeight = metadata.height ?? null;

          console.log(`   Actual size: ${actualWidth}×${actualHeight}`);

          // Check if dimensions need fixing
          if (img.w === actualWidth && img.h === actualHeight) {
            console.log(`   ✅ Already correct`);
            updatedImages.push(img);
          } else {
            console.log(`   🔧 Fixing: ${img.w}×${img.h} → ${actualWidth}×${actualHeight}`);
            updatedImages.push({
              ...img,
              w: actualWidth,
              h: actualHeight,
            });
            needsUpdate = true;
          }
        } catch (imgError) {
          console.log(`   ❌ Error processing image ${i + 1}:`, imgError);
          updatedImages.push(img);
          errorCount++;
        }
      }

      if (needsUpdate) {
        // Update the moment with corrected image dimensions
        await prisma.moment.update({
          where: { id: moment.id },
          data: { images: updatedImages },
        });
        console.log(`   ✅ Moment updated`);
        fixedCount++;
      } else {
        skippedCount++;
      }

    } catch (error) {
      console.log(`   ❌ Error processing moment ${moment.id}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Fixed moments: ${fixedCount}`);
  console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

fixMomentImageDimensions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
