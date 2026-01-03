/**
 * Fix image dimensions in database
 *
 * Problem: Images uploaded before the fix have swapped width/height due to EXIF rotation
 * This script downloads each medium.webp, extracts actual dimensions, and updates the database
 *
 * Usage: npx tsx scripts/fix-image-dimensions.ts
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { getStorageProviderAsync } from '../src/lib/storage';

const prisma = new PrismaClient();

async function fixImageDimensions() {
  console.log('🔍 Fetching all gallery images with dimensions...');

  const images = await prisma.galleryImage.findMany({
    where: {
      mediumPath: { not: null },
      width: { not: null },
      height: { not: null },
    },
    select: {
      id: true,
      mediumPath: true,
      width: true,
      height: true,
    },
  });

  console.log(`📊 Found ${images.length} images to check`);

  const storage = await getStorageProviderAsync();
  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const image of images) {
    try {
      if (!image.mediumPath) {
        console.log(`\n📷 Image ${image.id}: No mediumPath, skipping`);
        skippedCount++;
        continue;
      }

      // Check if mediumPath is already a full URL or just a path
      const mediumUrl = image.mediumPath.startsWith('http')
        ? image.mediumPath
        : storage.getPublicUrl(image.mediumPath);

      console.log(`\n📷 Checking image ${image.id}`);
      console.log(`   Current DB: ${image.width}×${image.height}`);

      // Download and check actual dimensions
      const response = await fetch(mediumUrl);
      if (!response.ok) {
        console.log(`   ❌ Failed to fetch: ${response.status}`);
        errorCount++;
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(buffer).metadata();

      const actualWidth = metadata.width;
      const actualHeight = metadata.height;

      console.log(`   Actual size: ${actualWidth}×${actualHeight}`);

      // Check if dimensions need fixing
      if (image.width === actualWidth && image.height === actualHeight) {
        console.log(`   ✅ Already correct, skipping`);
        skippedCount++;
        continue;
      }

      // Update database
      await prisma.galleryImage.update({
        where: { id: image.id },
        data: {
          width: actualWidth,
          height: actualHeight,
        },
      });

      console.log(`   ✅ Fixed: ${image.width}×${image.height} → ${actualWidth}×${actualHeight}`);
      fixedCount++;

    } catch (error) {
      console.log(`   ❌ Error processing image ${image.id}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Fixed: ${fixedCount}`);
  console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

fixImageDimensions()
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
