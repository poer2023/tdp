/**
 * Next.js Instrumentation - runs once on server startup
 * 
 * This file is used for one-time startup tasks like database migrations.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run on Node.js server (not edge runtime)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Run migrations asynchronously to not block startup
        runMigrations().catch(console.error);
    }
}

async function runMigrations() {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV !== "production" && !process.env.RUN_MIGRATIONS) {
        return;
    }

    console.log("[Instrumentation] Starting migrations...");

    try {
        await fixImageDimensions();
    } catch (error) {
        console.error("[Instrumentation] Migration error:", error);
    }

    console.log("[Instrumentation] Migrations complete");
}

/**
 * Fix image dimensions - one-time migration
 * Sets correct width/height with EXIF orientation handling
 */
async function fixImageDimensions() {
    // Dynamic imports to avoid issues with edge runtime
    const { PrismaClient } = await import("@prisma/client");
    const sharp = (await import("sharp")).default;

    const prisma = new PrismaClient();

    try {
        // Check if migration already ran using a simple heuristic:
        // If most images have dimensions, skip the migration
        const [withDimensions, without] = await Promise.all([
            prisma.galleryImage.count({
                where: {
                    width: { not: null },
                    height: { not: null },
                },
            }),
            prisma.galleryImage.count({
                where: {
                    OR: [{ width: null }, { height: null }],
                    mimeType: { not: { startsWith: "video/" } },
                },
            }),
        ]);

        // Skip if no images need fixing
        if (without === 0) {
            console.log("[FixDimensions] All images have dimensions, skipping");
            return;
        }

        console.log(
            `[FixDimensions] Found ${without} images without dimensions (${withDimensions} already have)`
        );

        // Only fix images that don't have dimensions
        const images = await prisma.galleryImage.findMany({
            where: {
                OR: [{ width: null }, { height: null }],
                mimeType: { not: { startsWith: "video/" } },
            },
            select: {
                id: true,
                filePath: true,
            },
        });

        let fixed = 0;
        let errors = 0;

        for (const image of images) {
            try {
                if (!image.filePath) continue;

                const response = await fetch(image.filePath, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                });
                if (!response.ok) {
                    errors++;
                    continue;
                }

                const buffer = Buffer.from(await response.arrayBuffer());
                const meta = await sharp(buffer).metadata();

                if (!meta.width || !meta.height) {
                    errors++;
                    continue;
                }

                let width = meta.width;
                let height = meta.height;

                // EXIF orientation 5-8 = rotated 90° or 270°
                if (meta.orientation && meta.orientation >= 5) {
                    [width, height] = [height, width];
                }

                await prisma.galleryImage.update({
                    where: { id: image.id },
                    data: { width, height },
                });

                fixed++;
            } catch {
                errors++;
            }
        }

        console.log(`[FixDimensions] Fixed: ${fixed}, Errors: ${errors}`);
    } finally {
        await prisma.$disconnect();
    }
}
