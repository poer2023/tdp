import Link from "next/link";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryMapWrapper } from "@/components/gallery-map-wrapper";

export const revalidate = 0;

export default async function GalleryMapPage() {
  const images = await listGalleryImages();
  const imagesWithLocation = images.filter((img) => img.latitude && img.longitude);

  return (
    <div className="mx-auto max-w-[1200px] space-y-10 px-6 py-12 md:px-8 md:py-16">
      {/* Header - 期刊式标题 */}
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">
          Gallery / Map View
        </p>
        <h1 className="text-4xl leading-tight font-bold text-zinc-900 md:text-5xl dark:text-zinc-50">
          地图视图
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          基于 EXIF GPS 数据的地理位置可视化。坐标信息通过 OpenStreetMap
          逆地理编码服务转换为可读地址。点击标记查看照片详情。
        </p>
      </header>

      {/* 导航栏 - 克制的分隔 */}
      <nav className="flex items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Link
          href="/gallery"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          全部照片
        </Link>
        <Link
          href="/gallery/map"
          className="text-sm font-medium text-zinc-900 underline decoration-zinc-400 decoration-2 underline-offset-4 dark:text-zinc-50"
        >
          地图视图
          <span className="ml-1.5 text-xs text-zinc-400">({imagesWithLocation.length})</span>
        </Link>
      </nav>

      {/* 地图容器 */}
      <GalleryMapWrapper images={images} />

      {/* Footer - 技术说明（证据链）*/}
      <footer className="border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>
          地图数据由{" "}
          <a
            href="https://www.openstreetmap.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            OpenStreetMap
          </a>{" "}
          提供。
          {imagesWithLocation.length > 0 && (
            <>
              共 {imagesWithLocation.length} 张照片包含地理位置信息
              {images.length > imagesWithLocation.length &&
                `（{images.length - imagesWithLocation.length} 张无位置数据）`}
              。
            </>
          )}
          GPS 坐标从 EXIF 元数据自动提取，精度取决于拍摄设备。
        </p>
      </footer>
    </div>
  );
}
