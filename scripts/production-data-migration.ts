/**
 * Production data migration script
 * This script runs automatically during build to fix gallery categories
 * Run manually with: npx tsx scripts/production-data-migration.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateGalleryCategories() {
    console.log('🔄 [Migration] Checking gallery image categories...');

    // Get current distribution
    const categoryStats = await prisma.galleryImage.groupBy({
        by: ['category'],
        _count: { id: true },
    });

    console.log('[Migration] Current category distribution:');
    categoryStats.forEach((stat) => {
        console.log(`  ${stat.category}: ${stat._count.id} images`);
    });

    // Step 1: Migrate REPOST images to ORIGINAL (except moment images)
    // First, get moment image filePaths
    const moments = await prisma.moment.findMany({
        where: {
            NOT: { images: { equals: Prisma.DbNull } }
        },
        select: { images: true },
    });

    const momentImageUrls = new Set<string>();
    for (const moment of moments) {
        if (moment.images && Array.isArray(moment.images)) {
            for (const img of moment.images as any[]) {
                if (img.url) {
                    momentImageUrls.add(img.url);
                }
            }
        }
    }
    console.log(`[Migration] Found ${momentImageUrls.size} moment image URLs`);

    // Step 2: Update moment images to MOMENT category
    if (momentImageUrls.size > 0) {
        const urlArray = Array.from(momentImageUrls);
        const momentResult = await prisma.galleryImage.updateMany({
            where: {
                filePath: { in: urlArray },
                category: { not: 'MOMENT' },
            },
            data: { category: 'MOMENT' },
        });
        if (momentResult.count > 0) {
            console.log(`✅ [Migration] Migrated ${momentResult.count} images to MOMENT category`);
        }
    }

    // Step 3: Update remaining REPOST images to ORIGINAL
    const repostResult = await prisma.galleryImage.updateMany({
        where: { category: 'REPOST' },
        data: { category: 'ORIGINAL' },
    });
    if (repostResult.count > 0) {
        console.log(`✅ [Migration] Migrated ${repostResult.count} images from REPOST to ORIGINAL`);
    }

    // Final stats
    const finalStats = await prisma.galleryImage.groupBy({
        by: ['category'],
        _count: { id: true },
    });

    console.log('[Migration] Final category distribution:');
    finalStats.forEach((stat) => {
        console.log(`  ${stat.category}: ${stat._count.id} images`);
    });

    console.log('✅ [Migration] Gallery category migration complete!');
}

async function extractMissingExifData() {
    console.log('🔄 [EXIF] Checking for images missing location data...');

    // Count images without location
    const imagesWithoutLocation = await prisma.galleryImage.count({
        where: {
            latitude: null,
            longitude: null,
        },
    });

    console.log(`[EXIF] Found ${imagesWithoutLocation} images without location data`);
    // Note: EXIF extraction requires the actual image files, which can't be done at build time
    // This would need to be done via a separate API endpoint or background job

    if (imagesWithoutLocation > 0) {
        console.log('[EXIF] ℹ️  To extract EXIF data, images need to be re-processed via the admin panel');
    }
}

async function main() {
    console.log('🚀 Starting production data migration...\n');

    try {
        await migrateGalleryCategories();
        await extractMissingExifData();
        console.log('\n🎉 Production data migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration error:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
