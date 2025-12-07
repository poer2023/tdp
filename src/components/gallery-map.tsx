"use client";

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import Image from "next/image";
import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import "leaflet/dist/leaflet.css";
import type { GalleryImage } from "@/lib/gallery";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { useTheme } from "next-themes";

interface GalleryMapProps {
  images: GalleryImage[];
  locale?: "zh" | "en";
}

/**
 * Create a custom photo thumbnail marker icon
 */
function createPhotoIcon(thumbnailUrl: string | null | undefined): L.DivIcon {
  const imgSrc = thumbnailUrl || "/placeholder-image.jpg";

  return L.divIcon({
    className: "photo-marker",
    html: `
      <div class="photo-marker-container">
        <div class="photo-marker-inner">
          <img src="${imgSrc}" alt="" />
        </div>
        <div class="photo-marker-tail"></div>
      </div>
    `,
    iconSize: [52, 62],
    iconAnchor: [26, 62],
    popupAnchor: [0, -62],
  });
}

/**
 * Gallery Map View - Redesigned
 * Features:
 * - Photo thumbnails as markers
 * - Scroll wheel & pinch zoom
 * - Dark mode map tiles
 * - Improved popup design
 */
export function GalleryMap({ images, locale = "zh" }: GalleryMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const imagesWithLocation = useMemo(
    () => images.filter((img) => img.latitude && img.longitude),
    [images]
  );

  // Inject custom marker styles
  useEffect(() => {
    const styleId = "photo-marker-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .photo-marker {
        background: transparent !important;
        border: none !important;
      }
      .photo-marker-container {
        position: relative;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        transition: transform 0.2s ease, filter 0.2s ease;
      }
      .photo-marker-container:hover {
        transform: scale(1.15) translateY(-4px);
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
        z-index: 1000 !important;
      }
      .photo-marker-inner {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid white;
        background: #f5f5f4;
      }
      .photo-marker-inner img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .photo-marker-tail {
        position: absolute;
        left: 50%;
        bottom: -8px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid white;
      }
      
      /* Dark mode marker */
      .dark .photo-marker-inner {
        border-color: #27272a;
        background: #27272a;
      }
      .dark .photo-marker-tail {
        border-top-color: #27272a;
      }
      
      /* Popup styles */
      .leaflet-popup-content-wrapper {
        border-radius: 16px !important;
        padding: 0 !important;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
      }
      .dark .leaflet-popup-content-wrapper {
        background: #1c1c1e !important;
        color: #fafafa !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
        width: 280px !important;
      }
      .leaflet-popup-tip {
        display: none;
      }
      .leaflet-popup-close-button {
        top: 8px !important;
        right: 8px !important;
        width: 28px !important;
        height: 28px !important;
        background: rgba(0,0,0,0.5) !important;
        border-radius: 50% !important;
        color: white !important;
        font-size: 18px !important;
        line-height: 28px !important;
        text-align: center !important;
        z-index: 10 !important;
      }
      .dark .leaflet-popup-close-button {
        background: rgba(255,255,255,0.2) !important;
      }
      
      /* Zoom control */
      .leaflet-control-zoom {
        border: none !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        border-radius: 12px !important;
        overflow: hidden;
      }
      .leaflet-control-zoom a {
        width: 36px !important;
        height: 36px !important;
        line-height: 36px !important;
        font-size: 18px !important;
        color: #44403c !important;
        background: white !important;
        border: none !important;
      }
      .leaflet-control-zoom a:hover {
        background: #f5f5f4 !important;
      }
      .dark .leaflet-control-zoom a {
        background: #27272a !important;
        color: #fafafa !important;
      }
      .dark .leaflet-control-zoom a:hover {
        background: #3f3f46 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!imagesWithLocation.length) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
            <svg className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
            {locale === "zh" ? "暂无带位置信息的照片" : "No photos with location data"}
          </p>
          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
            {locale === "zh"
              ? "上传包含 GPS 数据的照片即可在地图上显示"
              : "Upload photos with GPS data to display on map"}
          </p>
        </div>
      </div>
    );
  }

  // Calculate map bounds to fit all markers
  const bounds = L.latLngBounds(
    imagesWithLocation.map((img) => [img.latitude!, img.longitude!])
  );

  // Map tile URLs
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-lg dark:border-stone-800">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [50, 50] }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        zoomControl={false}
        style={{ height: "600px", width: "100%" }}
        className="z-0"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />

        {imagesWithLocation.map((image) => (
          <Marker
            key={image.id}
            position={[image.latitude!, image.longitude!]}
            icon={createPhotoIcon(image.microThumbPath || image.smallThumbPath)}
          >
            <Popup maxWidth={280} closeButton={true}>
              <div className="overflow-hidden">
                {/* Image Preview */}
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={image.mediumPath || image.smallThumbPath || image.filePath}
                    alt={image.title || "Photo"}
                    fill
                    sizes="280px"
                    className="object-cover"
                  />
                  {image.isLivePhoto && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      LIVE
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3 p-4">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo")}
                    </h4>
                    {image.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
                        {image.description}
                      </p>
                    )}
                  </div>

                  {/* Location & Date */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    {image.locationName && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {image.city || image.locationName}
                      </span>
                    )}
                    {image.capturedAt && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(image.capturedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link
                    href={localePath(locale, `/gallery/${image.id}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                  >
                    {locale === "zh" ? "查看详情" : "View Details"}
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
