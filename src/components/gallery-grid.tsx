import Image from "next/image";
import Link from "next/link";
import type { GalleryImage } from "@/lib/gallery";

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  if (!images.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        相册还没有照片，登录后台即可上传。
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {images.map((image) => (
        <figure
          key={image.id}
          className="group overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/70 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-900/80"
        >
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={image.filePath}
              alt={image.title ?? "博客相册照片"}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
          <figcaption className="space-y-1 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {image.title ?? "未命名照片"}
            </p>
            {image.description && (
              <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                {image.description}
              </p>
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {new Intl.DateTimeFormat("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(image.createdAt)}
            </p>
          </figcaption>
        </figure>
      ))}
      {images.length >= 6 && (
        <Link
          href="/gallery"
          className="flex items-center justify-center rounded-3xl border border-dashed border-blue-300 bg-blue-50 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
        >
          查看更多照片 →
        </Link>
      )}
    </div>
  );
}
