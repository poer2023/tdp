import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { extractExif } from "@/lib/exif";
import { reverseGeocode } from "@/lib/geocoding";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { imageId } = await req.json();

        if (!imageId) {
            return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
        }

        // Get the image record
        const image = await prisma.galleryImage.findUnique({
            where: { id: imageId },
        });

        if (!image) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        // Fetch the original image
        const imageUrl = image.filePath;
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        // Extract EXIF data
        const exif = await extractExif(imageBuffer);

        if (!exif?.latitude || !exif?.longitude) {
            return NextResponse.json({
                ok: false,
                message: "No GPS data found in image EXIF"
            }, { status: 200 });
        }

        // Reverse geocode to get location name
        let location = null;
        try {
            location = await reverseGeocode(exif.latitude, exif.longitude);
        } catch (e) {
            console.error("Geocoding failed:", e);
        }

        // Update the database
        const updated = await prisma.galleryImage.update({
            where: { id: imageId },
            data: {
                latitude: exif.latitude,
                longitude: exif.longitude,
                locationName: location?.locationName ?? null,
                city: location?.city ?? null,
                country: location?.country ?? null,
                width: exif.width ?? image.width,
                height: exif.height ?? image.height,
                capturedAt: exif.capturedAt ?? image.capturedAt,
            },
        });

        // Revalidate gallery pages
        revalidatePath("/gallery");
        revalidatePath("/zh/gallery");
        revalidatePath("/admin/gallery");

        return NextResponse.json({
            ok: true,
            image: updated,
            extracted: {
                latitude: exif.latitude,
                longitude: exif.longitude,
                locationName: location?.locationName,
                city: location?.city,
                country: location?.country,
            },
        });
    } catch (err) {
        console.error("Re-extract EXIF error:", err);
        return NextResponse.json({ error: "Failed to re-extract EXIF" }, { status: 500 });
    }
}
