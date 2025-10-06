import Link from "next/link";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryMasonry } from "@/components/gallery-masonry";

export const revalidate = 0;

export default async function GalleryPage() {
  const images = await listGalleryImages();
  const imagesWithLocation = images.filter((img) => img.latitude && img.longitude);

  return (
    <div className="mx-auto max-w-[1200px] space-y-10 px-6 py-12 md:px-8 md:py-16">
      {/* Header - 期刊式标题 */}
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">Gallery</p>
        <h1 className="text-4xl leading-tight font-bold text-zinc-900 md:text-5xl dark:text-zinc-50">
          灵感相册
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          每一张照片都记录了创作过程中的清新瞬间。图像元数据自动提取，位置信息可追溯。
        </p>
      </header>

      {/* 导航栏 - 克制的分隔 */}
      {imagesWithLocation.length > 0 && (
        <nav className="flex items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <Link
            href="/gallery"
            className="text-sm font-medium text-zinc-900 underline decoration-zinc-400 decoration-2 underline-offset-4 dark:text-zinc-50"
          >
            全部照片
          </Link>
          <Link
            href="/gallery/map"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            地图视图
            <span className="ml-1.5 text-xs text-zinc-400">({imagesWithLocation.length})</span>
          </Link>
        </nav>
      )}

      {/* Masonry grid with orderly gutters */}
      <section className="rounded-xl bg-white p-0 dark:bg-transparent">
        <GalleryMasonry images={images} locale="zh" />
      </section>

      {/* Footer - 元信息说明 */}
      {images.length > 0 && (
        <footer className="border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            共 {images.length} 张照片
            {imagesWithLocation.length > 0 &&
              `，其中 ${imagesWithLocation.length} 张包含地理位置信息`}
            。元数据由 EXIF 自动提取，地理位置通过 OpenStreetMap 逆地理编码服务获取。
          </p>
        </footer>
      )}
    </div>
  );
}
