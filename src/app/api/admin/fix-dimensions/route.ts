/**
 * Admin API: Fix image dimensions in database
 * 
 * This endpoint fixes incorrect width/height values in GalleryImage records
 * by downloading each image and extracting correct dimensions with EXIF orientation handling.
 * 
 * Requires admin authentication.
 * 
 * Usage:
 *   POST /api/admin/fix-dimensions
 *   
 * Response: JSON with fixed, skipped, error counts
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Increase timeout for large batches
export const maxDuration = 300; // 5 minutes

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (!response.ok) {
            return null;
        }
        return Buffer.from(await response.arrayBuffer());
    } catch {
        return null;
    }
}

async function getImageDimensions(
    buffer: Buffer
): Promise<{ width: number; height: number } | null> {
    try {
        const meta = await sharp(buffer).metadata();
        if (!meta.width || !meta.height) {
            return null;
        }

        let width = meta.width;
        let height = meta.height;

        // EXIF orientation 5-8 means the image is rotated 90° or 270°
        // In these cases, width and height need to be swapped
        if (meta.orientation && meta.orientation >= 5) {
            [width, height] = [height, width];
        }

        return { width, height };
    } catch {
        return null;
    }
}

export async function POST() {
    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get all images (including those without dimensions)
        const images = await prisma.galleryImage.findMany({
            where: {
                OR: [
                    { mimeType: { startsWith: "image/" } },
                    { mimeType: null }, // Legacy records
                ],
            },
            select: {
                id: true,
                title: true,
                filePath: true,
                width: true,
                height: true,
                mimeType: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const results: {
            fixed: string[];
            skipped: string[];
            errors: string[];
        } = {
            fixed: [],
            skipped: [],
            errors: [],
        };

        for (const image of images) {
            // Skip videos
            if (image.mimeType?.startsWith("video/")) {
                results.skipped.push(`${image.id} (video)`);
                continue;
            }

            if (!image.filePath) {
                results.errors.push(`${image.id} (no file path)`);
                continue;
            }

            // Fetch and analyze
            const buffer = await fetchImageBuffer(image.filePath);
            if (!buffer) {
                results.errors.push(`${image.id} (fetch failed)`);
                continue;
            }

            const dimensions = await getImageDimensions(buffer);
            if (!dimensions) {
                results.errors.push(`${image.id} (dimension extraction failed)`);
                continue;
            }

            // Check if update is needed
            if (
                image.width === dimensions.width &&
                image.height === dimensions.height
            ) {
                results.skipped.push(image.id);
                continue;
            }

            // Update database
            await prisma.galleryImage.update({
                where: { id: image.id },
                data: {
                    width: dimensions.width,
                    height: dimensions.height,
                },
            });

            const oldDim =
                image.width && image.height ? `${image.width}×${image.height}` : "null";
            results.fixed.push(
                `${image.id}: ${oldDim} → ${dimensions.width}×${dimensions.height}`
            );
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: images.length,
                fixed: results.fixed.length,
                skipped: results.skipped.length,
                errors: results.errors.length,
            },
            details: results,
        });
    } catch (error) {
        console.error("Fix dimensions error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
