import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { getStorageProviderAsync } from "@/lib/storage";
import { generateThumbnails, getThumbnailFilename } from "@/lib/image-processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/posts/upload
 * Upload cover image for posts
 * Returns the medium thumbnail URL for display
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const image = formData.get("image") as File | null;

        if (!image) {
            return NextResponse.json({ error: "Missing image file" }, { status: 400 });
        }

        const imageBuf = Buffer.from(await image.arrayBuffer());
        const storage = await getStorageProviderAsync();

        // Generate unique key
        const baseKey = cryptoRandom();
        const imgExt = image.name.split(".").pop() || "bin";
        const imgKey = `covers/${baseKey}.${imgExt}`;

        // Generate thumbnails (we only need medium for cover display)
        const thumbnails = await generateThumbnails(imageBuf, {
            medium: 1200,
        });

        // Upload original + medium thumbnail
        const [originalPath, mediumPath] = (await storage.uploadBatch([
            { buffer: imageBuf, filename: imgKey, mimeType: image.type || "application/octet-stream" },
            {
                buffer: thumbnails.medium,
                filename: getThumbnailFilename(imgKey, "medium"),
                mimeType: "image/webp",
            },
        ])) as [string, string];

        const originalUrl = storage.getPublicUrl(originalPath);
        const mediumUrl = storage.getPublicUrl(mediumPath);

        return NextResponse.json({
            ok: true,
            originalUrl,
            mediumUrl,
            // Use medium URL as the primary cover path
            coverUrl: mediumUrl,
        });
    } catch (err) {
        console.error("Post cover upload error:", err);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

function cryptoRandom() {
    return (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(
        /-/g,
        ""
    );
}
