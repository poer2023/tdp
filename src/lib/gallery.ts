import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

export type GalleryImage = {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
  microThumbPath?: string | null;
  smallThumbPath?: string | null;
  mediumPath?: string | null;
  postId: string | null;
  createdAt: string;

  // 地理位置
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  city?: string | null;
  country?: string | null;

  // Live Photo
  livePhotoVideoPath?: string | null;
  isLivePhoto: boolean;

  // 元数据
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  capturedAt?: string | null;
  storageType: string;
};

export type CreateGalleryImageInput = {
  title?: string | null;
  description?: string | null;
  filePath: string;
  microThumbPath?: string | null;
  smallThumbPath?: string | null;
  mediumPath?: string | null;
  postId?: string | null;

  // 地理位置
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  city?: string | null;
  country?: string | null;

  // Live Photo
  livePhotoVideoPath?: string | null;
  isLivePhoto?: boolean;

  // 元数据
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  capturedAt?: Date | null;
  storageType?: string;
};

export async function listGalleryImages(limit?: number): Promise<GalleryImage[]> {
  // Prefer DB; if DB not reachable, fallback to filesystem (for E2E only)
  try {
    const args = (
      typeof limit === "number"
        ? { orderBy: { createdAt: "desc" }, take: limit }
        : { orderBy: { createdAt: "desc" } }
    ) as Parameters<typeof prisma.galleryImage.findMany>[0];
    const images = await prisma.galleryImage.findMany(args);
    return images.map(toGalleryImage);
  } catch (_e) {
    if (!SKIP_DB) throw e;
    try {
      const base = path.join(process.cwd(), "public", "uploads", "gallery");
      const files = fs.existsSync(base)
        ? fs
            .readdirSync(base)
            .filter((f) => /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(f))
            .slice(0, typeof limit === "number" ? limit : 50)
        : [];
      return files.map((f, idx) => ({
        id: f.replace(/\.[^.]+$/, "") + "-fallback",
        title: null,
        description: null,
        filePath: `/uploads/gallery/${f}`,
        postId: null,
        createdAt: new Date(Date.now() - idx * 60_000).toISOString(),
        latitude: null,
        longitude: null,
        locationName: null,
        city: null,
        country: null,
        livePhotoVideoPath: null,
        isLivePhoto: false,
        fileSize: null,
        width: null,
        height: null,
        mimeType: null,
        capturedAt: null,
        storageType: "local",
      }));
    } catch {
      return [];
    }
  }
}

export async function addGalleryImage(input: CreateGalleryImageInput): Promise<GalleryImage> {
  // Deduplicate by filePath: if exists, update missing fields and return existing
  const existing = await prisma.galleryImage.findFirst({ where: { filePath: input.filePath } });
  if (existing) {
    const updated = await prisma.galleryImage.update({
      where: { id: existing.id },
      data: {
        title: input.title?.trim() || existing.title,
        description: input.description?.trim() || existing.description,
        postId: input.postId ?? existing.postId,
        latitude: input.latitude ?? existing.latitude,
        longitude: input.longitude ?? existing.longitude,
        locationName: input.locationName?.trim() || existing.locationName,
        city: input.city?.trim() || existing.city,
        country: input.country?.trim() || existing.country,
        livePhotoVideoPath: input.livePhotoVideoPath ?? existing.livePhotoVideoPath,
        isLivePhoto: input.isLivePhoto ?? existing.isLivePhoto,
        fileSize: input.fileSize ?? existing.fileSize,
        width: input.width ?? existing.width,
        height: input.height ?? existing.height,
        mimeType: input.mimeType ?? existing.mimeType,
        capturedAt: input.capturedAt ?? existing.capturedAt,
        storageType: input.storageType ?? existing.storageType,
      },
    });
    return toGalleryImage(updated);
  }

  const image = await prisma.galleryImage.create({
    data: {
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
      filePath: input.filePath,
      microThumbPath: input.microThumbPath ?? null,
      smallThumbPath: input.smallThumbPath ?? null,
      mediumPath: input.mediumPath ?? null,
      postId: input.postId ?? null,

      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      locationName: input.locationName?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,

      livePhotoVideoPath: input.livePhotoVideoPath ?? null,
      isLivePhoto: input.isLivePhoto ?? false,

      fileSize: input.fileSize ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      mimeType: input.mimeType ?? null,
      capturedAt: input.capturedAt ?? null,
      storageType: input.storageType ?? "local",
    },
  });
  return toGalleryImage(image);
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await prisma.galleryImage.delete({ where: { id } });
}

