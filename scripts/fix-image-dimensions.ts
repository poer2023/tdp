/**
 * Fix image dimensions in database
 *
 * Problem: Images uploaded before the fix have incorrect width/height due to:
 * 1. No dimensions stored at all
 * 2. EXIF rotation not handled correctly
 * 
 * This script downloads each original image, extracts actual dimensions 
 * with EXIF orientation handling, and updates the database
 *
 * Usage: npx tsx scripts/fix-image-dimensions.ts
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) {
      console.log(`   ❌ Failed to fetch: ${response.status}`);
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.log(`   ❌ Fetch error:`, error);
    return null;
  }
}

async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
      return null;
    }

    let width = meta.width;
    let height = meta.height;

    // EXIF orientation 5-8 means the image is rotated 90° or 270°
    // In these cases, width and height need to be swapped
    if (meta.orientation && meta.orientation >= 5) {
      [width, height] = [height, width];
      console.log(`   📐 EXIF orientation ${meta.orientation}: swapped ${meta.width}×${meta.height} → ${width}×${height}`);
    }

    return { width, height };
  } catch {
    return null;
  }
}

async function fixImageDimensions() {
  console.log('🔍 Fetching all gallery images...\n');

  // Get all images (including those without dimensions)
  const images = await prisma.galleryImage.findMany({
    where: {
      OR: [
        { mimeType: { startsWith: 'image/' } },
        { mimeType: null }, // Legacy records
      ],
    },
    select: {
      id: true,
      title: true,
      filePath: true,
      mediumPath: true,
      width: true,
      height: true,
      mimeType: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Found ${images.length} images to check\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const shortTitle = (image.title || 'Untitled').slice(0, 25).padEnd(25);

    process.stdout.write(`[${i + 1}/${images.length}] ${shortTitle} `);

    // Skip videos
    if (image.mimeType?.startsWith('video/')) {
      console.log('⏭️ video');
      skippedCount++;
      continue;
    }

    // Use original file for accurate dimensions
    const imageUrl = image.filePath;
    if (!imageUrl) {
      console.log('❌ no file path');
      errorCount++;
      continue;
    }

    // Fetch and analyze
    const buffer = await fetchImageBuffer(imageUrl);
    if (!buffer) {
      errorCount++;
      continue;
    }

    const dimensions = await getImageDimensions(buffer);
    if (!dimensions) {
      console.log('❌ failed to get dimensions');
      errorCount++;
      continue;
    }

    // Check if update is needed
    if (image.width === dimensions.width && image.height === dimensions.height) {
      console.log(`✅ correct (${dimensions.width}×${dimensions.height})`);
      skippedCount++;
      continue;
    }

    // Update database
    await prisma.galleryImage.update({
      where: { id: image.id },
      data: {
        width: dimensions.width,
        height: dimensions.height,
      },
    });

    const oldDim = image.width && image.height ? `${image.width}×${image.height}` : 'null';
    console.log(`🔧 fixed: ${oldDim} → ${dimensions.width}×${dimensions.height}`);
    fixedCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   🔧 Fixed: ${fixedCount}`);
  console.log(`   ✅ Already correct: ${skippedCount}`);
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
