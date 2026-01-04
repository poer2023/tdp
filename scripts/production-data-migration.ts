/**
 * Production data migration script
 * This script runs automatically during build to fix gallery categories
 * Run manually with: npx tsx scripts/production-data-migration.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();
const MOMENT_IMAGE_DIMENSIONS_KEY = 'moment-image-dimensions-webp-2026-01-04';
const HERO_IMAGE_THUMB_KEY = 'hero-image-small-thumbs-2026-01-04';
const ORIENTATION_SWAPS = new Set([5, 6, 7, 8]);
const INTERNAL_HOST_HINTS = ['r2.dev', 'r2.cloudflarestorage.com', 'dybzy.com'];

type MomentImage = {
    url: string;
    w?: number | null;
    h?: number | null;
    alt?: string | null;
    previewUrl?: string | null;
    microThumbUrl?: string | null;
    smallThumbUrl?: string | null;
    mediumUrl?: string | null;
};

type MomentImageLike = MomentImage | string;

function resolveFetchUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
}

function pickThumbUrl(img: MomentImage): string | null {
    return img.smallThumbUrl || img.previewUrl || img.mediumUrl || img.url || null;
}

function isLikelyInternalUrl(url: string): boolean {
    if (url.startsWith('/')) return true;
    try {
        const host = new URL(url).hostname;
        return INTERNAL_HOST_HINTS.some((hint) => host.includes(hint));
    } catch {
        return false;
    }
}

function normalizeHeroImageUrl(url: string): string {
    const [rawPath, rawQuery] = url.split('?');
    const path = rawPath ?? '';
    const query = rawQuery ?? '';
    if (!path) return url;
    if (!isLikelyInternalUrl(url)) return url;

    const isCover = path.includes('/covers/') || path.includes('covers/');
    if (isCover) return url;

    if (path.includes('_small.webp')) return url;
    if (path.includes('_medium.webp')) {
        const replaced = path.replace('_medium.webp', '_small.webp');
        return query ? `${replaced}?${query}` : replaced;
    }

    if (/\.(jpe?g|png|webp|heic|heif)$/i.test(path)) {
        const replaced = `${path.replace(/\.[^.]+$/, '')}_small.webp`;
        return query ? `${replaced}?${query}` : replaced;
    }

    return url;
}

async function readDimensions(buffer: Buffer): Promise<{ width: number | null; height: number | null }> {
    const metadata = await sharp(buffer).metadata();
    let width = metadata.width ?? null;
    let height = metadata.height ?? null;
    if (metadata.orientation && ORIENTATION_SWAPS.has(metadata.orientation) && width && height) {
        [width, height] = [height, width];
    }
    return { width, height };
}

async function normalizeHeroImageUrlsOnce() {
    const marker = await prisma.siteConfig.findUnique({ where: { key: HERO_IMAGE_THUMB_KEY } });
    if (marker?.value) {
        console.log(`[Migration] Hero image thumbnail normalization already applied (${marker.value})`);
        return;
    }

    console.log('🔄 [Migration] Normalizing hero image URLs to small thumbnails...');
    const heroImages = await prisma.heroImage.findMany({
        select: { id: true, url: true },
    });

    let updatedCount = 0;

    for (const hero of heroImages) {
        const normalized = normalizeHeroImageUrl(hero.url);
        if (normalized !== hero.url) {
            await prisma.heroImage.update({
                where: { id: hero.id },
                data: { url: normalized },
            });
            updatedCount++;
        }
    }

    const appliedAt = new Date().toISOString();
    await prisma.siteConfig.upsert({
        where: { key: HERO_IMAGE_THUMB_KEY },
        create: { key: HERO_IMAGE_THUMB_KEY, value: appliedAt, encrypted: false },
        update: { value: appliedAt },
    });

    console.log(`✅ [Migration] Hero images normalized: ${updatedCount}`);
}

async function fixMomentImageDimensionsOnce() {
    const marker = await prisma.siteConfig.findUnique({ where: { key: MOMENT_IMAGE_DIMENSIONS_KEY } });
    if (marker?.value) {
        console.log(`[Migration] Moment image dimension fix already applied (${marker.value})`);
        return;
    }

    console.log('🔄 [Migration] Fixing moment image dimensions from WebP thumbnails...');
    const moments = await prisma.moment.findMany({
        where: {
            NOT: { images: { equals: Prisma.DbNull } },
        },
        select: { id: true, images: true },
    });

    let fixedMoments = 0;
    let fixedImages = 0;
    let errorCount = 0;

    for (const moment of moments) {
        const images = moment.images as MomentImageLike[] | null;
        if (!images || !Array.isArray(images) || images.length === 0) continue;

        let needsUpdate = false;
        const updatedImages: MomentImage[] = [];

        for (const raw of images) {
            if (!raw) continue;
            const wasString = typeof raw === 'string';
            const img: MomentImage = wasString ? { url: raw } : raw;
            const fetchUrl = pickThumbUrl(img);

            if (!fetchUrl) {
                updatedImages.push(img);
                continue;
            }

            try {
                const response = await fetch(resolveFetchUrl(fetchUrl));
                if (!response.ok) {
                    updatedImages.push(img);
                    errorCount++;
                    continue;
                }

                const buffer = Buffer.from(await response.arrayBuffer());
                const { width, height } = await readDimensions(buffer);

                if (!wasString && img.w === width && img.h === height) {
                    updatedImages.push(img);
                } else {
                    updatedImages.push({ ...img, w: width, h: height });
                    needsUpdate = true;
                    fixedImages++;
                }
            } catch (error) {
                updatedImages.push(img);
                errorCount++;
                console.error(`[Migration] Failed to process moment ${moment.id}:`, error);
            }
        }

        if (needsUpdate) {
            await prisma.moment.update({
                where: { id: moment.id },
                data: { images: updatedImages as unknown as Prisma.InputJsonValue },
            });
            fixedMoments++;
        }
    }

    await prisma.siteConfig.upsert({
        where: { key: MOMENT_IMAGE_DIMENSIONS_KEY },
        create: { key: MOMENT_IMAGE_DIMENSIONS_KEY, value: new Date().toISOString(), encrypted: false },
        update: { value: new Date().toISOString() },
    });

    console.log(`✅ [Migration] Moment image dimensions updated. Moments: ${fixedMoments}, images: ${fixedImages}, errors: ${errorCount}`);
}

async function migrateGalleryCategories() {
    console.log('🔄 [Migration] Checking gallery image categories...');

    // Get current distribution
    const categoryStats = await prisma.galleryImage.groupBy({
        by: ['category'],
        _count: { id: true },
    });

    console.log('[Migration] Current category distribution:');
    categoryStats.forEach((stat) => {
        console.log(`  ${stat.category}: ${stat._count.id} images`);
    });

    // Step 1: Get moment image filenames (extract from URLs)
    const moments = await prisma.moment.findMany({
        where: {
            NOT: { images: { equals: Prisma.DbNull } }
        },
        select: { images: true },
    });

    // Extract filenames from moment image URLs
    // Moments store URLs like "/api/uploads/gallery/xxx.jpg" or full R2 URLs
    const momentImageFilenames = new Set<string>();
    for (const moment of moments) {
        if (moment.images && Array.isArray(moment.images)) {
            for (const img of moment.images as unknown[]) {
                let url: string | undefined;
                if (typeof img === 'string') {
                    url = img;
                } else if (img && typeof img === 'object') {
                    const record = img as { url?: unknown; filePath?: unknown };
                    url = typeof record.url === 'string' ? record.url : typeof record.filePath === 'string' ? record.filePath : undefined;
                }

                if (url) {
                    // Extract filename from path (last segment after last /)
                    const filename = url.split('/').pop();
                    if (filename) {
                        // Remove size suffix (_micro, _small, _medium) if present
                        const baseFilename = filename.replace(/_(micro|small|medium)\.(webp|jpg|jpeg|png)$/, '');
                        momentImageFilenames.add(baseFilename);
                    }
                }
            }
        }
    }
    console.log(`[Migration] Found ${momentImageFilenames.size} moment image filenames`);

    // Step 2: Update gallery images that match moment filenames to MOMENT category
    // We need to check each gallery image's filename against moment filenames
    if (momentImageFilenames.size > 0) {
        const allGalleryImages = await prisma.galleryImage.findMany({
            where: { category: { not: 'MOMENT' } },
            select: { id: true, filePath: true },
        });

        const idsToUpdate: string[] = [];
        for (const img of allGalleryImages) {
            const filename = img.filePath.split('/').pop();
            if (filename) {
                // Check base filename without extension
                const baseFilename = filename.replace(/\.(webp|jpg|jpeg|png)$/, '');
                // Also check with extension
                if (momentImageFilenames.has(filename) ||
                    momentImageFilenames.has(baseFilename) ||
                    Array.from(momentImageFilenames).some(mf =>
                        filename.includes(mf.replace(/\.[^.]+$/, ''))
                    )) {
                    idsToUpdate.push(img.id);
                }
            }
        }

        if (idsToUpdate.length > 0) {
            const momentResult = await prisma.galleryImage.updateMany({
                where: { id: { in: idsToUpdate } },
                data: { category: 'MOMENT' },
            });
            console.log(`✅ [Migration] Migrated ${momentResult.count} images to MOMENT category`);
        } else {
            console.log('[Migration] No new images to migrate to MOMENT category');
        }
    }

    // Step 3: Update remaining REPOST images to ORIGINAL
    const repostResult = await prisma.galleryImage.updateMany({
        where: { category: 'REPOST' },
        data: { category: 'ORIGINAL' },
    });
    if (repostResult.count > 0) {
        console.log(`✅ [Migration] Migrated ${repostResult.count} images from REPOST to ORIGINAL`);
    }

    // Final stats
    const finalStats = await prisma.galleryImage.groupBy({
        by: ['category'],
        _count: { id: true },
    });

    console.log('[Migration] Final category distribution:');
    finalStats.forEach((stat) => {
        console.log(`  ${stat.category}: ${stat._count.id} images`);
    });

    console.log('✅ [Migration] Gallery category migration complete!');
}

async function extractMissingExifData() {
    console.log('🔄 [EXIF] Checking for images missing location data...');

    // Count images without location
    const imagesWithoutLocation = await prisma.galleryImage.count({
        where: {
            latitude: null,
            longitude: null,
        },
    });

    console.log(`[EXIF] Found ${imagesWithoutLocation} images without location data`);
    // Note: EXIF extraction requires the actual image files, which can't be done at build time
    // This would need to be done via a separate API endpoint or background job

    if (imagesWithoutLocation > 0) {
        console.log('[EXIF] ℹ️  To extract EXIF data, images need to be re-processed via the admin panel');
    }
}

async function main() {
    console.log('🚀 Starting production data migration...\n');

    try {
        await migrateGalleryCategories();
        await extractMissingExifData();
        await fixMomentImageDimensionsOnce();
        await normalizeHeroImageUrlsOnce();
        console.log('\n🎉 Production data migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration error:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
