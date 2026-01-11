/**
 * Startup migrations - runs once on Node.js server startup
 * 
 * This file contains one-time database migrations that run automatically
 * when the production server starts.
 */

import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

/**
 * Run all startup migrations
 */
export async function runStartupMigrations() {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV !== "production" && !process.env.RUN_MIGRATIONS) {
        return;
    }

    console.warn("[Migrations] Starting startup migrations...");

    try {
        await fixImageDimensions();
    } catch (error) {
        console.error("[Migrations] Error:", error);
    }

    console.warn("[Migrations] Complete");
}

/**
 * Fix image dimensions - one-time migration
 * Sets correct width/height with EXIF orientation handling
 */
async function fixImageDimensions() {
    const prisma = new PrismaClient();

    try {
        // Check if migration needed
        const withoutDimensions = await prisma.galleryImage.count({
            where: {
                OR: [{ width: null }, { height: null }],
                mimeType: { not: { startsWith: "video/" } },
            },
        });

        if (withoutDimensions === 0) {
            console.warn("[FixDimensions] All images have dimensions, skipping");
            return;
        }

        console.warn(`[FixDimensions] Found ${withoutDimensions} images to fix`);

        // Get images without dimensions
        const images = await prisma.galleryImage.findMany({
            where: {
                OR: [{ width: null }, { height: null }],
                mimeType: { not: { startsWith: "video/" } },
            },
            select: {
                id: true,
                filePath: true,
            },
        });

        let fixed = 0;
        let errors = 0;

        for (const image of images) {
            try {
                if (!image.filePath) continue;

                const response = await fetch(image.filePath, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                });
                if (!response.ok) {
                    errors++;
                    continue;
                }

                const buffer = Buffer.from(await response.arrayBuffer());
                const meta = await sharp(buffer).metadata();

                if (!meta.width || !meta.height) {
                    errors++;
                    continue;
                }

                let width = meta.width;
                let height = meta.height;

                // EXIF orientation 5-8 = rotated 90° or 270°
                if (meta.orientation && meta.orientation >= 5) {
                    [width, height] = [height, width];
                }

                await prisma.galleryImage.update({
                    where: { id: image.id },
                    data: { width, height },
                });

                fixed++;
            } catch {
                errors++;
            }
        }

        console.warn(`[FixDimensions] Fixed: ${fixed}, Errors: ${errors}`);
    } finally {
        await prisma.$disconnect();
    }
}
