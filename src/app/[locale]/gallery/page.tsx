import Link from "next/link";
import { listGalleryImages } from "@/lib/gallery";
import type { GalleryCategory, GalleryImage } from "@/lib/gallery";
import { ZhiHeader, ZhiFooter, ZhiGallery } from "@/components/zhi";
import type { ZhiGalleryItem } from "@/components/zhi";
import { GalleryCategoryTabs } from "@/components/gallery-category-tabs";
import { localePath } from "@/lib/locale-path";

// Force dynamic to avoid DB during build pipelines without DATABASE_URL
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicIO = true;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

// Convert database gallery image to Zhi gallery item format
function toGalleryItem(image: GalleryImage, locale: string): ZhiGalleryItem {
  const dateStr = new Date(image.createdAt).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return {
    id: image.id,
    type: "image",
    url: image.filePath,
    thumbnail: image.smallThumbPath || image.microThumbPath || undefined,
    title: image.title || (locale === "zh" ? "无标题" : "Untitled"),
    description: image.description || undefined,
    date: dateStr,
    location: image.locationName || undefined,
    width: image.width || undefined,
    height: image.height || undefined,
    // Extended fields for enhanced lightbox
    mediumPath: image.mediumPath || undefined,
    smallThumbPath: image.smallThumbPath || undefined,
    microThumbPath: image.microThumbPath || undefined,
    fileSize: image.fileSize || undefined,
    mimeType: image.mimeType || undefined,
    capturedAt: image.capturedAt || undefined,
    createdAt: image.createdAt,
    latitude: image.latitude || undefined,
    longitude: image.longitude || undefined,
    city: image.city || undefined,
    country: image.country || undefined,
    locationName: image.locationName || undefined,
    isLivePhoto: image.isLivePhoto || undefined,
    livePhotoVideoPath: image.livePhotoVideoPath || undefined,
    storageType: image.storageType || undefined,
    // Note: EXIF data not available in current schema
    exif: undefined,
  };
}

export default async function LocalizedGalleryPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { category } = await searchParams;
  const l = locale === "zh" ? "zh" : "en";

  // Parse and validate category
  const validCategories: GalleryCategory[] = ["REPOST", "ORIGINAL", "AI"];
  const currentCategory =
    category && validCategories.includes(category as GalleryCategory)
      ? (category as GalleryCategory)
      : undefined;

  const images = await listGalleryImages(undefined, currentCategory);
  const imagesWithLocation = images.filter((img) => img.latitude && img.longitude);

  // Convert to Zhi gallery format
  const galleryItems: ZhiGalleryItem[] = images.map((img) => toGalleryItem(img, l));

  return (
    <>
      <ZhiHeader />
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
        {/* Header Section */}
        <div className="mx-auto max-w-6xl px-4 py-8 text-center md:py-12">
          <h1 className="mb-4 font-serif text-4xl text-stone-900 md:text-5xl dark:text-stone-100">
            {l === "zh" ? "相册" : "Gallery"}
          </h1>
          <p className="mx-auto max-w-lg font-light text-stone-500 dark:text-stone-400">
            {l === "zh"
              ? "光影与时刻的收藏。一帧一帧，记录这个世界。"
              : "A collection of light, shadow, and motion. Capturing the world one frame at a time."}
          </p>
        </div>

        {/* Category Tabs & Navigation */}
        <div className="mx-auto max-w-7xl px-4 pb-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <GalleryCategoryTabs locale={l} currentCategory={currentCategory} />

            {imagesWithLocation.length > 0 && (
              <nav className="flex items-center gap-6">
                <Link
                  href={localePath(l, "/gallery")}
                  className="text-sm font-medium text-stone-800 underline decoration-sage-500 decoration-2 underline-offset-4 dark:text-stone-200"
                >
                  {l === "zh" ? "全部照片" : "All Photos"}
                </Link>
                <Link
                  href={localePath(l, "/gallery/map")}
                  className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  {l === "zh" ? "地图视图" : "Map View"}
                  <span className="ml-1.5 text-xs text-stone-400">({imagesWithLocation.length})</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Gallery Grid */}
          <ZhiGallery items={galleryItems} />

          {/* Footer Info */}
          {images.length > 0 && (
            <footer className="mt-12 border-t border-stone-200 pt-6 text-center text-xs leading-relaxed text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <p>
                {l === "zh" ? (
                  <>
                    共 {images.length} 张照片
                    {imagesWithLocation.length > 0 &&
                      `，其中 ${imagesWithLocation.length} 张包含地理位置信息`}
                    。
                  </>
                ) : (
                  <>
                    {images.length} photo{images.length !== 1 ? "s" : ""} in total
                    {imagesWithLocation.length > 0 &&
                      `, ${imagesWithLocation.length} with location data`}
                    .
                  </>
                )}
              </p>
            </footer>
          )}
        </div>
      </main>
      <ZhiFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
