/**
 * Migration script: Generate blurDataURL for Moment images
 * 
 * Moment images are stored in a JSON field, so we need to:
 * 1. Fetch all Moments with images
 * 2. For each image in the JSON array, generate blurDataURL
 * 3. Update the JSON field with the new blurDataURL
 * 
 * Run with: npx tsx scripts/generate-moment-blur-urls.ts
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

interface MomentImage {
    url: string;
    w?: number;
    h?: number;
    mediumUrl?: string;
    previewUrl?: string;
    microThumbUrl?: string;
    smallThumbUrl?: string;
    blurDataURL?: string;
}

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
        console.log(`    Fetching: ${url.substring(0, 70)}...`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BlurDataURL-Script/1.0',
            },
        });

        if (!response.ok) {
            console.warn(`    ⚠️ Failed to fetch (${response.status})`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.warn(`    ⚠️ Error fetching:`, error);
        return null;
    }
}

async function main() {
    console.log('🔍 Fetching Moments with images...\n');

    // Get all Moments with non-empty images array
    const moments = await prisma.moment.findMany({
        where: {
            images: {
                not: { equals: [] as unknown as undefined },
            },
        },
        select: {
            id: true,
            images: true,
        },
    });

    console.log(`📷 Found ${moments.length} Moments with images\n`);

    if (moments.length === 0) {
        console.log('✅ No Moments with images found!');
        return;
    }

    let momentsUpdated = 0;
    let imagesProcessed = 0;
    let imagesFailed = 0;

    for (let i = 0; i < moments.length; i++) {
        const moment = moments[i]!;
        const images = moment.images as MomentImage[];

        if (!images || images.length === 0) continue;

        console.log(`[${i + 1}/${moments.length}] Moment ${moment.id} (${images.length} images)`);

        let updated = false;
        const updatedImages: MomentImage[] = [];

        for (let j = 0; j < images.length; j++) {
            const img = images[j]!;

            // Skip if already has blurDataURL
            if (img.blurDataURL) {
                console.log(`  [${j + 1}/${images.length}] Already has blurDataURL, skipping`);
                updatedImages.push(img);
                continue;
            }

            // Try micro thumbnail first (smallest), then small, then original
            const imageUrl = img.microThumbUrl || img.smallThumbUrl || img.url;

            console.log(`  [${j + 1}/${images.length}] Processing...`);
            const buffer = await fetchImageBuffer(imageUrl);

            if (!buffer) {
                imagesFailed++;
                updatedImages.push(img);
                continue;
            }

            try {
                const blurDataURL = await generateBlurDataURL(buffer);
                updatedImages.push({ ...img, blurDataURL });
                console.log(`    ✅ Generated (${blurDataURL.length} bytes)`);
                imagesProcessed++;
                updated = true;
            } catch (error) {
                console.error(`    ❌ Error:`, error);
                imagesFailed++;
                updatedImages.push(img);
            }
        }

        if (updated) {
            await prisma.moment.update({
                where: { id: moment.id },
                data: { images: updatedImages as any },
            });
            momentsUpdated++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Moments updated: ${momentsUpdated}`);
    console.log(`✅ Images processed: ${imagesProcessed}`);
    console.log(`❌ Images failed: ${imagesFailed}`);
    console.log('='.repeat(50));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
