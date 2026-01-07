"use client";

import Image, { type ImageProps } from "next/image";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SmoothImageProps extends Omit<ImageProps, "onLoad" | "onLoadingComplete"> {
    /**
     * Base64 blur data URL for placeholder
     * Generate with generateBlurDataURL() from lib/image-processor
     */
    blurDataURL?: string;
    /**
     * Fade-in duration in milliseconds (default: 500)
     */
    fadeDuration?: number;
}

/**
 * Image component with smooth blur-up loading animation (2026 Best Practice)
 * 
 * Features:
 * - Shows blurred placeholder while loading (LQIP)
 * - Smooth opacity transition when loaded
 * - Prevents layout shift with proper sizing
 * 
 * Usage:
 * <SmoothImage
 *   src="/image.jpg"
 *   blurDataURL="data:image/webp;base64,..."
 *   alt="Description"
 *   fill
 * />
 */
export function SmoothImage({
    blurDataURL,
    fadeDuration = 500,
    className,
    style,
    ...props
}: SmoothImageProps) {
    const [loaded, setLoaded] = useState(false);

    const handleLoad = useCallback(() => {
        setLoaded(true);
    }, []);

    return (
        <Image
            {...props}
            placeholder={blurDataURL ? "blur" : "empty"}
            blurDataURL={blurDataURL}
            className={cn(
                "transition-opacity ease-out",
                !loaded && "opacity-0",
                loaded && "opacity-100",
                className
            )}
            style={{
                ...style,
                transitionDuration: `${fadeDuration}ms`,
            }}
            onLoad={handleLoad}
        />
    );
}

/**
 * Default blur data URL (gray placeholder)
 * Use when no specific blur data is available
 */
export const DEFAULT_BLUR_DATA_URL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

export default SmoothImage;
