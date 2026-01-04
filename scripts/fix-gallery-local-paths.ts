/**
 * Fix Gallery Local Paths to R2 URLs
 * 
 * This script fixes gallery images that have local paths (/api/uploads/...)
 * stored in thumbnail fields, converting them to full R2 CDN URLs.
 * 
 * Usage:
 *   Dry run (preview only):  npx tsx scripts/fix-gallery-local-paths.ts --dry-run
 *   Execute fixes:           npx tsx scripts/fix-gallery-local-paths.ts
 */

import prisma from "../src/lib/prisma";
import { getStorageConfigAsync } from "../src/lib/storage/config";

interface ImageFix {
    id: string;
    field: string;
    oldValue: string;
    newValue: string;
}

async function fixGalleryLocalPaths(dryRun: boolean) {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(dryRun ? "🔍 DRY RUN MODE - No changes will be made" : "⚡ EXECUTE MODE - Changes will be applied");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const config = await getStorageConfigAsync();

    if (!config.cdnUrl) {
        console.error("❌ R2 CDN URL not configured. Please configure storage first.");
        process.exit(1);
    }

    const cdnUrl = config.cdnUrl;
    console.log(`📡 R2 CDN URL: ${cdnUrl}\n`);

    // Fetch all gallery images
    const images = await prisma.galleryImage.findMany({
        select: {
            id: true,
            filePath: true,
            microThumbPath: true,
            smallThumbPath: true,
            mediumPath: true,
        },
    });

    console.log(`📊 Total GalleryImage records: ${images.length}\n`);

    const allFixes: ImageFix[] = [];
    let skipped = 0;

    // Helper to convert local path to R2 URL
    const convertToR2 = (localPath: string | null): string | null => {
        if (!localPath) return null;

        // Already an R2 URL or other http(s) URL
        if (localPath.startsWith("http")) return null;

        // Extract filename from local path
        // /api/uploads/gallery/xxx_small.webp -> xxx_small.webp
        // /uploads/gallery/xxx.jpg -> xxx.jpg
        const match = localPath.match(/\/(?:api\/)?uploads\/gallery\/(.+?)(?:\?.*)?$/);
        if (match && match[1]) {
            return `${cdnUrl}/gallery/${match[1]}`;
        }

        return null;
    };

    for (const image of images) {
        const updates: Record<string, string> = {};
        const fixes: ImageFix[] = [];

        // Check filePath (main file)
        const newFilePath = convertToR2(image.filePath);
        if (newFilePath) {
            updates.filePath = newFilePath;
            fixes.push({ id: image.id, field: "filePath", oldValue: image.filePath!, newValue: newFilePath });
        }

        // Check each thumbnail path
        const newMicro = convertToR2(image.microThumbPath);
        if (newMicro) {
            updates.microThumbPath = newMicro;
            fixes.push({ id: image.id, field: "microThumbPath", oldValue: image.microThumbPath!, newValue: newMicro });
        }

        const newSmall = convertToR2(image.smallThumbPath);
        if (newSmall) {
            updates.smallThumbPath = newSmall;
            fixes.push({ id: image.id, field: "smallThumbPath", oldValue: image.smallThumbPath!, newValue: newSmall });
        }

        const newMedium = convertToR2(image.mediumPath);
        if (newMedium) {
            updates.mediumPath = newMedium;
            fixes.push({ id: image.id, field: "mediumPath", oldValue: image.mediumPath!, newValue: newMedium });
        }

        if (fixes.length > 0) {
            allFixes.push(...fixes);

            if (!dryRun) {
                await prisma.galleryImage.update({
                    where: { id: image.id },
                    data: updates,
                });
            }
        } else {
            skipped++;
        }
    }

    // Print detailed report
    console.log("───────────────────────────────────────────────────────────────");
    console.log("📋 DETAILED FIXES REPORT");
    console.log("───────────────────────────────────────────────────────────────\n");

    if (allFixes.length === 0) {
        console.log("✅ No local paths found! All paths are already correct.\n");
    } else {
        // Group by image ID
        const fixesByImage = allFixes.reduce((acc, fix) => {
            if (!acc[fix.id]) acc[fix.id] = [];
            acc[fix.id].push(fix);
            return acc;
        }, {} as Record<string, ImageFix[]>);

        for (const [imageId, fixes] of Object.entries(fixesByImage)) {
            console.log(`📷 Image: ${imageId}`);
            for (const fix of fixes) {
                console.log(`   ${fix.field}:`);
                console.log(`     ❌ OLD: ${fix.oldValue}`);
                console.log(`     ✅ NEW: ${fix.newValue}`);
            }
            console.log("");
        }
    }

    // Summary
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("📈 SUMMARY");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`   Total images scanned:  ${images.length}`);
    console.log(`   Images needing fixes:  ${Object.keys(allFixes.reduce((acc, f) => { acc[f.id] = true; return acc; }, {} as Record<string, boolean>)).length}`);
    console.log(`   Total fields to fix:   ${allFixes.length}`);
    console.log(`   Already correct:       ${skipped}`);

    if (dryRun && allFixes.length > 0) {
        console.log("\n⚠️  DRY RUN - No changes were made.");
        console.log("   To apply these fixes, run:");
        console.log("   npx tsx scripts/fix-gallery-local-paths.ts");
    } else if (!dryRun && allFixes.length > 0) {
        console.log("\n✅ All fixes have been applied!");
    }
    console.log("");
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run") || args.includes("-n");

    try {
        await fixGalleryLocalPaths(dryRun);
    } catch (error) {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
