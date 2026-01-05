
/**
 * Fix Storage Type
 * 
 * Updates GalleryImage records where filePath is a remote URL but storageType is "local".
 * Sets storageType to "r2".
 */

import prisma from "../src/lib/prisma";

async function fixStorageType(dryRun: boolean) {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(dryRun ? "🔍 DRY RUN: Checking storageType mismatches..." : "⚡ FIXING storageType mismatches...");

    const images = await prisma.galleryImage.findMany({
        where: {
            storageType: "local",
            filePath: { startsWith: "http" }
        },
        select: { id: true, filePath: true, storageType: true }
    });

    console.log(`Found ${images.length} records with local storageType but remote URL.`);

    if (images.length === 0) return;

    if (!dryRun) {
        console.log("Updating records to storageType='r2'...");

        // Batch update
        const result = await prisma.galleryImage.updateMany({
            where: {
                storageType: "local",
                filePath: { startsWith: "http" }
            },
            data: {
                storageType: "r2"
            }
        });

        console.log(`✅ Updated ${result.count} records.`);
    } else {
        console.log("Sample records:");
        images.slice(0, 5).forEach(img => {
            console.log(`- [${img.id}] ${img.filePath.slice(0, 50)}... (${img.storageType}) -> r2`);
        });
        console.log("\nRun without --dry-run to apply changes.");
    }
}

const dryRun = process.argv.includes("--dry-run");

fixStorageType(dryRun)
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
