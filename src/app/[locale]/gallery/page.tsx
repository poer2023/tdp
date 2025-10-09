import Link from "next/link";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryMasonry } from "@/components/gallery-masonry";
import { localePath } from "@/lib/locale-path";

export const revalidate = 0;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedGalleryPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  const images = await listGalleryImages();
  const imagesWithLocation = images.filter((img) => img.latitude && img.longitude);

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-12 md:px-8 md:py-16">
      {/* Header */}
      <header className="max-w-3xl space-y-2.5 sm:space-y-3">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">
          {l === "zh" ? "相册" : "COLLECTED IMAGES"}
        </p>
        <h1 className="text-3xl leading-tight font-bold text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
          {l === "zh" ? "图像日志" : "Image Journal"}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          {l === "zh"
            ? "拍的、生成的、喜欢的，都在这里。"
            : "A mix of photography, found visuals, and machine dreams."}
        </p>
      </header>

      {/* Navigation */}
      {imagesWithLocation.length > 0 && (
        <nav className="flex items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <Link
            href={localePath(l, "/gallery")}
            className="text-sm font-medium text-zinc-900 underline decoration-zinc-400 decoration-2 underline-offset-4 dark:text-zinc-50"
          >
            {l === "zh" ? "全部照片" : "All Photos"}
          </Link>
          <Link
            href={localePath(l, "/gallery/map")}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {l === "zh" ? "地图视图" : "Map View"}
            <span className="ml-1.5 text-xs text-zinc-400">({imagesWithLocation.length})</span>
          </Link>
        </nav>
      )}

      {/* Masonry grid with whitespace margins */}
      <section className="rounded-xl bg-white p-0 dark:bg-transparent">
        <GalleryMasonry images={images} locale={l} />
      </section>

      {/* Footer */}
      {images.length > 0 && (
        <footer className="border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            {l === "zh" ? (
              <>
                共 {images.length} 张照片
                {imagesWithLocation.length > 0 &&
                  `，其中 ${imagesWithLocation.length} 张包含地理位置信息`}
                。元数据由 EXIF 自动提取，地理位置通过 OpenStreetMap 逆地理编码服务获取。
              </>
            ) : (
              <>
                {images.length} photo{images.length !== 1 ? "s" : ""} in total
                {imagesWithLocation.length > 0 &&
                  `, ${imagesWithLocation.length} with location data`}
                . Metadata extracted from EXIF, geocoded via OpenStreetMap.
              </>
            )}
          </p>
        </footer>
      )}
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
