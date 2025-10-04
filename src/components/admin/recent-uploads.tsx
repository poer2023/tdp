import Link from "next/link";
import Image from "next/image";
import type { GalleryImage } from "@prisma/client";

type RecentUploadsProps = {
  images: GalleryImage[];
};

export function RecentUploads({ images }: RecentUploadsProps) {
  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        Recent Uploads
      </h3>

      {images.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">No uploads yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <Link
              key={image.id}
              href={`/gallery/${image.id}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"
            >
              <Image
                src={image.filePath}
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
