/**
 * 修复 Moment 图片 EXIF 方向问题
 *
 * 此脚本会：
 * 1. 查询数据库中所有 moments 的图片
 * 2. 下载每张图片，应用 EXIF 方向旋转
 * 3. 重新上传到相同位置
 *
 * 运行方式：npx tsx scripts/fix-moment-image-orientation.ts
 */

import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();

interface MomentImage {
    url: string;
    w?: number | null;
    h?: number | null;
    alt?: string | null;
    previewUrl?: string | null;
}

async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        // Handle both relative and absolute URLs
        const fetchUrl = url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${url}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            console.error(`Failed to download: ${url} (${response.status})`);
            return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error(`Error downloading ${url}:`, error);
        return null;
    }
}

async function fixImageOrientation(buffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number } | null> {
    try {
        // Apply EXIF rotation and get new dimensions
        const rotated = sharp(buffer).rotate();
        const outputBuffer = await rotated.toBuffer();
        const metadata = await sharp(outputBuffer).metadata();

        return {
            buffer: outputBuffer,
            width: metadata.width || 0,
            height: metadata.height || 0,
        };
    } catch (error) {
        console.error("Failed to fix orientation:", error);
        return null;
    }
}

async function uploadImage(buffer: Buffer, originalUrl: string): Promise<boolean> {
    try {
        // For local storage, we need to write directly to the file system
        const { writeFile } = await import("fs/promises");
        const path = await import("path");

        // Extract the file path from the URL
        // e.g., "/uploads/abc123.jpg" -> "public/uploads/abc123.jpg"
        if (originalUrl.startsWith("/uploads/")) {
            const filePath = path.join(process.cwd(), "public", originalUrl);
            await writeFile(filePath, buffer);
            console.log(`  ✓ Updated: ${originalUrl}`);
            return true;
        }

        // For S3/R2 storage, use the storage provider
        if (originalUrl.startsWith("http")) {
            // TODO: Implement S3/R2 upload if needed
            console.warn(`  ⚠ Remote URL not supported yet: ${originalUrl}`);
            return false;
        }

        console.warn(`  ⚠ Unknown URL format: ${originalUrl}`);
        return false;
    } catch (error) {
        console.error(`Failed to upload ${originalUrl}:`, error);
        return false;
    }
}

async function main() {
    console.log("🔧 Starting EXIF orientation fix for Moment images...\n");

    // Fetch all moments with images
    const moments = await prisma.moment.findMany({
        where: {
            images: {
                not: null,
            },
        },
        select: {
            id: true,
            images: true,
        },
    });

    console.log(`Found ${moments.length} moments with images\n`);

    let totalImages = 0;
    let fixedImages = 0;
    let failedImages = 0;

    for (const moment of moments) {
        const images = moment.images as MomentImage[] | null;
        if (!images || images.length === 0) continue;

        console.log(`Processing moment ${moment.id} (${images.length} images)...`);

        const updatedImages: MomentImage[] = [];
        let needsUpdate = false;

        for (const image of images) {
            totalImages++;

            // Download the image
            const buffer = await downloadImage(image.url);
            if (!buffer) {
                failedImages++;
                updatedImages.push(image);
                continue;
            }

            // Fix orientation
            const fixed = await fixImageOrientation(buffer);
            if (!fixed) {
                failedImages++;
                updatedImages.push(image);
                continue;
            }

            // Upload back to the same location
            const uploaded = await uploadImage(fixed.buffer, image.url);
            if (!uploaded) {
                failedImages++;
                updatedImages.push(image);
                continue;
            }

            // Update dimensions in the database
            updatedImages.push({
                ...image,
                w: fixed.width,
                h: fixed.height,
            });

            needsUpdate = true;
            fixedImages++;

            // Also fix preview image if exists
            if (image.previewUrl) {
                const previewBuffer = await downloadImage(image.previewUrl);
                if (previewBuffer) {
                    const fixedPreview = await fixImageOrientation(previewBuffer);
                    if (fixedPreview) {
                        await uploadImage(fixedPreview.buffer, image.previewUrl);
                    }
                }
            }
        }

        // Update the moment with corrected dimensions
        if (needsUpdate) {
            await prisma.moment.update({
                where: { id: moment.id },
                data: { images: updatedImages as unknown as Record<string, unknown>[] },
            });
        }
    }

    console.log("\n✅ Done!");
    console.log(`   Total images processed: ${totalImages}`);
    console.log(`   Successfully fixed: ${fixedImages}`);
    console.log(`   Failed: ${failedImages}`);

    await prisma.$disconnect();
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
});
