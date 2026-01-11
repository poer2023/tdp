"use client";

import React, { useEffect, useRef } from "react";
import type { ZhiGalleryItem } from "./types";

export type CarouselSlideProps = {
    item: ZhiGalleryItem;
    isActive: boolean;
    displaySrc: string | null;
    zoomLevel: number;
};

/**
 * Single slide component for the gallery carousel.
 * Uses React.memo to prevent unnecessary re-renders.
 * Handles video playback based on isActive state.
 */
export const CarouselSlide = React.memo(function CarouselSlide({
    item,
    isActive,
    displaySrc,
    zoomLevel,
}: CarouselSlideProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Control video playback based on isActive
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            videoRef.current.play().catch(() => {
                // Autoplay might be blocked by browser, ignore
            });
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    const imageSrc = displaySrc || item.mediumPath || item.thumbnail || item.url;

    return (
        <div className="absolute inset-0 flex shrink-0 items-center justify-center">
            <div
                className="relative transition-transform duration-300 ease-out"
                style={{ transform: isActive ? `scale(${zoomLevel})` : "scale(1)" }}
            >
                {item.type === "video" ? (
                    <video
                        ref={videoRef}
                        src={item.url}
                        controls={isActive}
                        autoPlay={isActive}
                        loop
                        muted={!isActive}
                        playsInline
                        preload="metadata"
                        className="w-[95vw] max-h-[75vh] h-auto shadow-2xl lg:w-auto lg:max-h-[70vh] lg:max-w-[55vw]"
                    />
                ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={imageSrc}
                        alt={item.title}
                        className="w-[95vw] max-h-[75vh] h-auto select-none object-contain shadow-2xl lg:w-auto lg:max-h-[70vh] lg:max-w-[55vw] pointer-events-none"
                        draggable={false}
                    />
                )}
            </div>
        </div>
    );
});
