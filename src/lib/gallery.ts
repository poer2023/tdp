import prisma from "@/lib/prisma";

export type GalleryImage = {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
  postId: string | null;
  createdAt: string;
};

export type CreateGalleryImageInput = {
  title?: string | null;
  description?: string | null;
  filePath: string;
  postId?: string | null;
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
    },
  });

  return toGalleryImage(image);
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await prisma.galleryImage.delete({ where: { id } });
}

function toGalleryImage(image: {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
  postId: string | null;
  createdAt: Date;
}): GalleryImage {
  return {
    id: image.id,
    title: image.title,
    description: image.description,
    filePath: image.filePath,
    postId: image.postId,
    createdAt: image.createdAt.toISOString(),
  };
}
