/**
 * Fix All Local Paths to R2 URLs
 * 
 * This script fixes all local paths (/api/uploads/...) in the database,
 * converting them to full R2 CDN URLs. It covers:
 * 
 * 1. GalleryImage table: filePath, microThumbPath, smallThumbPath, mediumPath
 * 2. Moment table: images JSON array (url, previewUrl, thumbnails, etc.)
 * 3. Storage Type: Updates storageType to "r2" if filePath is remote but storageType is "local"
 * 
 * Usage:
 *   Dry run (preview only):  npx tsx scripts/fix-all-local-paths.ts --dry-run
 *   Execute fixes:           npx tsx scripts/fix-all-local-paths.ts
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

interface Fix {
    table: string;
    recordId: string;
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

async function fixGalleryImages(cdnUrl: string, dryRun: boolean): Promise<Fix[]> {
    const images = await prisma.galleryImage.findMany({
        select: {
            id: true,
            filePath: true,
            microThumbPath: true,
            smallThumbPath: true,
            mediumPath: true,
        },
    });

    const fixes: Fix[] = [];

    for (const image of images) {
        const updates: Record<string, string> = {};

        const fields = ["filePath", "microThumbPath", "smallThumbPath", "mediumPath"] as const;
        for (const field of fields) {
            const oldValue = image[field];
            const newValue = convertToR2(oldValue, cdnUrl);
            if (newValue) {
                updates[field] = newValue;
                fixes.push({
                    table: "GalleryImage",
                    recordId: image.id,
                    field,
                    oldValue: oldValue!,
                    newValue,
                });
            }
        }

        if (Object.keys(updates).length > 0 && !dryRun) {
            await prisma.galleryImage.update({
                where: { id: image.id },
                data: updates,
            });
        }
    }

    return fixes;
}

async function fixMoments(cdnUrl: string, dryRun: boolean): Promise<Fix[]> {
    const moments = await prisma.moment.findMany({
        where: { images: { not: null } },
        select: { id: true, images: true },
    });

    const fixes: Fix[] = [];

    for (const moment of moments) {
        const images = moment.images as MomentImage[];
        if (!Array.isArray(images) || images.length === 0) continue;

        let needsUpdate = false;
        const updatedImages: MomentImage[] = [];

        for (let i = 0; i < images.length; i++) {
            const img = images[i]!;
            const newImg = { ...img };

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
                        table: "Moment",
                        recordId: `${moment.id}[${i}]`,
                        field,
                        oldValue: oldValue!,
                        newValue,
                    });
                    needsUpdate = true;
                }
            }

            updatedImages.push(newImg);
        }

        if (needsUpdate && !dryRun) {
            await prisma.moment.update({
                where: { id: moment.id },
                data: { images: updatedImages },
            });
        }
    }

    return fixes;
}

// Ensure storageType is 'r2' if filePath is a remote URL
async function fixStorageType(dryRun: boolean): Promise<Fix[]> {
    const images = await prisma.galleryImage.findMany({
        where: {
            storageType: "local",
            filePath: { startsWith: "http" }
        },
        select: { id: true, filePath: true, storageType: true }
    });

    const fixes: Fix[] = [];
    if (images.length === 0) return fixes;

    for (const image of images) {
        fixes.push({
            table: "GalleryImage",
            recordId: image.id,
            field: "storageType",
            oldValue: image.storageType,
            newValue: "r2"
        });
    }

    if (!dryRun) {
        await prisma.galleryImage.updateMany({
            where: {
                storageType: "local",
                filePath: { startsWith: "http" }
            },
            data: {
                storageType: "r2"
            }
        });
    }

    return fixes;
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run") || args.includes("-n");

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("        FIX ALL LOCAL PATHS & STORAGE TYPES");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(dryRun ? "\n🔍 MODE: DRY RUN - No changes will be made\n" : "\n⚡ MODE: EXECUTE - Changes will be applied\n");

    const config = await getStorageConfigAsync();

    if (!config.cdnUrl) {
        console.error("❌ R2 CDN URL not configured. Please configure storage first.");
        process.exit(1);
    }

    const cdnUrl = config.cdnUrl;
    console.log(`📡 R2 CDN URL: ${cdnUrl}\n`);

    // Fix GalleryImage paths
    console.log("───────────────────────────────────────────────────────────────");
    console.log("📷 Scanning GalleryImage paths...");
    console.log("───────────────────────────────────────────────────────────────");
    const galleryPathFixes = await fixGalleryImages(cdnUrl, dryRun);

    // Fix Moment paths
    console.log("\n───────────────────────────────────────────────────────────────");
    console.log("📝 Scanning Moment paths...");
    console.log("───────────────────────────────────────────────────────────────");
    const momentPathFixes = await fixMoments(cdnUrl, dryRun);

    // Fix Storage Types
    console.log("\n───────────────────────────────────────────────────────────────");
    console.log("💾 Scanning storage types...");
    console.log("───────────────────────────────────────────────────────────────");
    const storageTypeFixes = await fixStorageType(dryRun);

    const allFixes = [...galleryPathFixes, ...momentPathFixes, ...storageTypeFixes];

    // Print detailed report
    console.log("\n───────────────────────────────────────────────────────────────");
    console.log("📋 DETAILED FIXES REPORT");
    console.log("───────────────────────────────────────────────────────────────\n");

    if (allFixes.length === 0) {
        console.log("✅ No issues found! All paths and types are correct.\n");
    } else {
        // Group by table
        const fixesByTable = allFixes.reduce((acc, fix) => {
            if (!acc[fix.table]) acc[fix.table] = [];
            acc[fix.table].push(fix);
            return acc;
        }, {} as Record<string, Fix[]>);

        for (const [table, fixes] of Object.entries(fixesByTable)) {
            console.log(`\n📊 ${table} (${fixes.length} fixes):`);
            console.log("─".repeat(50));

            // Group by record
            const byRecord = fixes.reduce((acc, fix) => {
                key = fix.recordId;
                if (!acc[key]) acc[key] = [];
                acc[key].push(fix);
                return acc;
            }, {} as Record<string, Fix[]>);

            for (const [recordId, recordFixes] of Object.entries(byRecord)) {
                console.log(`   ${recordId.slice(0, 20)}...`);
                for (const fix of recordFixes) {
                    console.log(`     ${fix.field}:`);
                    console.log(`       ❌ ${fix.oldValue.slice(-50)}`);
                    console.log(`       ✅ ${fix.newValue.slice(-50)}`);
                }
            }
        }
    }

    // Summary
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("📈 SUMMARY");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`   GalleryImage path fixes: ${galleryPathFixes.length}`);
    console.log(`   Moment path fixes:       ${momentPathFixes.length}`);
    console.log(`   Storage type fixes:      ${storageTypeFixes.length}`);
    console.log(`   ─────────────────────────────`);
    console.log(`   Total fixes:             ${allFixes.length}`);

    if (dryRun && allFixes.length > 0) {
        console.log("\n⚠️  DRY RUN - No changes were made.");
        console.log("   To apply these fixes, run:");
        console.log("   npx tsx scripts/fix-all-local-paths.ts");
    } else if (!dryRun && allFixes.length > 0) {
        console.log("\n✅ All fixes have been applied!");
    }
    console.log("");

    await prisma.$disconnect();
}

let key: string; // Helper for typescript limitation in reduce key inference above

main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});
