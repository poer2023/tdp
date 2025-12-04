import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { extractExif } from "@/lib/exif";
import { reverseGeocode } from "@/lib/geocoding";
import { getStorageProvider } from "@/lib/storage";
import { addGalleryImage } from "@/lib/gallery";
import { revalidatePath } from "next/cache";
import { generateThumbnails, getThumbnailFilename } from "@/lib/image-processor";

export const runtime = "nodejs";
// Ensure no caching interferes with uploads
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const video = (formData.get("video") as File | null) ?? null;
    const title = (formData.get("title") as string | null)?.trim() || null;
    const description = (formData.get("description") as string | null)?.trim() || null;
    const category = (formData.get("category") as string | null) ?? "ORIGINAL";
    const postId = ((formData.get("postId") as string | null) ?? "").trim() || null;
    const capturedAtRaw = (formData.get("capturedAt") as string | null) ?? null;
    const capturedAt =
      capturedAtRaw && !Number.isNaN(new Date(capturedAtRaw).getTime())
        ? new Date(capturedAtRaw)
        : null;

    if (!image) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const imageBuf = Buffer.from(await image.arrayBuffer());
    const exif = await extractExif(imageBuf);

    let location = null as Awaited<ReturnType<typeof reverseGeocode>> | null;
    if (exif?.latitude && exif?.longitude) {
      try {
        location = await reverseGeocode(exif.latitude, exif.longitude);
      } catch {}
    }

    const storage = getStorageProvider();
    const baseKey = cryptoRandom();
    const imgExt = image.name.split(".").pop() || "bin";
    const imgKey = `${baseKey}.${imgExt}`;

    // Generate thumbnails
    const thumbnails = await generateThumbnails(imageBuf);

    // Upload original + 3 thumbnails in batch
    const [imgPath, microPath, smallPath, mediumPath] = (await storage.uploadBatch([
      { buffer: imageBuf, filename: imgKey, mimeType: image.type || "application/octet-stream" },
      {
        buffer: thumbnails.micro,
        filename: getThumbnailFilename(imgKey, "micro"),
        mimeType: "image/webp",
      },
      {
        buffer: thumbnails.small,
        filename: getThumbnailFilename(imgKey, "small"),
        mimeType: "image/webp",
      },
      {
        buffer: thumbnails.medium,
        filename: getThumbnailFilename(imgKey, "medium"),
        mimeType: "image/webp",
      },
    ])) as [string, string, string, string];

    let videoPublic: string | null = null;
    if (video) {
      const vidBuf = Buffer.from(await video.arrayBuffer());
      const vidExt = video.name.split(".").pop() || "mov";
      const vidKey = `${cryptoRandom()}.${vidExt}`;
      const vidPath = await storage.upload(vidBuf, vidKey, video.type || "video/quicktime");
      videoPublic = storage.getPublicUrl(vidPath);
    }

    const created = await addGalleryImage({
      title,
      description,
      filePath: storage.getPublicUrl(imgPath),
      microThumbPath: storage.getPublicUrl(microPath),
      smallThumbPath: storage.getPublicUrl(smallPath),
      mediumPath: storage.getPublicUrl(mediumPath),
      postId,
      category: category as "REPOST" | "ORIGINAL" | "AI",
      latitude: exif?.latitude ?? null,
      longitude: exif?.longitude ?? null,
      locationName: location?.locationName ?? null,
      city: location?.city ?? null,
      country: location?.country ?? null,
      livePhotoVideoPath: videoPublic,
      isLivePhoto: !!videoPublic,
      fileSize: image.size || null,
      width: exif?.width ?? null,
      height: exif?.height ?? null,
      mimeType: image.type || null,
      capturedAt: capturedAt ?? exif?.capturedAt ?? null,
      storageType: process.env.STORAGE_TYPE || "local",
    });

    // Revalidate root and localized homepages to reflect new uploads immediately
    revalidatePath("/");
    revalidatePath("/zh");
    // Optionally refresh gallery listings
    revalidatePath("/gallery");
    revalidatePath("/zh/gallery");
    revalidatePath("/admin/gallery");

    return NextResponse.json({ ok: true, image: created }, { status: 200 });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

function cryptoRandom() {
  // Avoid importing crypto in edge-agnostic way; runtime is node
  return (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(
    /-/g,
    ""
  );
}
