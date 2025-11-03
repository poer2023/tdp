"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Image from "next/image";
import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import "leaflet/dist/leaflet.css";
import type { GalleryImage } from "@/lib/gallery";
import { useEffect } from "react";
import L from "leaflet";

interface GalleryMapProps {
  images: GalleryImage[];
  locale?: "zh" | "en";
}

/**
 * 相册地图视图
 * 设计原则：解释型可视化，服务内容而非炫技
 * - 使用 OpenStreetMap（开源、可追溯）
 * - 标记样式克制，信息清晰
 * - Popup 内容结构化（标题+元信息+预览图）
 */
export function GalleryMap({ images, locale = "zh" }: GalleryMapProps) {
  const imagesWithLocation = images.filter((img) => img.latitude && img.longitude);

  // 修复 Leaflet 默认标记图标问题
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (!imagesWithLocation.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {locale === "zh" ? "暂无带位置信息的照片" : "No photos with location data"}
        </p>
      </div>
    );
  }

  // 计算地图中心点（所有照片的平均位置）
  const center: [number, number] = [
    imagesWithLocation.reduce((sum, img) => sum + (img.latitude || 0), 0) /
      imagesWithLocation.length,
    imagesWithLocation.reduce((sum, img) => sum + (img.longitude || 0), 0) /
      imagesWithLocation.length,
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={false}
        style={{ height: "600px", width: "100%" }}
        className="z-0"
      >
        {/* 使用 OpenStreetMap 瓦片（开源、可追溯） */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 照片标记 */}
        {imagesWithLocation.map((image) => (
          <Marker key={image.id} position={[image.latitude!, image.longitude!]}>
            <Popup maxWidth={280} className="gallery-map-popup">
              <article className="space-y-3">
                {/* 预览图 */}
                <div className="relative aspect-video overflow-hidden rounded bg-zinc-100">
                  <Image
                    src={image.filePath}
                    alt={image.title || "照片"}
                    fill
                    sizes="280px"
                    className="object-cover"
                  />
                  {image.isLivePhoto && (
                    <div className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-white uppercase backdrop-blur-sm">
                      LIVE
                    </div>
                  )}
                </div>

                {/* 标题与描述 */}
                <div className="space-y-1">
                  <h4 className="text-sm leading-tight font-semibold text-zinc-900">
                    {image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo")}
                  </h4>
                  {image.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600">
                      {image.description}
                    </p>
                  )}
                </div>

                {/* 元信息 */}
                <div className="space-y-1 border-t border-zinc-200 pt-2 text-xs text-zinc-500">
                  {image.locationName && (
                    <div className="flex items-start gap-1.5">
                      <svg
                        className="mt-0.5 h-3 w-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="leading-tight">{image.locationName}</span>
                    </div>
                  )}
                  {image.capturedAt && (
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
                      <time dateTime={image.capturedAt} className="leading-tight">
                        {new Date(image.capturedAt).toLocaleDateString(
                          locale === "zh" ? "zh-CN" : "en-US"
                        )}
                      </time>
                    </div>
                  )}
                </div>

                {/* 返回相册链接 */}
                <Link
                  href={localePath(locale, `/gallery/${image.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 underline underline-offset-2 transition-colors hover:text-zinc-600"
                >
                  {locale === "zh" ? "查看详情" : "View Details"}
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </article>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
