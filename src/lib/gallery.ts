import prisma from "@/lib/prisma";

export type GalleryImage = {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
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
  const args = (
    typeof limit === "number"
      ? { orderBy: { createdAt: "desc" }, take: limit }
      : { orderBy: { createdAt: "desc" } }
  ) as Parameters<typeof prisma.galleryImage.findMany>[0];
  const images = await prisma.galleryImage.findMany(args);

  return images.map(toGalleryImage);
}

export async function addGalleryImage(input: CreateGalleryImageInput): Promise<GalleryImage> {
  const image = await prisma.galleryImage.create({
    data: {
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
      filePath: input.filePath,
      postId: input.postId ?? null,

      // 地理位置
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      locationName: input.locationName?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,

      // Live Photo
      livePhotoVideoPath: input.livePhotoVideoPath ?? null,
      isLivePhoto: input.isLivePhoto ?? false,

      // 元数据
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
  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) return null;
  return toGalleryImage(image);
}

export async function getAdjacentImageIds(
  id: string
): Promise<{ prev: string | null; next: string | null }> {
  const currentImage = await prisma.galleryImage.findUnique({ where: { id } });
  if (!currentImage) return { prev: null, next: null };

  const prevImage = await prisma.galleryImage.findFirst({
    where: { createdAt: { lt: currentImage.createdAt } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const nextImage = await prisma.galleryImage.findFirst({
    where: { createdAt: { gt: currentImage.createdAt } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return {
    prev: prevImage?.id || null,
    next: nextImage?.id || null,
  };
}

function toGalleryImage(image: {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
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
