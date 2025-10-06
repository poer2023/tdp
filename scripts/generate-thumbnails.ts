import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";
import { generateThumbnails, getThumbnailFilename } from "../src/lib/image-processor";
import { getStorageProvider } from "../src/lib/storage";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting thumbnail generation for existing images...\n");

  const images = await prisma.galleryImage.findMany({
    where: {
      OR: [{ microThumbPath: null }, { smallThumbPath: null }, { mediumPath: null }],
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`📊 Found ${images.length} images needing thumbnails\n`);

  if (images.length === 0) {
    console.log("✅ All images already have thumbnails!");
    return;
  }

  const storage = getStorageProvider();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const progress = `[${i + 1}/${images.length}]`;

    try {
      console.log(`${progress} Processing: ${image.filePath}`);

      // Extract filename from path
      // For local: /api/uploads/gallery/abc123.jpg -> abc123.jpg
      // For S3: gallery/abc123.jpg -> abc123.jpg
      const filename = image.filePath.split("/").pop();
      if (!filename) {
        throw new Error("Could not extract filename from path");
      }

      // Read original image from local storage
      const imagePath = path.join(process.cwd(), "public", "uploads", "gallery", filename);
      const imageBuffer = await readFile(imagePath);

      // Generate thumbnails
      console.log(`  ⚙️  Generating thumbnails...`);
      const thumbnails = await generateThumbnails(imageBuffer);

      // Upload thumbnails
      console.log(`  ☁️  Uploading thumbnails...`);
      const [microPath, smallPath, mediumPath] = await storage.uploadBatch([
        {
          buffer: thumbnails.micro,
          filename: getThumbnailFilename(filename, "micro"),
          mimeType: "image/webp",
        },
        {
          buffer: thumbnails.small,
          filename: getThumbnailFilename(filename, "small"),
          mimeType: "image/webp",
        },
        {
          buffer: thumbnails.medium,
          filename: getThumbnailFilename(filename, "medium"),
          mimeType: "image/webp",
        },
      ]);

      // Update database
      await prisma.galleryImage.update({
        where: { id: image.id },
        data: {
          microThumbPath: storage.getPublicUrl(microPath),
          smallThumbPath: storage.getPublicUrl(smallPath),
          mediumPath: storage.getPublicUrl(mediumPath),
        },
      });

      successCount++;
      console.log(`  ✅ Success\n`);
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Error:`, error instanceof Error ? error.message : error);
      console.log("");
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary:");
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📁 Total: ${images.length}`);
  console.log("=".repeat(50) + "\n");

  if (successCount > 0) {
    console.log("🎉 Thumbnail generation completed!");
    console.log("\n💡 Next steps:");
    console.log("  1. Test gallery page to verify small thumbnails load");
    console.log("  2. Test detail page to verify medium thumbnails load");
    console.log("  3. Check film strip for micro thumbnails");
    console.log("  4. Monitor file sizes in public/uploads/gallery/\n");
  }

  if (errorCount > 0) {
    console.log("⚠️  Some images failed to process. Check errors above.");
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
