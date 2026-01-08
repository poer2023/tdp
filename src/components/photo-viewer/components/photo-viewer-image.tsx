"use client";

import Image from "next/image";
import type { PhotoViewerImageProps } from "../types";

export function PhotoViewerImage({
    locale,
    displaySrc,
    title,
    scale,
    offset,
    isDragging,
    showZoomIndicator,
    showHint,
    slideContext,
    imgWrapRef,
    onNaturalSizeChange,
}: PhotoViewerImageProps) {
    const altText = title || (locale === "zh" ? "未命名照片" : "Untitled Photo");

    return (
        <div
            ref={imgWrapRef}
            className={`relative h-full w-full ${scale > 1 ? "cursor-grab" : ""}`}
        >
            <div className="absolute inset-0 overflow-hidden">
                {/* Slide animation layer (previous image) */}
                {slideContext && (
                    <div
                        className={`pointer-events-none absolute inset-0 transition-transform duration-300 ease-out ${slideContext.direction === "left"
                            ? slideContext.phase === "pre"
                                ? "translate-x-0"
                                : "-translate-x-full"
                            : slideContext.phase === "pre"
                                ? "translate-x-0"
                                : "translate-x-full"
                            }`}
                        style={{ willChange: "transform" }}
                    >
                        <Image
                            src={slideContext.fromSrc}
                            alt={slideContext.fromAlt}
                            fill
                            className="object-contain"
                            sizes="(max-width: 1024px) 100vw, 65vw"
                            // unoptimized: Required for Blob URLs and dynamically loaded original images
                            unoptimized
                        />
                    </div>
                )}
                {/* Current image layer */}
                <div
                    className={`absolute inset-0 transition-transform duration-300 ease-out ${slideContext
                        ? slideContext.direction === "left"
                            ? slideContext.phase === "pre"
                                ? "translate-x-full"
                                : "translate-x-0"
                            : slideContext.phase === "pre"
                                ? "-translate-x-full"
                                : "translate-x-0"
                        : "translate-x-0"
                        }`}
                    style={{ willChange: "transform" }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                            transformOrigin: "50% 50%",
                            transition: isDragging ? "none" : "transform 200ms ease-out",
                            willChange: "transform",
                            cursor: isDragging ? "grabbing" : "grab",
                        }}
                    >
                        <Image
                            src={displaySrc}
                            alt={altText}
                            fill
                            className="object-contain"
                            sizes="(max-width: 1024px) 100vw, 65vw"
                            // unoptimized: Required for Blob URLs created from XHR original image loading
                            unoptimized
                            onLoad={(e) => {
                                const img = e.currentTarget;
                                onNaturalSizeChange({ w: img.naturalWidth, h: img.naturalHeight });
                            }}
                        />
                    </div>
                </div>
            </div>
            {/* Zoom indicator */}
            {showZoomIndicator && (
                <div className="pointer-events-none absolute top-4 right-4 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium text-stone-700 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300">
                    {(scale * 100).toFixed(0)}%
                </div>
            )}
            {/* Hint */}
            {showHint && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs text-stone-600 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-400">
                    {locale === "zh" ? "滚轮缩放 · 双击重置" : "Wheel to zoom · Double click to reset"}
                </div>
            )}
        </div>
    );
}
