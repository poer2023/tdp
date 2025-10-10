import Image from "next/image";
import Link from "next/link";
import type { GalleryImage } from "@/lib/gallery";
import { localePath } from "@/lib/locale-path";

interface GalleryGridProps {
  images: GalleryImage[];
  locale?: "zh" | "en";
}

export function GalleryGrid({ images, locale = "zh" }: GalleryGridProps) {
  if (!images.length) {
    return (
      <p className="border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {locale === "zh"
          ? "相册还没有照片，登录后台即可上传"
          : "No photos yet, log in to the dashboard to upload"}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
      {images.map((image) => (
        <Link
          key={image.id}
          href={localePath(locale, `/gallery/${image.id}`)}
          className="group block overflow-hidden rounded-lg sm:rounded-xl"
        >
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={image.smallThumbPath || image.microThumbPath || image.filePath}
              alt={image.title ?? (locale === "zh" ? "博客相册照片" : "Gallery photo")}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
