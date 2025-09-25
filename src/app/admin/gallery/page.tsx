import Image from "next/image";
import { listGalleryImages } from "@/lib/gallery";
import { listPostSummaries } from "@/lib/posts";
import { deleteGalleryImageAction } from "./actions";
import { GalleryUploadForm } from "./upload-form";

export const revalidate = 0;

export default async function AdminGalleryPage() {
  const [images, posts] = await Promise.all([listGalleryImages(), listPostSummaries()]);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Gallery</p>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">相册管理</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          上传、整理博客配图，让首页和文章更具视觉表现力。
        </p>
      </header>

      <GalleryUploadForm posts={posts} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">照片列表</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">共 {images.length} 张</span>
        </div>

        {images.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <figcaption className="space-y-2 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {image.title ?? "未命名照片"}
                    </p>
                    {image.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {image.description}
                      </p>
                    )}
                  </div>
                  <form action={deleteGalleryImageAction} className="inline-flex">
                    <input type="hidden" name="id" value={image.id} />
                    <input type="hidden" name="filePath" value={image.filePath} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/60 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      删除
                    </button>
                  </form>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            相册还没有内容，尝试上传一张照片吧。
          </p>
        )}
      </section>
    </div>
  );
}
