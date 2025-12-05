import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateThumbnails, getThumbnailFilename } from "@/lib/image-processor";
import { getStorageProvider } from "@/lib/storage";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for long-running tasks

type MaintenanceAction = "fix_duplicates" | "regenerate_thumbnails" | "status";

interface MaintenanceRequest {
    action: MaintenanceAction;
    limit?: number; // For pagination in regenerate_thumbnails
}

async function requireAdminOrToken(request: NextRequest) {
    // Check for maintenance token (for CI/CD)
    const authHeader = request.headers.get("authorization");
    const maintenanceToken = process.env.MAINTENANCE_API_TOKEN;

    if (maintenanceToken && authHeader === `Bearer ${maintenanceToken}`) {
        return true;
    }

    // Check for admin session
    const session = await auth();
    if (session?.user?.role === UserRole.ADMIN) {
        return true;
    }

    return false;
}

export async function POST(request: NextRequest) {
    const authorized = await requireAdminOrToken(request);
    if (!authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body: MaintenanceRequest = await request.json();
        const { action, limit = 50 } = body;

        switch (action) {
            case "fix_duplicates":
                return await fixDuplicates();
            case "regenerate_thumbnails":
                return await regenerateThumbnails(limit);
            case "status":
                return await getStatus();
            default:
                return NextResponse.json(
                    { error: "Unknown action", validActions: ["fix_duplicates", "regenerate_thumbnails", "status"] },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("[Maintenance] Error:", error);
        return NextResponse.json(
            { error: "Maintenance task failed", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

async function fixDuplicates() {
    console.log("[Maintenance] Starting duplicate gallery fix...");

    // Find duplicates
    const duplicates = await prisma.$queryRaw<Array<{ filePath: string; count: bigint }>>`
    SELECT "filePath", COUNT(*) as count
    FROM "GalleryImage"
    GROUP BY "filePath"
    HAVING COUNT(*) > 1
  `;

    if (duplicates.length === 0) {
        return NextResponse.json({
            success: true,
            message: "No duplicates found",
            duplicatesFixed: 0
        });
    }

    // Delete duplicates, keeping the oldest
    const result = await prisma.$executeRaw`
    DELETE FROM "GalleryImage" a
    USING "GalleryImage" b
    WHERE a."createdAt" > b."createdAt" 
      AND a."filePath" = b."filePath"
  `;

    console.log(`[Maintenance] Fixed ${result} duplicate records`);

    return NextResponse.json({
        success: true,
        message: `Fixed ${result} duplicate records`,
        duplicatesFound: duplicates.length,
        duplicatesFixed: result
    });
}

async function regenerateThumbnails(limit: number) {
    console.log(`[Maintenance] Starting thumbnail regeneration (limit: ${limit})...`);

    const images = await prisma.galleryImage.findMany({
        where: {
            OR: [
                { microThumbPath: null },
                { smallThumbPath: null },
                { mediumPath: null },
            ],
        },
        select: {
            id: true,
            filePath: true,
            storageType: true,
        },
        take: limit,
    });

    if (images.length === 0) {
        return NextResponse.json({
            success: true,
            message: "All thumbnails are already generated",
            processed: 0,
        });
    }

    const storage = getStorageProvider();
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const image of images) {
        try {
            const buffer = await fetchImageBuffer(image.filePath);
            if (!buffer) {
                errors.push(`${image.id}: Could not fetch original`);
                failed++;
                continue;
            }

            const thumbnails = await generateThumbnails(buffer);
            const filename = path.basename(image.filePath);

            const [microPath, smallPath, mediumPath] = await storage.uploadBatch([
                { buffer: thumbnails.micro, filename: getThumbnailFilename(filename, "micro"), mimeType: "image/webp" },
                { buffer: thumbnails.small, filename: getThumbnailFilename(filename, "small"), mimeType: "image/webp" },
                { buffer: thumbnails.medium, filename: getThumbnailFilename(filename, "medium"), mimeType: "image/webp" },
            ]) as [string, string, string];

            await prisma.galleryImage.update({
                where: { id: image.id },
                data: {
                    microThumbPath: storage.getPublicUrl(microPath),
                    smallThumbPath: storage.getPublicUrl(smallPath),
                    mediumPath: storage.getPublicUrl(mediumPath),
                },
            });

            processed++;
        } catch (error) {
            errors.push(`${image.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
            failed++;
        }
    }

    return NextResponse.json({
        success: true,
        message: `Regenerated ${processed} thumbnails, ${failed} failed`,
        processed,
        failed,
        remaining: await prisma.galleryImage.count({
            where: {
                OR: [
                    { microThumbPath: null },
                    { smallThumbPath: null },
                    { mediumPath: null },
                ],
            },
        }),
        errors: errors.slice(0, 10), // Only return first 10 errors
    });
}

async function getStatus() {
    const [totalImages, missingThumbnails, duplicateCount] = await Promise.all([
        prisma.galleryImage.count(),
        prisma.galleryImage.count({
            where: {
                OR: [
                    { microThumbPath: null },
                    { smallThumbPath: null },
                    { mediumPath: null },
                ],
            },
        }),
        prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM (
        SELECT "filePath" FROM "GalleryImage"
        GROUP BY "filePath"
        HAVING COUNT(*) > 1
      ) t
    `.then(r => Number(r[0]?.count || 0)),
    ]);

    return NextResponse.json({
        totalImages,
        missingThumbnails,
        duplicateFilePaths: duplicateCount,
        healthy: missingThumbnails === 0 && duplicateCount === 0,
    });
}

async function fetchImageBuffer(filePath: string): Promise<Buffer | null> {
    try {
        // Handle local files
        if (filePath.startsWith("/uploads/") || filePath.startsWith("/api/uploads/")) {
            const relativePath = filePath.replace("/api/uploads/", "").replace("/uploads/", "");
            const absolutePath = path.join(process.cwd(), "public", "uploads", relativePath);

            if (fs.existsSync(absolutePath)) {
                return fs.readFileSync(absolutePath);
            }
        }

        // Handle remote URLs
        if (filePath.startsWith("http")) {
            const response = await fetch(filePath);
            if (response.ok) {
                return Buffer.from(await response.arrayBuffer());
            }
        }

        return null;
    } catch {
        return null;
    }
}
