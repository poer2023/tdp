import { notFound } from "next/navigation";
import { getAdjacentImageIds, getGalleryImageById, listGalleryImages } from "@/lib/gallery";
import { PhotoViewer } from "@/components/photo-viewer";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function LocalizedGalleryDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const l = locale === "zh" ? "zh" : "en";

  const image = await getGalleryImageById(id);
  if (!image) {
    notFound();
  }

  const adjacent = await getAdjacentImageIds(id);
  const thumbs = (await listGalleryImages(60)).map((g) => ({ id: g.id, filePath: g.filePath }));

  return (
    <PhotoViewer
      image={image}
      prevId={adjacent.prev}
      nextId={adjacent.next}
      prevPath={adjacent.prevPath}
      nextPath={adjacent.nextPath}
      locale={l}
      thumbnails={thumbs}
      currentId={id}
    />
  );
}
