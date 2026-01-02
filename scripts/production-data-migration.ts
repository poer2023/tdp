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

    // Step 1: Get moment image filenames (extract from URLs)
    const moments = await prisma.moment.findMany({
        where: {
            NOT: { images: { equals: Prisma.DbNull } }
        },
        select: { images: true },
    });

    // Extract filenames from moment image URLs
    // Moments store URLs like "/api/uploads/gallery/xxx.jpg" or full R2 URLs
    const momentImageFilenames = new Set<string>();
    for (const moment of moments) {
        if (moment.images && Array.isArray(moment.images)) {
            for (const img of moment.images as unknown[]) {
                let url: string | undefined;
                if (typeof img === 'string') {
                    url = img;
                } else if (img && typeof img === 'object') {
                    const record = img as { url?: unknown; filePath?: unknown };
                    url = typeof record.url === 'string' ? record.url : typeof record.filePath === 'string' ? record.filePath : undefined;
                }

                if (url) {
                    // Extract filename from path (last segment after last /)
                    const filename = url.split('/').pop();
                    if (filename) {
                        // Remove size suffix (_micro, _small, _medium) if present
                        const baseFilename = filename.replace(/_(micro|small|medium)\.(webp|jpg|jpeg|png)$/, '');
                        momentImageFilenames.add(baseFilename);
                    }
                }
            }
        }
    }
    console.log(`[Migration] Found ${momentImageFilenames.size} moment image filenames`);

    // Step 2: Update gallery images that match moment filenames to MOMENT category
    // We need to check each gallery image's filename against moment filenames
    if (momentImageFilenames.size > 0) {
        const allGalleryImages = await prisma.galleryImage.findMany({
            where: { category: { not: 'MOMENT' } },
            select: { id: true, filePath: true },
        });

        const idsToUpdate: string[] = [];
        for (const img of allGalleryImages) {
            const filename = img.filePath.split('/').pop();
            if (filename) {
                // Check base filename without extension
                const baseFilename = filename.replace(/\.(webp|jpg|jpeg|png)$/, '');
                // Also check with extension
                if (momentImageFilenames.has(filename) ||
                    momentImageFilenames.has(baseFilename) ||
                    Array.from(momentImageFilenames).some(mf =>
                        filename.includes(mf.replace(/\.[^.]+$/, ''))
                    )) {
                    idsToUpdate.push(img.id);
                }
            }
        }

        if (idsToUpdate.length > 0) {
            const momentResult = await prisma.galleryImage.updateMany({
                where: { id: { in: idsToUpdate } },
                data: { category: 'MOMENT' },
            });
            console.log(`✅ [Migration] Migrated ${momentResult.count} images to MOMENT category`);
        } else {
            console.log('[Migration] No new images to migrate to MOMENT category');
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
