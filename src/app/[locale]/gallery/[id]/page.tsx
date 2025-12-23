import { notFound } from "next/navigation";
import { getGalleryImageById, listGalleryThumbs, type GalleryThumb } from "@/lib/gallery";
import { PhotoViewer } from "@/components/photo-viewer";

export const runtime = "nodejs";
// ISR: Match gallery list page revalidate (300s)
export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

/**
 * Calculate prev/next IDs from cached thumbnail list
 * Eliminates the separate getAdjacentImageIds query
 */
function getAdjacentFromThumbs(
  thumbs: GalleryThumb[],
  currentId: string
): { prev: string | null; next: string | null; prevPath?: string; nextPath?: string } {
  const idx = thumbs.findIndex((t) => t.id === currentId);
  if (idx === -1) {
    return { prev: null, next: null };
  }

  const prevThumb = idx > 0 ? thumbs[idx - 1] : null;
  const nextThumb = idx < thumbs.length - 1 ? thumbs[idx + 1] : null;

  return {
    prev: prevThumb?.id ?? null,
    next: nextThumb?.id ?? null,
    prevPath: prevThumb?.mediumPath ?? prevThumb?.filePath ?? undefined,
    nextPath: nextThumb?.mediumPath ?? nextThumb?.filePath ?? undefined,
  };
}

export default async function LocalizedGalleryDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const l = locale === "zh" ? "zh" : "en";

  // Fetch image and cached thumbnail list in parallel
  const [image, thumbs] = await Promise.all([getGalleryImageById(id), listGalleryThumbs()]);

  if (!image) {
    notFound();
  }

  // Calculate prev/next from cached thumbs instead of separate DB query
  const adjacent = getAdjacentFromThumbs(thumbs, id);

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
