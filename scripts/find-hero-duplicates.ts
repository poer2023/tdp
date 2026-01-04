/**
 * Simulate the Hero API logic and find duplicates
 */

import prisma from "../src/lib/prisma";
import { GalleryCategory } from "@prisma/client";

interface MomentImage {
    url: string;
    smallThumbUrl?: string;
}

function extractMomentImages(images: unknown): Array<{ url: string; originalUrl: string; index: number }> {
    if (!Array.isArray(images)) return [];
    return images.map((img, index) => {
        if (typeof img === "string") {
            return { url: img, originalUrl: img, index };
        }
        if (img && typeof img === "object" && "url" in img && typeof img.url === "string") {
            const record = img as MomentImage & { previewUrl?: string };
            const displayUrl = record.smallThumbUrl || record.previewUrl || record.url;
            return { url: displayUrl, originalUrl: record.url, index };
        }
        return null;
    }).filter((item): item is { url: string; originalUrl: string; index: number } => item !== null);
}

// Extract UUID from URL
function extractUUID(url: string): string | null {
    const match = url.match(/\/gallery\/([a-f0-9]{32})/i);
    return match ? match[1].toLowerCase() : null;
}

async function check() {
    console.log("🔍 Simulating Hero API 'all' filter response...\n");

    // 1. Gallery images (excluding MOMENT category)
    const galleryImages = await prisma.galleryImage.findMany({
        where: { category: { not: GalleryCategory.MOMENT } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, filePath: true, smallThumbPath: true, createdAt: true }
    });

    console.log(`📸 Gallery (excluding MOMENT): ${galleryImages.length} images`);

    // 2. Moment images
    const moments = await prisma.moment.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, images: true, createdAt: true }
    });

    interface CombinedImage {
        id: string;
        displayUrl: string;
        uuid: string | null;
        source: string;
        createdAt: Date;
    }

    const allImages: CombinedImage[] = [];

    // Add gallery images
    for (const img of galleryImages) {
        const displayUrl = img.smallThumbPath || img.filePath;
        if (displayUrl) {
            allImages.push({
                id: `gallery-${img.id}`,
                displayUrl,
                uuid: extractUUID(displayUrl),
                source: 'gallery',
                createdAt: img.createdAt
            });
        }
    }

    // Add moment images
    for (const m of moments) {
        const imgs = extractMomentImages(m.images);
        for (const { url, index } of imgs) {
            allImages.push({
                id: `moment-${m.id}-${index}`,
                displayUrl: url,
                uuid: extractUUID(url),
                source: 'moment',
                createdAt: m.createdAt
            });
        }
    }

    console.log(`📷 Total images in "All": ${allImages.length}`);

    // Sort by date
    allImages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Find duplicates by UUID
    const uuidToImages = new Map<string, CombinedImage[]>();
    for (const img of allImages) {
        if (img.uuid) {
            const existing = uuidToImages.get(img.uuid) || [];
            existing.push(img);
            uuidToImages.set(img.uuid, existing);
        }
    }

    console.log("\n❗ Duplicate UUIDs (same image from different sources):");
    let foundDuplicates = false;
    for (const [uuid, images] of uuidToImages) {
        if (images.length > 1) {
            foundDuplicates = true;
            console.log(`\n  UUID: ${uuid}`);
            for (const img of images) {
                console.log(`    ${img.source}: ${img.id}`);
                console.log(`      URL: ...${img.displayUrl.slice(-50)}`);
            }
        }
    }

    if (!foundDuplicates) {
        console.log("  ✅ No UUID duplicates found");
    }

    // Also check for exact URL duplicates
    const urlCounts = new Map<string, number>();
    for (const img of allImages) {
        const count = urlCounts.get(img.displayUrl) || 0;
        urlCounts.set(img.displayUrl, count + 1);
    }

    console.log("\n\n🔗 Exact URL duplicates:");
    let foundUrlDuplicates = false;
    for (const [url, count] of urlCounts) {
        if (count > 1) {
            foundUrlDuplicates = true;
            console.log(`  URL: ...${url.slice(-50)} appears ${count} times`);
        }
    }

    if (!foundUrlDuplicates) {
        console.log("  ✅ No exact URL duplicates found");
    }

    // Show first 10 images for visual inspection
    console.log("\n\n📋 First 10 images (sorted by date):");
    for (let i = 0; i < Math.min(10, allImages.length); i++) {
        const img = allImages[i];
        console.log(`  ${i + 1}. [${img.source}] UUID: ${img.uuid?.slice(0, 8) || 'N/A'}... - ${img.createdAt.toISOString().slice(0, 10)}`);
    }

    await prisma.$disconnect();
}

check().catch(console.error);
