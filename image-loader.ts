/**
 * Custom image loader for Next.js Image component
 *
 * Handles images served from API routes (/api/uploads/*) by bypassing
 * Next.js built-in optimization, since these images are already optimized
 * (webp thumbnails generated on upload).
 *
 * For other image sources, delegates to Next.js default optimization.
 */
import { buildImageUrl } from "./src/lib/image-resize";

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return buildImageUrl(src, width, quality);
}
