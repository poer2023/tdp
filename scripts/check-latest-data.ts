/**
 * Check latest moment data to understand the duplicate issue
 */

import prisma from "../src/lib/prisma";

async function check() {
    console.log("🔍 Checking latest moment and gallery data...\n");

    // Get the most recent moments with images
    const recentMoments = await prisma.moment.findMany({
        where: { images: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, content: true, images: true, createdAt: true }
    });

    console.log("📷 Recent Moments with images:");
    for (const m of recentMoments) {
        console.log(`\n  Moment: ${m.id.slice(0, 12)}...`);
        console.log(`  Created: ${m.createdAt}`);
        console.log(`  Content: ${m.content?.slice(0, 30)}...`);
        const images = m.images as Array<{ url?: string; smallThumbUrl?: string } | string>;
        if (Array.isArray(images)) {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const url = typeof img === 'string' ? img : img?.url;
                const smallThumb = typeof img === 'object' ? img?.smallThumbUrl : undefined;
                console.log(`  Image ${i + 1}:`);
                console.log(`    url: ${url?.slice(-60)}`);
                if (smallThumb) console.log(`    smallThumbUrl: ${smallThumb?.slice(-60)}`);
            }
        }
    }

    // Get the most recent gallery images
    const recentGallery = await prisma.galleryImage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, filePath: true, smallThumbPath: true, category: true, createdAt: true }
    });

    console.log("\n\n📸 Recent Gallery images:");
    for (const g of recentGallery) {
        console.log(`\n  Gallery: ${g.id.slice(0, 12)}...`);
        console.log(`  Category: ${g.category}`);
        console.log(`  Created: ${g.createdAt}`);
        console.log(`  filePath: ${g.filePath?.slice(-60)}`);
        console.log(`  smallThumbPath: ${g.smallThumbPath?.slice(-60)}`);
    }

    // Check if galleries with MOMENT exist
    const momentGalleries = await prisma.galleryImage.findMany({
        where: { category: 'MOMENT' },
        select: { id: true, createdAt: true }
    });
    console.log(`\n\n📊 Gallery images with MOMENT category: ${momentGalleries.length}`);

    await prisma.$disconnect();
}

check().catch(console.error);
