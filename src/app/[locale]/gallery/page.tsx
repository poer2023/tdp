import Link from "next/link";
import { listCachedGalleryImages } from "@/lib/gallery";
import type { GalleryCategory, GalleryImage } from "@/lib/gallery";
import { ZhiHeader, ZhiFooter, ZhiGallery } from "@/components/zhi";
import type { ZhiGalleryItem } from "@/components/zhi";
import { GalleryCategoryTabs } from "@/components/gallery-category-tabs";
import { localePath } from "@/lib/locale-path";
import { GalleryMapWrapper } from "@/components/gallery-map-wrapper";

// ISR: Revalidate every 5 minutes for gallery updates with CDN caching
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes

// Default gallery limit to prevent performance issues with large datasets
const GALLERY_PAGE_LIMIT = 100;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; view?: string }>;
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
  const { category, view } = await searchParams;
  const l = locale === "zh" ? "zh" : "en";
  const isMapView = view === "map";

  // Parse and validate category
  const validCategories: GalleryCategory[] = ["REPOST", "ORIGINAL", "MOMENT"];
  // When category=all, show all images (null = no filter)
  // When no category specified, default to ORIGINAL (自行发布)
  const isAllCategory = category === "all";
  const currentCategory: GalleryCategory | null = isAllCategory
    ? null
    : category && validCategories.includes(category as GalleryCategory)
      ? (category as GalleryCategory)
      : "ORIGINAL";

  // Use cached function for gallery list page
  const images = await listCachedGalleryImages(GALLERY_PAGE_LIMIT, currentCategory ?? undefined);
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

            {imagesWithLocation.length > 0 && (() => {
              // Build category query param - preserve current category when switching views
              const categoryParam = isAllCategory
                ? "category=all"
                : currentCategory && currentCategory !== "ORIGINAL"
                  ? `category=${currentCategory}`
                  : "";

              return (
                <div className="flex items-center rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
                  <Link
                    href={localePath(l, `/gallery${categoryParam ? `?${categoryParam}` : ""}`)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${!isMapView
                      ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100"
                      : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                      }`}
                  >
                    {l === "zh" ? "网格" : "Grid"}
                  </Link>
                  <Link
                    href={localePath(l, `/gallery?view=map${categoryParam ? `&${categoryParam}` : ""}`)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${isMapView
                      ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100"
                      : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                      }`}
                  >
                    {l === "zh" ? "地图" : "Map"}
                    <span className="ml-1 text-xs text-stone-400">({imagesWithLocation.length})</span>
                  </Link>
                </div>
              );
            })()}
          </div>

          {/* Gallery Content - Grid or Map */}
          {isMapView ? (
            <GalleryMapWrapper
              images={imagesWithLocation.map((img) => ({
                id: img.id,
                title: img.title,
                description: img.description,
                latitude: img.latitude!,
                longitude: img.longitude!,
                locationName: img.locationName || null,
                city: img.city || null,
                country: img.country || null,
                capturedAt: img.capturedAt || null,
                microThumbPath: img.microThumbPath || null,
                smallThumbPath: img.smallThumbPath || null,
                mediumPath: img.mediumPath || null,
                filePath: img.filePath,
                isLivePhoto: img.isLivePhoto,
                createdAt: img.createdAt,
              }))}
              locale={l}
            />
          ) : (
            <ZhiGallery items={galleryItems} />
          )}

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
