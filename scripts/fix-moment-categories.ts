/**
 * Script to identify moment images and migrate them to MOMENT category
 * Run with: npx tsx scripts/fix-moment-categories.ts
 */

import prisma from '../src/lib/prisma';

async function main() {
    console.log('Finding moments with images...');

    // Get all moments with images
    const moments = await prisma.moment.findMany({
        where: {
            images: { not: null },
        },
        select: {
            id: true,
            images: true,
        },
    });

    console.log(`Found ${moments.length} moments with images`);

    // Extract all image URLs from moments
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

    console.log(`Found ${momentImageUrls.size} unique image URLs in moments`);

    if (momentImageUrls.size === 0) {
        console.log('No moment images found. Nothing to migrate.');
        return;
    }

    // Find gallery images that match moment image URLs
    const urlArray = Array.from(momentImageUrls);

    // Match by filePath
    const matchingImages = await prisma.galleryImage.findMany({
        where: {
            filePath: { in: urlArray },
        },
        select: {
            id: true,
            filePath: true,
            category: true,
        },
    });

    console.log(`Found ${matchingImages.length} matching gallery images`);

    if (matchingImages.length === 0) {
        console.log('\nNo matching gallery images found.');
        console.log('Sample moment URLs:', urlArray.slice(0, 3));
        return;
    }

    // Filter to images not already in MOMENT category
    const toMigrate = matchingImages.filter(img => img.category !== 'MOMENT');

    console.log(`\n${toMigrate.length} images need to be migrated to MOMENT category`);

    if (toMigrate.length === 0) {
        console.log('All moment images are already in MOMENT category!');
        return;
    }

    // Update them to MOMENT category
    const result = await prisma.galleryImage.updateMany({
        where: {
            id: { in: toMigrate.map(img => img.id) },
        },
        data: {
            category: 'MOMENT',
        },
    });

    console.log(`✅ Successfully migrated ${result.count} images to MOMENT category.`);

    // Final distribution
    const finalStats = await prisma.galleryImage.groupBy({
        by: ['category'],
        _count: { id: true },
    });

    console.log('\nFinal category distribution:');
    finalStats.forEach((stat) => {
        console.log(`  ${stat.category}: ${stat._count.id} images`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
