import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, Prisma } from "@prisma/client";
import { getStorageProviderAsync } from "@/lib/storage";
import prisma from "@/lib/prisma";
import { getStorageConfigAsync } from "@/lib/storage/config";

/**
 * Helper to check if a key is used in any database table
 */
async function checkImageUsage(key: string): Promise<{ used: boolean; count: number }> {
    const config = await getStorageConfigAsync();
    const { cdnUrl, endpoint, bucket } = config;

    // Build possible URL patterns
    const patterns: string[] = [key];
    if (cdnUrl) {
        patterns.push(`${cdnUrl}/${key}`);
        patterns.push(`${cdnUrl.replace(/\/$/, '')}/${key}`);
    }
    if (endpoint && bucket) {
        patterns.push(`${endpoint}/${bucket}/${key}`);
    }

    let count = 0;

    // Check GalleryImage
    for (const pattern of patterns) {
        const galleryCount = await prisma.galleryImage.count({
            where: {
                OR: [
                    { filePath: { contains: pattern } },
                    { microThumbPath: { contains: pattern } },
                    { smallThumbPath: { contains: pattern } },
                    { mediumPath: { contains: pattern } },
                ],
            },
        });
        count += galleryCount;
    }

    // Check Post coverImagePath
    for (const pattern of patterns) {
        const postCount = await prisma.post.count({
            where: { coverImagePath: { contains: pattern } },
        });
        count += postCount;
    }

    // Check HeroImage
    for (const pattern of patterns) {
        const heroCount = await prisma.heroImage.count({
            where: { url: { contains: pattern } },
        });
        count += heroCount;
    }

    // Check Moment images (JSON field - we need to check raw)
    const moments = await prisma.moment.findMany({
        where: { images: { not: Prisma.JsonNull }, deletedAt: null },
        select: { images: true },
    });

    for (const moment of moments) {
        const images = moment.images as Array<{ url?: string; microThumbUrl?: string; smallThumbUrl?: string; mediumUrl?: string }> | null;
        if (!images) continue;

        for (const img of images) {
            for (const pattern of patterns) {
                if (
                    img.url?.includes(pattern) ||
                    img.microThumbUrl?.includes(pattern) ||
                    img.smallThumbUrl?.includes(pattern) ||
                    img.mediumUrl?.includes(pattern)
                ) {
                    count++;
                    break;
                }
            }
        }
    }

    // Check Project imageUrl
    for (const pattern of patterns) {
        const projectCount = await prisma.project.count({
            where: { imageUrl: { contains: pattern } },
        });
        count += projectCount;
    }

    // Check ShareItem imageUrl
    for (const pattern of patterns) {
        const shareCount = await prisma.shareItem.count({
            where: { imageUrl: { contains: pattern } },
        });
        count += shareCount;
    }

    // Check Friend avatar/cover
    for (const pattern of patterns) {
        const friendCount = await prisma.friend.count({
            where: {
                OR: [
                    { avatar: { contains: pattern } },
                    { cover: { contains: pattern } },
                ],
            },
        });
        count += friendCount;
    }

    return { used: count > 0, count };
}

/**
 * DELETE /api/admin/storage/[...key]
 * Delete a file from storage with safety check
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { key } = await params;
        const fileKey = key.join("/");

        // Security: reject dangerous paths
        if (!fileKey || fileKey.includes("..") || fileKey.startsWith("/")) {
            return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
        }

        // Check for force parameter
        const { searchParams } = new URL(request.url);
        const force = searchParams.get("force") === "true";

        // Safety check: verify the image is not in use
        if (!force) {
            const usage = await checkImageUsage(fileKey);
            if (usage.used) {
                return NextResponse.json(
                    {
                        error: "Image is still in use",
                        message: `This image is referenced in ${usage.count} location(s). Remove all references before deleting, or use force=true to override.`,
                        inUse: true,
                        referenceCount: usage.count,
                    },
                    { status: 400 }
                );
            }
        }

        const storage = await getStorageProviderAsync();
        await storage.delete(fileKey);

        // Also try to delete associated thumbnails
        const thumbnailSuffixes = ['_micro.webp', '_small.webp', '_medium.webp'];
        const baseKey = fileKey.replace(/\.[^.]+$/, '');

        for (const suffix of thumbnailSuffixes) {
            try {
                await storage.delete(baseKey + suffix);
            } catch {
                // Ignore errors for thumbnails that don't exist
            }
        }

        return NextResponse.json({ success: true, deleted: fileKey, force });
    } catch (error) {
        console.error("[Storage API] Delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}
