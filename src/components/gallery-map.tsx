"use client";

import Image from "next/image";
import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import type { GalleryLocationImage } from "@/lib/gallery";
import { useCallback, useMemo, useRef } from "react";
import type MapLibreGL from "maplibre-gl";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from "@/components/ui/map";

interface GalleryMapProps {
  images: GalleryLocationImage[];
  locale?: "zh" | "en";
}

/**
 * Photo Thumbnail Marker Component
 */
function PhotoMarker({ image }: { image: GalleryLocationImage }) {
  const imgSrc = image.microThumbPath || image.smallThumbPath || "/placeholder-image.jpg";

  return (
    <div className="group relative">
      {/* Photo thumbnail circle */}
      <div className="relative transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-1">
        <div className="h-12 w-12 overflow-hidden rounded-full border-[3px] border-white bg-stone-100 shadow-lg dark:border-stone-800 dark:bg-stone-800">
          <Image
            src={imgSrc}
            alt={image.title || "Photo"}
            width={48}
            height={48}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
        {/* Pointer tail */}
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2">
          <div className="h-0 w-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-white dark:border-t-stone-800" />
        </div>
      </div>
      {/* Live photo indicator */}
      {image.isLivePhoto && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-bold text-black">
          L
        </div>
      )}
    </div>
  );
}

/**
 * Photo Popup Content Component
 */
function PhotoPopupContent({
  image,
  locale,
}: {
  image: GalleryLocationImage;
  locale: "zh" | "en";
}) {
  return (
    <div className="w-[280px] overflow-hidden rounded-xl bg-white shadow-xl dark:bg-stone-800">
      {/* Image Preview */}
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={image.mediumPath || image.smallThumbPath || image.filePath}
          alt={image.title || "Photo"}
          fill
          sizes="280px"
          className="rounded-t-xl object-cover"
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
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {image.city || image.locationName}
            </span>
          )}
          {image.capturedAt && (
            <span className="flex items-center gap-1">
              <svg
                className="h-3 w-3"
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
              {new Date(image.capturedAt).toLocaleDateString(
                locale === "zh" ? "zh-CN" : "en-US"
              )}
            </span>
          )}
        </div>

        {/* Action Button */}
        <Link
          href={localePath(locale, `/gallery/${image.id}`)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'rgb(28, 25, 23)',
            color: 'white'
          }}
        >
          {locale === "zh" ? "查看详情" : "View Details"}
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/**
 * Gallery Map View - MapLibre GL Implementation
 * Features:
 * - Photo thumbnails as markers
 * - Scroll wheel & pinch zoom
 * - Dark mode map tiles (auto-switch)
 * - Improved popup design with React components
 */
export function GalleryMap({ images, locale = "zh" }: GalleryMapProps) {
  const mapRef = useRef<MapLibreGL.Map | null>(null);

  const imagesWithLocation = useMemo(
    () => images.filter((img) => img.latitude && img.longitude),
    [images]
  );

  // Calculate center and zoom based on markers
  const { center, zoom } = useMemo(() => {
    if (imagesWithLocation.length === 0) {
      return { center: [116.4, 39.9] as [number, number], zoom: 4 };
    }

    const lngs = imagesWithLocation.map((img) => img.longitude!);
    const lats = imagesWithLocation.map((img) => img.latitude!);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // Calculate appropriate zoom level
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    const maxSpan = Math.max(lngSpan, latSpan);

    let zoomLevel = 12;
    if (maxSpan > 100) zoomLevel = 2;
    else if (maxSpan > 50) zoomLevel = 3;
    else if (maxSpan > 20) zoomLevel = 4;
    else if (maxSpan > 10) zoomLevel = 5;
    else if (maxSpan > 5) zoomLevel = 6;
    else if (maxSpan > 2) zoomLevel = 7;
    else if (maxSpan > 1) zoomLevel = 8;
    else if (maxSpan > 0.5) zoomLevel = 9;
    else if (maxSpan > 0.1) zoomLevel = 10;
    else if (maxSpan > 0.05) zoomLevel = 11;

    return {
      center: [centerLng, centerLat] as [number, number],
      zoom: zoomLevel,
    };
  }, [imagesWithLocation]);

  const handleMapLoad = useCallback((map: MapLibreGL.Map) => {
    mapRef.current = map;
  }, []);

  if (!imagesWithLocation.length) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
            <svg
              className="h-8 w-8 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
            {locale === "zh"
              ? "暂无带位置信息的照片"
              : "No photos with location data"}
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

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-lg dark:border-stone-800">
      <div className="h-[600px] w-full">
        <Map
          center={center}
          zoom={zoom}
          scrollZoom={true}
          doubleClickZoom={true}
          touchZoomRotate={true}
          onLoad={handleMapLoad}
        >
          <MapControls position="bottom-right" showZoom showFullscreen />

          {imagesWithLocation.map((image) => (
            <MapMarker
              key={image.id}
              longitude={image.longitude!}
              latitude={image.latitude!}
            >
              <MarkerContent>
                <PhotoMarker image={image} />
              </MarkerContent>
              <MarkerPopup closeButton>
                <PhotoPopupContent image={image} locale={locale} />
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>
      </div>
    </div>
  );
}
