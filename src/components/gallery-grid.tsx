import Image from "next/image";
import Link from "next/link";
import type { GalleryImage } from "@/lib/gallery";

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
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {images.map((image) => (
        <figure
          key={image.id}
          className="group overflow-hidden border border-zinc-200 bg-white transition dark:border-zinc-800 dark:bg-zinc-900"
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
          <figcaption className="space-y-2 p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {image.title ?? (locale === "zh" ? "未命名照片" : "Untitled Photo")}
            </p>
            {image.description && (
              <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {image.description}
              </p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(image.createdAt))}
            </p>
          </figcaption>
        </figure>
      ))}
      {images.length >= 6 && (
        <Link
          href={`/${locale}/gallery`}
          className="flex items-center justify-center border border-dashed border-zinc-300 text-sm font-medium text-zinc-900 underline underline-offset-4 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
        >
          {locale === "zh" ? "查看更多照片" : "View more photos"}
        </Link>
      )}
    </div>
  );
}
