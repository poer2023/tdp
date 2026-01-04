/**
 * Fix Moment Image Paths to R2 URLs
 * 
 * This script fixes Moment images that have local paths (/api/uploads/...)
 * stored in the images JSON array, converting them to full R2 CDN URLs.
 * 
 * NOTE: This only fixes URL paths, NOT file uploads. The files must already
 * exist on R2 storage.
 * 
 * Usage:
 *   Dry run (preview only):  npx tsx scripts/fix-moment-local-paths.ts --dry-run
 *   Execute fixes:           npx tsx scripts/fix-moment-local-paths.ts
 */

import prisma from "../src/lib/prisma";
import { getStorageConfigAsync } from "../src/lib/storage/config";

interface MomentImage {
    url: string;
    w?: number | null;
    h?: number | null;
    previewUrl?: string;
    microThumbUrl?: string;
    smallThumbUrl?: string;
    mediumThumbUrl?: string;
    mediumUrl?: string;
}

interface ImageFix {
    momentId: string;
    imageIndex: number;
    field: string;
    oldValue: string;
    newValue: string;
}

// Convert local path to R2 URL
function convertToR2(localPath: string | null | undefined, cdnUrl: string): string | null {
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
}

async function fixMomentLocalPaths(dryRun: boolean) {
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

    // Fetch all moments with images
    const moments = await prisma.moment.findMany({
        where: { images: { not: null } },
        select: { id: true, images: true, content: true },
    });

    console.log(`📊 Total Moment records with images: ${moments.length}\n`);

    const allFixes: ImageFix[] = [];
    let momentsSkipped = 0;
    let momentsToFix = 0;

    for (const moment of moments) {
        const images = moment.images as MomentImage[];
        if (!Array.isArray(images) || images.length === 0) {
            momentsSkipped++;
            continue;
        }

        let needsUpdate = false;
        const updatedImages: MomentImage[] = [];
        const fixes: ImageFix[] = [];

        for (let i = 0; i < images.length; i++) {
            const img = images[i]!;
            const newImg = { ...img };

            // Check and fix each URL field
            const urlFields = [
                "url",
                "previewUrl",
                "microThumbUrl",
                "smallThumbUrl",
                "mediumThumbUrl",
                "mediumUrl",
            ] as const;

            for (const field of urlFields) {
                const oldValue = img[field as keyof MomentImage] as string | undefined;
                const newValue = convertToR2(oldValue, cdnUrl);
                if (newValue) {
                    (newImg as Record<string, unknown>)[field] = newValue;
                    fixes.push({
                        momentId: moment.id,
                        imageIndex: i,
                        field,
                        oldValue: oldValue!,
                        newValue,
                    });
                    needsUpdate = true;
                }
            }

            updatedImages.push(newImg);
        }

        if (needsUpdate) {
            momentsToFix++;
            allFixes.push(...fixes);

            if (!dryRun) {
                await prisma.moment.update({
                    where: { id: moment.id },
                    data: { images: updatedImages },
                });
            }
        } else {
            momentsSkipped++;
        }
    }

    // Print detailed report
    console.log("───────────────────────────────────────────────────────────────");
    console.log("📋 DETAILED FIXES REPORT");
    console.log("───────────────────────────────────────────────────────────────\n");

    if (allFixes.length === 0) {
        console.log("✅ No local paths found! All Moment image paths are already correct.\n");
    } else {
        // Group by moment ID
        const fixesByMoment = allFixes.reduce((acc, fix) => {
            if (!acc[fix.momentId]) acc[fix.momentId] = [];
            acc[fix.momentId].push(fix);
            return acc;
        }, {} as Record<string, ImageFix[]>);

        for (const [momentId, fixes] of Object.entries(fixesByMoment)) {
            console.log(`📷 Moment: ${momentId}`);
            for (const fix of fixes) {
                console.log(`   Image[${fix.imageIndex}].${fix.field}:`);
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
    console.log(`   Total moments scanned:  ${moments.length}`);
    console.log(`   Moments needing fixes:  ${momentsToFix}`);
    console.log(`   Total fields to fix:    ${allFixes.length}`);
    console.log(`   Already correct:        ${momentsSkipped}`);

    if (dryRun && allFixes.length > 0) {
        console.log("\n⚠️  DRY RUN - No changes were made.");
        console.log("   To apply these fixes, run:");
        console.log("   npx tsx scripts/fix-moment-local-paths.ts");
    } else if (!dryRun && allFixes.length > 0) {
        console.log("\n✅ All fixes have been applied!");
    }
    console.log("");
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run") || args.includes("-n");

    try {
        await fixMomentLocalPaths(dryRun);
    } catch (error) {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
