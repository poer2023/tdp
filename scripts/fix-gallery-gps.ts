/**
 * Script to re-extract EXIF GPS data for existing gallery images
 * Run with: npx tsx scripts/fix-gallery-gps.ts
 */
import prisma from "../src/lib/prisma";
import { extractExif } from "../src/lib/exif";
import { reverseGeocode } from "../src/lib/geocoding";
import * as fs from "fs/promises";
import * as path from "path";

async function main() {
    console.log("🔍 Fetching gallery images without GPS data...");

    const images = await prisma.galleryImage.findMany({
        where: {
            OR: [{ latitude: null }, { longitude: null }],
        },
        select: {
            id: true,
            filePath: true,
            title: true,
        },
    });

    console.log(`📷 Found ${images.length} images without GPS data\n`);

    let updated = 0;
    let noExif = 0;
    let errors = 0;

    for (const image of images) {
        try {
            // Convert API path to local file path
            let localPath: string;
            if (image.filePath.startsWith("/api/uploads/")) {
                localPath = path.join(
                    process.cwd(),
                    "public",
                    "uploads",
                    image.filePath.replace("/api/uploads/", "")
                );
            } else if (image.filePath.startsWith("/uploads/")) {
                localPath = path.join(process.cwd(), "public", image.filePath);
            } else {
                console.log(`⏭️  Skipping ${image.id}: remote URL`);
                continue;
            }

            // Check if file exists
            try {
                await fs.access(localPath);
            } catch {
                console.log(`❌ File not found: ${localPath}`);
                errors++;
                continue;
            }

            // Read file and extract EXIF
            const buffer = await fs.readFile(localPath);
            const exif = await extractExif(buffer);

            if (!exif) {
                console.log(`⚪ No EXIF data: ${image.filePath}`);
                noExif++;
                continue;
            }

            if (!exif.latitude || !exif.longitude) {
                console.log(`⚪ No GPS in EXIF: ${image.filePath}`);
                noExif++;
                continue;
            }

            console.log(
                `📍 Found GPS: ${exif.latitude.toFixed(4)}, ${exif.longitude.toFixed(4)} - ${image.filePath}`
            );

            // Reverse geocode
            let location = null;
            try {
                location = await reverseGeocode(exif.latitude, exif.longitude);
                if (location) {
                    console.log(`   🏙️  ${location.city || ""}, ${location.country || ""}`);
                }
            } catch (e) {
                console.log(`   ⚠️  Geocoding failed`);
            }

            // Update database
            await prisma.galleryImage.update({
                where: { id: image.id },
                data: {
                    latitude: exif.latitude,
                    longitude: exif.longitude,
                    locationName: location?.locationName || null,
                    city: location?.city || null,
                    country: location?.country || null,
                    width: exif.width || undefined,
                    height: exif.height || undefined,
                    capturedAt: exif.capturedAt || undefined,
                },
            });

            updated++;
            console.log(`   ✅ Updated`);
        } catch (error) {
            console.error(`❌ Error processing ${image.id}:`, error);
            errors++;
        }
    }

    console.log("\n📊 Summary:");
    console.log(`   Updated: ${updated}`);
    console.log(`   No EXIF/GPS: ${noExif}`);
    console.log(`   Errors: ${errors}`);

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
