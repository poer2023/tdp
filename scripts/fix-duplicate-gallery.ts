/**
 * Fix Duplicate Gallery Images
 * 
 * This script removes duplicate GalleryImage records based on filePath,
 * keeping only the oldest record for each unique filePath.
 * 
 * Run via: npx tsx scripts/fix-duplicate-gallery.ts
 */

import prisma from "../src/lib/prisma";

async function fixDuplicateGallery() {
    console.log("🔍 Checking for duplicate gallery images...");

    // Find duplicates
    const duplicates = await prisma.$queryRaw<Array<{ filePath: string; count: bigint }>>`
    SELECT "filePath", COUNT(*) as count
    FROM "GalleryImage"
    GROUP BY "filePath"
    HAVING COUNT(*) > 1
  `;

    if (duplicates.length === 0) {
        console.log("✅ No duplicate gallery images found.");
        return;
    }

    console.log(`⚠️  Found ${duplicates.length} file paths with duplicates:`);
    for (const dup of duplicates) {
        console.log(`   - ${dup.filePath} (${dup.count} copies)`);
    }

    // Delete duplicates, keeping the oldest (smallest id)
    const result = await prisma.$executeRaw`
    DELETE FROM "GalleryImage" a
    USING "GalleryImage" b
    WHERE a."createdAt" > b."createdAt" 
      AND a."filePath" = b."filePath"
  `;

    console.log(`🗑️  Deleted ${result} duplicate records.`);
    console.log("✅ Duplicate cleanup complete.");
}

async function main() {
    try {
        await fixDuplicateGallery();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
