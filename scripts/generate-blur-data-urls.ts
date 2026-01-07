/**
 * Migration script: Generate blurDataURL for existing images
 * 
 * This script:
 * 1. Fetches all GalleryImage records without blurDataURL
 * 2. Downloads the image (from microThumbPath or filePath)
 * 3. Generates blurDataURL using sharp
 * 4. Updates the database record
 * 
 * Run with: npx tsx scripts/generate-blur-data-urls.ts
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

async function generateBlurDataURL(imageBuffer: Buffer): Promise<string> {
    const blurBuffer = await sharp(imageBuffer)
        .rotate()
        .resize(20, 20, { fit: "inside" })
        .blur(2)
        .webp({ quality: 50 })
        .toBuffer();

    return `data:image/webp;base64,${blurBuffer.toString("base64")}`;
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
        // Handle relative URLs
        let fetchUrl = url;
        if (url.startsWith('/')) {
            // Local development URL
            fetchUrl = `http://localhost:3000${url}`;
        }

        console.log(`  Fetching: ${fetchUrl.substring(0, 80)}...`);

        const response = await fetch(fetchUrl, {
            headers: {
                'User-Agent': 'BlurDataURL-Script/1.0',
            },
        });

        if (!response.ok) {
            console.warn(`  ⚠️ Failed to fetch (${response.status}): ${url}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.warn(`  ⚠️ Error fetching ${url}:`, error);
        return null;
    }
}

async function main() {
    console.log('🔍 Fetching images without blurDataURL...\n');

    // Get all GalleryImage records without blurDataURL
    const images = await prisma.galleryImage.findMany({
        where: {
            blurDataURL: null,
        },
        select: {
            id: true,
            filePath: true,
            microThumbPath: true,
            smallThumbPath: true,
        },
    });

    console.log(`📷 Found ${images.length} images without blurDataURL\n`);

    if (images.length === 0) {
        console.log('✅ All images already have blurDataURL!');
        return;
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < images.length; i++) {
        const image = images[i]!;
        console.log(`[${i + 1}/${images.length}] Processing ${image.id}...`);

        // Try micro thumbnail first (smallest), then small, then original
        const imageUrl = image.microThumbPath || image.smallThumbPath || image.filePath;

        const buffer = await fetchImageBuffer(imageUrl);
        if (!buffer) {
            failed++;
            continue;
        }

        try {
            const blurDataURL = await generateBlurDataURL(buffer);

            await prisma.galleryImage.update({
                where: { id: image.id },
                data: { blurDataURL },
            });

            console.log(`  ✅ Generated blurDataURL (${blurDataURL.length} bytes)`);
            success++;
        } catch (error) {
            console.error(`  ❌ Error processing ${image.id}:`, error);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