export async function getGalleryImageById(id: string): Promise<GalleryImage | null> {
  try {
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) return null;
    return toGalleryImage(image);
  } catch (e) {
    if (!SKIP_DB) throw e;
    try {
      const base = path.join(process.cwd(), "public", "uploads", "gallery");
      if (!fs.existsSync(base)) return null;
      const files = fs
        .readdirSync(base)
        .filter((f) => /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(f));
      const target = files.find((f) => id.startsWith(f.replace(/\.[^.]+$/, "")));
      if (!target) return null;
      return {
        id,
        title: null,
        description: null,
        filePath: `/uploads/gallery/${target}`,
        postId: null,
        createdAt: new Date().toISOString(),
        latitude: null,
        longitude: null,
        locationName: null,
        city: null,
        country: null,
        livePhotoVideoPath: null,
        isLivePhoto: false,
        fileSize: null,
        width: null,
        height: null,
        mimeType: null,
        capturedAt: null,
        storageType: "local",
      };
    } catch {
      return null;
    }
  }
}

export async function getAdjacentImageIds(id: string): Promise<{
  prev: string | null;
  next: string | null;
  prevPath?: string;
  nextPath?: string;
}> {
  try {
    const currentImage = await prisma.galleryImage.findUnique({ where: { id } });
    if (!currentImage) return { prev: null, next: null };
    const prevImage = await prisma.galleryImage.findFirst({
      where: { createdAt: { lt: currentImage.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { id: true, filePath: true },
    });
    const nextImage = await prisma.galleryImage.findFirst({
      where: { createdAt: { gt: currentImage.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { id: true, filePath: true },
    });
    return {
      prev: prevImage?.id || null,
      next: nextImage?.id || null,
      prevPath: prevImage?.filePath ?? undefined,
      nextPath: nextImage?.filePath ?? undefined,
    };
  } catch (_e) {
    if (!SKIP_DB) return { prev: null, next: null };
    try {
      const base = path.join(process.cwd(), "public", "uploads", "gallery");
      if (!fs.existsSync(base)) return { prev: null, next: null };
      const files = fs
        .readdirSync(base)
        .filter((f) => /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(f));
      const ids = files.map((f) => f.replace(/\.[^.]+$/, "") + "-fallback");
      const idx = ids.indexOf(id);
      if (idx === -1) return { prev: null, next: null };
      const prevIdx = idx > 0 ? idx - 1 : -1;
      const nextIdx = idx < ids.length - 1 ? idx + 1 : -1;
      return {
        prev: prevIdx >= 0 ? (ids[prevIdx] as string) : null,
        next: nextIdx >= 0 ? (ids[nextIdx] as string) : null,
        prevPath: prevIdx >= 0 ? `/uploads/gallery/${files[prevIdx]}` : undefined,
        nextPath: nextIdx >= 0 ? `/uploads/gallery/${files[nextIdx]}` : undefined,
      };
    } catch {
      return { prev: null, next: null };
    }
  }
}

function toGalleryImage(image: {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
  microThumbPath: string | null;
  smallThumbPath: string | null;
  mediumPath: string | null;
  postId: string | null;
  createdAt: Date;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  city: string | null;
  country: string | null;
  livePhotoVideoPath: string | null;
  isLivePhoto: boolean;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  capturedAt: Date | null;
  storageType: string;
}): GalleryImage {
  return {
    id: image.id,
    title: image.title,
    description: image.description,
    filePath: image.filePath,
    microThumbPath: image.microThumbPath,
    smallThumbPath: image.smallThumbPath,
    mediumPath: image.mediumPath,
    postId: image.postId,
    createdAt: image.createdAt.toISOString(),
    latitude: image.latitude,
    longitude: image.longitude,
    locationName: image.locationName,
    city: image.city,
    country: image.country,
    livePhotoVideoPath: image.livePhotoVideoPath,
    isLivePhoto: image.isLivePhoto,
    fileSize: image.fileSize,
    width: image.width,
    height: image.height,
    mimeType: image.mimeType,
    capturedAt: image.capturedAt?.toISOString() || null,
    storageType: image.storageType,
  };
}
