import Link from "next/link";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryCard } from "@/components/gallery-card";

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
    <div className="mx-auto max-w-[1200px] space-y-10 px-6 py-12 md:px-8 md:py-16">
      {/* Header */}
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">Gallery</p>
        <h1 className="text-4xl leading-tight font-bold text-zinc-900 md:text-5xl dark:text-zinc-50">
          {l === "zh" ? "灵感相册" : "Photo Gallery"}
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {l === "zh"
            ? "每一张照片都记录了创作过程中的清新瞬间。图像元数据自动提取，位置信息可追溯。"
            : "Each photo captures a moment during the creative process. Metadata is automatically extracted, and location information is traceable."}
        </p>
      </header>

      {/* Navigation */}
      {imagesWithLocation.length > 0 && (
        <nav className="flex items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <Link
            href={`/${l}/gallery`}
            className="text-sm font-medium text-zinc-900 underline decoration-zinc-400 decoration-2 underline-offset-4 dark:text-zinc-50"
          >
            {l === "zh" ? "全部照片" : "All Photos"}
          </Link>
          <Link
            href={`/${l}/gallery/map`}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {l === "zh" ? "地图视图" : "Map View"}
            <span className="ml-1.5 text-xs text-zinc-400">({imagesWithLocation.length})</span>
          </Link>
        </nav>
      )}

      {/* Grid */}
      {images.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <GalleryCard key={image.id} image={image} locale={l} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {l === "zh"
              ? "相册暂时没有内容，登录后台上传你的第一张照片吧。"
              : "No photos yet. Log in to the dashboard to upload your first photo."}
          </p>
        </div>
      )}

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
