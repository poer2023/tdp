/**
 * Script to migrate historical gallery images from REPOST to ORIGINAL category
 * Run with: npx tsx scripts/migrate-gallery-categories.ts
 */

import prisma from '../src/lib/prisma';

async function main() {
    console.log('Checking current gallery image categories...');

    // Get current distribution
    const categoryStats = await prisma.galleryImage.groupBy({
        by: ['category'],
        _count: { id: true },
    });

    console.log('Current category distribution:');
    categoryStats.forEach((stat) => {
        console.log(`  ${stat.category}: ${stat._count.id} images`);
    });

    // Count REPOST images to migrate
    const repostCount = await prisma.galleryImage.count({
        where: { category: 'REPOST' },
    });

    if (repostCount === 0) {
        console.log('\nNo REPOST images found. Nothing to migrate.');
        return;
    }

    console.log(`\nMigrating ${repostCount} images from REPOST to ORIGINAL...`);

    // Update all REPOST images to ORIGINAL
    const result = await prisma.galleryImage.updateMany({
        where: { category: 'REPOST' },
        data: { category: 'ORIGINAL' },
    });

    console.log(`✅ Successfully migrated ${result.count} images to ORIGINAL category.`);

    // Verify final distribution
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
