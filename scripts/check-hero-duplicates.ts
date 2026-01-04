/**
 * Check Hero API response for duplicates
 */

import prisma from "../src/lib/prisma";
import { GalleryCategory } from "@prisma/client";

interface MomentImage {
    url: string;
    smallThumbUrl?: string;
}

function extractMomentImages(images: unknown): Array<{ url: string; originalUrl: string }> {
    if (!Array.isArray(images)) return [];
    return images.map((img) => {
        if (typeof img === "string") {
            return { url: img, originalUrl: img };
        }
        if (img && typeof img === "object" && "url" in img && typeof img.url === "string") {
            const record = img as MomentImage;
            const displayUrl = record.smallThumbUrl || record.url;
            return { url: displayUrl, originalUrl: record.url };
        }
        return null;
    }).filter((item): item is { url: string; originalUrl: string } => item !== null);
}

async function check() {
    console.log("🔍 Simulating Hero API response...\n");

    // 1. Gallery images (excluding MOMENT category) - this is what "all" filter does
    const galleryImages = await prisma.galleryImage.findMany({
        where: { category: { not: GalleryCategory.MOMENT } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, filePath: true, smallThumbPath: true, category: true }
    });

    console.log(`📸 Gallery (excluding MOMENT): ${galleryImages.length} images`);

    // 2. Moment images
    const moments = await prisma.moment.findMany({
        where: { images: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, images: true }
    });

    let momentImageCount = 0;
    const momentUrls: string[] = [];
    for (const m of moments) {
        const imgs = extractMomentImages(m.images);
        momentImageCount += imgs.length;
        for (const img of imgs) {
            momentUrls.push(img.url);
        }
    }

    console.log(`📷 Moments: ${momentImageCount} images`);

    // 3. Check for duplicates between gallery and moments
    const galleryUrls = galleryImages.map(g => g.smallThumbPath || g.filePath);

    console.log("\n🔍 Checking for URL duplicates...");

    // Extract base filename (UUID) from URLs
    const extractUUID = (url: string | null): string | null => {
        if (!url) return null;
        const match = url.match(/\/gallery\/([a-f0-9-]+)(?:_\w+)?\.(?:webp|jpe?g|png)/i);
        return match ? match[1].replace(/-/g, '').toLowerCase() : null;
    };

    const galleryUUIDs = new Set(galleryImages.map(g => extractUUID(g.filePath)).filter(Boolean));
    const momentUUIDs = moments.flatMap(m => extractMomentImages(m.images).map(img => extractUUID(img.originalUrl))).filter(Boolean);

    const duplicates = momentUUIDs.filter(uuid => galleryUUIDs.has(uuid));

    console.log(`\n📊 Gallery UUIDs (excluding MOMENT): ${galleryUUIDs.size}`);
    console.log(`📊 Moment UUIDs: ${momentUUIDs.length}`);
    console.log(`\n❗ Overlapping UUIDs: ${duplicates.length}`);

    if (duplicates.length > 0) {
        console.log("Duplicates:", duplicates);

        // Find the actual records
        for (const uuid of duplicates) {
            const g = galleryImages.find(g => extractUUID(g.filePath) === uuid);
            if (g) {
                console.log(`\n  Gallery record: ${g.id}`);
                console.log(`    Category: ${g.category}`);
                console.log(`    This should NOT appear if category is MOMENT!`);
            }
        }
    }

    // Also check total - should match gallery + moments with no duplicates
    console.log(`\n📈 Expected total in "All": ${galleryImages.length + momentImageCount}`);

    await prisma.$disconnect();
}

check().catch(console.error);
