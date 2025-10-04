import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { getGalleryImageById, getAdjacentImageIds } from "@/lib/gallery";
import { PhotoViewer } from "@/components/photo-viewer";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const l = locale === "zh" ? "zh" : "en";
  const image = await getGalleryImageById(id);

  if (!image) {
    return {
      title: l === "zh" ? "照片未找到" : "Photo Not Found",
    };
  }

  return {
    title: image.title || (l === "zh" ? "未命名照片" : "Untitled Photo"),
    description: image.description || undefined,
    openGraph: {
      title: image.title || (l === "zh" ? "未命名照片" : "Untitled Photo"),
      description: image.description || undefined,
      images: [{ url: image.filePath }],
    },
  };
}

export default async function LocalizedPhotoDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const l = locale === "zh" ? "zh" : "en";
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
      locale={l}
    />
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
