import Link from "next/link";
import Image from "next/image";
import type { GalleryImage } from "@prisma/client";
import { t, type AdminLocale } from "@/lib/admin-translations";
import { localePath } from "@/lib/locale-path";

type RecentUploadsProps = {
  images: GalleryImage[];
  locale: AdminLocale;
  isServiceDegraded?: boolean;
};

export function RecentUploads({ images, locale, isServiceDegraded = false }: RecentUploadsProps) {
  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        {t(locale, "recentUploads")}
      </h3>

      {isServiceDegraded ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <svg
            className="h-8 w-8 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {t(locale, "serviceTemporarilyUnavailable")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(locale, "galleryDataInaccessible")}
          </p>
        </div>
      ) : images.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">{t(locale, "noUploadsYet")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <Link
              key={image.id}
              href={localePath(locale, `/gallery/${image.id}`)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"
            >
              <Image
                src={image.smallThumbPath ?? image.mediumPath ?? image.filePath}
                alt={image.title || "Untitled"}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 1024px) 33vw, 120px"
              />
              {image.isLivePhoto && (
                <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                  LIVE
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/admin/gallery"
        className="mt-4 block text-center text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
      >
        View all →
      </Link>
    </div>
  );
}
