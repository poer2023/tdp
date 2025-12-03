import type { GalleryImage } from "@/lib/gallery";
import { LivePhotoPlayer } from "./live-photo-player";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";
import { localePath } from "@/lib/locale-path";

interface GalleryCardProps {
  image: GalleryImage;
  locale?: "zh" | "en";
  index?: number; // For prioritizing above-the-fold images
}

/**
 * 相册卡片组件
 * 设计原则：信息架构清晰，元数据可追溯
 * - 编辑部式卡片布局（非炫技视觉）
 * - 元数据作为"证据链"呈现
 * - 交互微妙（translate-y-0.5, shadow-sm）
 */
export function GalleryCard({ image, locale = "zh", index = 0 }: GalleryCardProps) {
  const hasLocation = image.latitude && image.longitude;
  const capturedDate = image.capturedAt ? new Date(image.capturedAt) : new Date(image.createdAt);
  const isPriority = index < 6; // Prioritize first 6 images (2 rows on desktop)

  return (
    <Link href={localePath(locale, `/gallery/${image.id}`)} className="block">
      <article className="group relative overflow-hidden rounded-lg border border-stone-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900">
        {/* 图片区域 */}
        <div className="relative aspect-square overflow-hidden bg-stone-100 dark:bg-stone-800">
          {image.isLivePhoto && image.livePhotoVideoPath ? (
            <LivePhotoPlayer
              imageSrc={image.filePath}
              videoSrc={image.livePhotoVideoPath}
              alt={image.title || "相册照片"}
            />
          ) : (
            <Image
              src={image.mediumPath || image.smallThumbPath || image.filePath}
              alt={image.title || "相册照片"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              priority={isPriority}
              loading={isPriority ? undefined : "lazy"}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y0ZjRmNSIvPjwvc3ZnPg=="
            />
          )}
        </div>

        {/* 元数据区域 - 编辑部式信息层级 */}
        <div className="space-y-2 p-4 sm:p-5">
          {/* 标题 */}
          <h3 className="text-sm leading-snug font-semibold text-stone-900 sm:text-base dark:text-stone-50">
            {image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo")}
          </h3>

          {/* 描述 */}
          {image.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-stone-600 sm:text-sm dark:text-stone-400">
              {image.description}
            </p>
          )}

          {/* 元信息 - 可追溯的证据链 */}
          <div className="space-y-1 border-t border-stone-100 pt-2.5 text-xs text-stone-500 sm:pt-3 dark:border-stone-800 dark:text-stone-400">
            {/* 地理位置 */}
            {hasLocation && (
              <div className="flex items-start gap-1.5">
                <svg
                  className="mt-0.5 h-3 w-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="leading-tight">
                  {image.city && image.country
                    ? `${image.city}, ${image.country}`
                    : image.locationName || (locale === "zh" ? "位置信息" : "Location Info")}
                </span>
              </div>
            )}

            {/* 拍摄时间 */}
            <div className="flex items-start gap-1.5">
              <svg
                className="mt-0.5 h-3 w-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <time dateTime={capturedDate.toISOString()} className="leading-tight">
                {formatDate(capturedDate, locale)}
              </time>
            </div>

            {/* 图像尺寸（移动端隐藏） */}
            {image.width && image.height && (
              <div className="hidden items-start gap-1.5 sm:flex">
                <svg
                  className="mt-0.5 h-3 w-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="leading-tight">
                  {image.width} × {image.height}
                  {image.fileSize && ` · ${formatFileSize(image.fileSize)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
