
import prisma from "../src/lib/prisma";

async function findMisconfiguredPaths() {
    console.log("Searching for GalleryImages where mediumPath looks like a micro thumbnail...");

    const images = await prisma.galleryImage.findMany({
        where: {
            mediumPath: { contains: "_micro" }
        },
        select: {
            id: true,
            title: true,
            mediumPath: true
        }
    });

    if (images.length > 0) {
        console.log(`Found ${images.length} misconfigured images:`);
        console.table(images);
    } else {
        console.log("No misconfigured images found.");
    }
}

findMisconfiguredPaths()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
