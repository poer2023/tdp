import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGalleryImageById, getAdjacentImageIds } from "@/lib/gallery";
import { PhotoViewer } from "@/components/photo-viewer";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const image = await getGalleryImageById(id);

  if (!image) {
    return {
      title: "照片未找到",
    };
  }

  return {
    title: image.title || "未命名照片",
    description: image.description || undefined,
    openGraph: {
      title: image.title || "未命名照片",
      description: image.description || undefined,
      images: [{ url: image.filePath }],
    },
  };
}

export default async function PhotoDetailPage({ params }: Props) {
  const { id } = await params;
  const image = await getGalleryImageById(id);

  if (!image) {
    notFound();
  }

  const { prev, next, prevPath, nextPath } = await getAdjacentImageIds(id);

  return (
    <PhotoViewer
      image={image}
      prevId={prev || null}
      nextId={next || null}
      {...(prevPath && { prevPath })}
      {...(nextPath && { nextPath })}
    />
  );
}
