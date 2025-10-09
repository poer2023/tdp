import Link from "next/link";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryMapWrapper } from "@/components/gallery-map-wrapper";

export const revalidate = 0;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedGalleryMapPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  const images = await listGalleryImages();
  const imagesWithLocation = images.filter((img) => img.latitude && img.longitude);

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-12 md:px-8 md:py-16">
      {/* Header */}
      <header className="max-w-3xl space-y-2.5 sm:space-y-3">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">
          Gallery / Map View
        </p>
        <h1 className="text-3xl leading-tight font-bold text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
          {l === "zh" ? "地图视图" : "Map View"}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          {l === "zh"
            ? "基于 EXIF GPS 数据的地理位置可视化。坐标信息通过 OpenStreetMap 逆地理编码服务转换为可读地址。点击标记查看照片详情。"
            : "Geographic visualization based on EXIF GPS data. Coordinates are converted to readable addresses via OpenStreetMap reverse geocoding service. Click markers to view photo details."}
        </p>
      </header>

      {/* Navigation */}
      <nav className="flex items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Link
          href={`/${l}/gallery`}
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {l === "zh" ? "全部照片" : "All Photos"}
        </Link>
        <Link
          href={`/${l}/gallery/map`}
          className="text-sm font-medium text-zinc-900 underline decoration-zinc-400 decoration-2 underline-offset-4 dark:text-zinc-50"
        >
          {l === "zh" ? "地图视图" : "Map View"}
          <span className="ml-1.5 text-xs text-zinc-400">({imagesWithLocation.length})</span>
        </Link>
      </nav>

      {/* Map container */}
      <GalleryMapWrapper images={images} locale={l} />

      {/* Footer */}
      <footer className="border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>
          {l === "zh" ? (
            <>
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
                    `（${images.length - imagesWithLocation.length} 张无位置数据）`}
                  。
                </>
              )}
              GPS 坐标从 EXIF 元数据自动提取，精度取决于拍摄设备。
            </>
          ) : (
            <>
              Map data provided by{" "}
              <a
                href="https://www.openstreetmap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                OpenStreetMap
              </a>
              .
              {imagesWithLocation.length > 0 && (
                <>
                  {" "}
                  {imagesWithLocation.length} photo{imagesWithLocation.length !== 1 ? "s" : ""} with
                  location data
                  {images.length > imagesWithLocation.length &&
                    ` (${images.length - imagesWithLocation.length} without)`}
                  .
                </>
              )}{" "}
              GPS coordinates extracted from EXIF metadata, accuracy depends on capture device.
            </>
          )}
        </p>
      </footer>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
