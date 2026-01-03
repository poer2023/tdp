/**
 * Migrate local images to R2 storage
 *
 * This script:
 * 1. Finds all Moments with local image paths (/api/uploads/...)
 * 2. Reads local files and generates thumbnails
 * 3. Uploads to R2 with correct dimensions (fixing EXIF rotation issue)
 * 4. Updates Moment.images with R2 URLs
 */

import { PrismaClient } from '@prisma/client';
import { S3Storage } from '../src/lib/storage/s3-storage';
import { generateThumbnails, getThumbnailFilename } from '../src/lib/image-processor';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

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

async function migrateLocalImagesToR2() {
  console.log('🚀 Starting local images to R2 migration...\n');

  // Initialize S3Storage
  const storage = new S3Storage();

  const moments = await prisma.moment.findMany({
    where: { images: { not: null } },
    select: { id: true, images: true },
  });

  console.log(`📊 Found ${moments.length} moments to check\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const moment of moments) {
    const images = moment.images as MomentImage[];
    if (!Array.isArray(images) || images.length === 0) {
      skippedCount++;
      continue;
    }

    console.log(`\n📷 Checking moment ${moment.id.slice(0, 12)}... (${images.length} images)`);

    let needsUpdate = false;
    const updatedImages: MomentImage[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i]!;

      // Skip if already using R2 (CDN URL)
      if (!img.url.startsWith('/api/uploads/') && !img.url.startsWith('/uploads/')) {
        console.log(`   ✅ Image ${i + 1}: Already on R2 - ${img.url.slice(0, 50)}...`);
        updatedImages.push(img);
        continue;
      }

      console.log(`   🔄 Image ${i + 1}: Migrating from local path ${img.url}`);

      try {
        // Construct local file path
        const localPath = path.join(
          process.cwd(),
          'public',
          img.url.replace(/^\/api/, '')
        );

        console.log(`      Reading: ${localPath}`);

        // Read local file
        const buffer = await fs.readFile(localPath);

        // Extract original dimensions BEFORE rotation (fixing EXIF issue)
        const metadata = await sharp(buffer).metadata();
        const originalWidth = metadata.width ?? null;
        const originalHeight = metadata.height ?? null;

        console.log(`      Original dimensions: ${originalWidth}×${originalHeight}`);

        // Generate new filename
        const fileExt = path.extname(localPath);
        const baseFilename = randomUUID();

        // Generate thumbnails (these will apply EXIF rotation)
        console.log(`      Generating thumbnails...`);
        const thumbnails = await generateThumbnails(buffer, {
          micro: 64,
          small: 720,
          medium: 1600,
          quality: 82,
        });

        // Extract actual dimensions from medium thumbnail (after rotation)
        const mediumMeta = await sharp(thumbnails.medium).metadata();
        const actualWidth = mediumMeta.width ?? null;
        const actualHeight = mediumMeta.height ?? null;

        console.log(`      Thumbnail dimensions: ${actualWidth}×${actualHeight}`);

        // Upload original
        console.log(`      Uploading to R2...`);
        const originalKey = await storage.upload(
          buffer,
          `${baseFilename}${fileExt}`,
          metadata.format ? `image/${metadata.format}` : 'image/jpeg'
        );

        // Upload thumbnails
        const microKey = await storage.upload(
          thumbnails.micro,
          getThumbnailFilename(baseFilename, 'micro'),
          'image/webp'
        );

        const smallKey = await storage.upload(
          thumbnails.small,
          getThumbnailFilename(baseFilename, 'small'),
          'image/webp'
        );

        const mediumKey = await storage.upload(
          thumbnails.medium,
          getThumbnailFilename(baseFilename, 'medium'),
          'image/webp'
        );

        // Get public URLs
        const url = storage.getPublicUrl(originalKey);
        const microThumbUrl = storage.getPublicUrl(microKey);
        const smallThumbUrl = storage.getPublicUrl(smallKey);
        const mediumUrl = storage.getPublicUrl(mediumKey);

        console.log(`      ✅ Uploaded successfully`);
        console.log(`         URL: ${mediumUrl.slice(0, 60)}...`);

        // Create updated image object with correct dimensions
        updatedImages.push({
          url,
          w: actualWidth,  // Use thumbnail dimensions (after EXIF rotation)
          h: actualHeight,
          previewUrl: url,
          microThumbUrl,
          smallThumbUrl,
          mediumUrl,
        });

        needsUpdate = true;
        console.log(`      ✅ Migration complete for image ${i + 1}`);
      } catch (error) {
        console.error(`   ❌ Error migrating image ${i + 1}:`, error);
        // Keep original data on error
        updatedImages.push(img);
        errorCount++;
      }
    }

    if (needsUpdate) {
      // Update moment with new R2 URLs and correct dimensions
      await prisma.moment.update({
        where: { id: moment.id },
        data: { images: updatedImages },
      });
      console.log(`   ✅ Moment ${moment.id.slice(0, 12)}... updated in database`);
      migratedCount++;
    } else {
      console.log(`   ⏭️  Moment ${moment.id.slice(0, 12)}... - no migration needed`);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Moments migrated: ${migratedCount}`);
  console.log(`   ⏭️  Moments skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

migrateLocalImagesToR2()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
