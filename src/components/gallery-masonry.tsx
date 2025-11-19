import Link from "next/link";
import Image from "next/image";
import type { GalleryImage } from "@/lib/gallery";

type Props = {
  images: GalleryImage[];
  locale?: "zh" | "en";
};

// Masonry using CSS multi-columns. Items avoid breaking and keep natural height.
export function GalleryMasonry({ images, locale = "zh" }: Props) {
  if (!images?.length) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-6 py-14 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {locale === "zh" ? "相册还没有照片" : "No photos yet"}
      </p>
    );
  }

  return (
    <div className="columns-1 gap-3 [column-fill:_balance] sm:columns-2 sm:gap-4 lg:columns-3 xl:columns-4">
      {images.map((img) => {
        const w = img.width || 1600;
        const h = img.height || 1000;
        return (
          <figure key={img.id} className="mb-3 break-inside-avoid sm:mb-4">
            <Link
              href={`/${locale}/gallery/${img.id}`}
              className="group block overflow-hidden rounded-lg ring-1 ring-zinc-200 transition-shadow hover:shadow-sm dark:ring-zinc-800"
            >
              <Image
                src={img.mediumPath || img.smallThumbPath || img.filePath}
                alt={img.title || (locale === "zh" ? "相册照片" : "Photo")}
                width={w}
                height={h}
                className="h-auto w-full bg-zinc-100 object-cover dark:bg-zinc-800"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={false}
              />
            </Link>
            {(img.title || img.description) && (
              <figcaption className="px-1.5 pt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {img.title || (locale === "zh" ? "未命名照片" : "Untitled")}
                </span>
                {img.description && (
                  <span className="ml-1 text-zinc-500 dark:text-zinc-400">· {img.description}</span>
                )}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
