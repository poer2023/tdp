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
  // Fetch all images for the thumbnail strip to ensure navigation works for all images
  // This is necessary because the client-side navigation relies on finding the current ID in this list.
  const thumbs = (await listGalleryImages(undefined)).map((g) => ({
    id: g.id,
    filePath: g.filePath,
    microThumbPath: g.microThumbPath ?? undefined,
    smallThumbPath: g.smallThumbPath ?? undefined,
    mediumPath: g.mediumPath ?? undefined,
  }));

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
