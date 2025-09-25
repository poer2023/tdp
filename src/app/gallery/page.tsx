import Image from "next/image";
import { listGalleryImages } from "@/lib/gallery";

export const revalidate = 0;

export default async function GalleryPage() {
  const images = await listGalleryImages();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-12 sm:px-8">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">灵感相册</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          每一张照片都记录了创作过程中的清新瞬间。
        </p>
      </header>

      {images.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {images.map((image) => (
            <figure
              key={image.id}
              className="group overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800/70 dark:bg-zinc-900/70"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={image.filePath}
                  alt={image.title ?? "相册照片"}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="space-y-1 px-4 py-3 text-sm">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {image.title ?? "未命名照片"}
                </p>
                {image.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{image.description}</p>
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
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          相册暂时没有内容，登录后台上传你的第一张照片吧。
        </p>
      )}
    </div>
  );
}
