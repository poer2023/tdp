"use client";

/**
 * Custom image loader for Next.js Image component
 *
 * Handles images served from API routes (/api/uploads/*) by bypassing
 * Next.js built-in optimization, since these images are already optimized
 * (webp thumbnails generated on upload).
 *
 * For other image sources, delegates to Next.js default optimization.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // API-served images: return as-is (already optimized)
  if (src.startsWith("/api/uploads/")) {
    return src;
  }

  // External images (e.g., Google profile pictures): return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // Other local images: use Next.js default optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
