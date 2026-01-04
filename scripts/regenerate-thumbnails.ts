/**
 * Regenerate Thumbnails for Gallery Images
 * 
 * This script regenerates thumbnails for all gallery images to ensure
 * correct orientation (EXIF auto-rotate) and consistent quality.
 * 
 * Run via: npx tsx scripts/regenerate-thumbnails.ts
 */

import prisma from "../src/lib/prisma";
import { generateThumbnails, getThumbnailFilename } from "../src/lib/image-processor";
import { getStorageProviderAsync } from "../src/lib/storage";
import fs from "fs";
import path from "path";

async function fetchImageBuffer(filePath: string): Promise<Buffer | null> {
    try {
        // Handle local files
        if (filePath.startsWith("/uploads/") || filePath.startsWith("/api/uploads/")) {
            const relativePath = filePath
                .replace("/api/uploads/", "")
                .replace("/uploads/", "");
            const absolutePath = path.join(process.cwd(), "public", "uploads", relativePath);

            if (fs.existsSync(absolutePath)) {
                return fs.readFileSync(absolutePath);
            }
        }

        // Handle remote URLs
        if (filePath.startsWith("http")) {
            const response = await fetch(filePath);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
        }

        return null;
    } catch (error) {
        console.error(`  ❌ Failed to fetch: ${filePath}`, error);
        return null;
    }
}

async function regenerateThumbnails() {
    console.log("🔄 Starting thumbnail regeneration...\n");

    const images = await prisma.galleryImage.findMany({
        select: {
            id: true,
            filePath: true,
            storageType: true,
        },
        orderBy: { createdAt: "desc" },
    });

    console.log(`📊 Found ${images.length} images to process.\n`);

    // Use async version to ensure correct storage config from database
    const storage = await getStorageProviderAsync();
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const image of images) {
        process.stdout.write(`Processing ${processed + 1}/${images.length}: ${image.id.slice(0, 8)}... `);

        try {
            const buffer = await fetchImageBuffer(image.filePath);

            if (!buffer) {
                console.log("⏭️  skipped (not found)");
                skipped++;
                continue;
            }

            // Generate new thumbnails with correct orientation
            const thumbnails = await generateThumbnails(buffer);

            // Extract base filename from filePath
            const filename = path.basename(image.filePath);

            // Upload new thumbnails
            const [microPath, smallPath, mediumPath] = await storage.uploadBatch([
                {
                    buffer: thumbnails.micro,
                    filename: getThumbnailFilename(filename, "micro"),
                    mimeType: "image/webp",
                },
                {
                    buffer: thumbnails.small,
                    filename: getThumbnailFilename(filename, "small"),
                    mimeType: "image/webp",
                },
                {
                    buffer: thumbnails.medium,
                    filename: getThumbnailFilename(filename, "medium"),
                    mimeType: "image/webp",
                },
            ]) as [string, string, string];

            // Update database with new thumbnail paths
            await prisma.galleryImage.update({
                where: { id: image.id },
                data: {
                    microThumbPath: storage.getPublicUrl(microPath),
                    smallThumbPath: storage.getPublicUrl(smallPath),
                    mediumPath: storage.getPublicUrl(mediumPath),
                },
            });

            console.log("✅ done");
            processed++;
        } catch (error) {
            console.log("❌ failed");
            console.error(`  Error: ${error instanceof Error ? error.message : error}`);
            failed++;
        }
    }

    console.log("\n📈 Summary:");
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
}

async function main() {
    try {
        await regenerateThumbnails();
    } catch (error) {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
