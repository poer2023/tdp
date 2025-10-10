import Link from "next/link";
import Image from "next/image";
import type { GallerySearchResult } from "@/lib/search";
import { HighlightText } from "./highlight-text";

type Props = {
  image: GallerySearchResult;
  query: string;
  locale: string;
  onSelect: () => void;
};

export function SearchResultImage({ image, query, locale, onSelect }: Props) {
  // Use thumbnail if available, otherwise show placeholder
  const thumbUrl = image.microThumbPath || image.smallThumbPath || "/placeholder.png";

  // Build location string
  const location = [image.city, image.country, image.locationName].filter(Boolean).join(", ");

  return (
    <Link
      href={`/${locale}/gallery/${image.id}`}
      onClick={onSelect}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Image thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {thumbUrl !== "/placeholder.png" ? (
          <Image
            src={thumbUrl}
            alt={image.title || "Gallery image"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🖼️</div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {image.title && (
          <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <HighlightText text={image.title} query={query} />
          </h3>
        )}
        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span>📍</span>
            <span className="truncate">
              <HighlightText text={location} query={query} />
            </span>
          </p>
        )}
        {image.category && (
          <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {image.category === "ORIGINAL" && "原创"}
            {image.category === "REPOST" && "转载"}
            {image.category === "AI" && "AI"}
          </span>
        )}
      </div>
    </Link>
  );
}
