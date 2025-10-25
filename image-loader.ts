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
  const normalizedQuality = typeof quality === "number" ? quality : 75;

  // Helper to ensure width/quality params are reflected in the URL
  const withDimensions = (input: string) => {
    const [pathname, rawQuery] = input.split("?");
    const params = new URLSearchParams(rawQuery ?? "");
    params.set("w", String(width));
    params.set("q", String(normalizedQuality));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  // API-served images: return with width/quality hints
  if (src.startsWith("/api/uploads/")) {
    return withDimensions(src);
  }
  // Our image proxy route: reflect dimensions for cache key uniqueness
  if (src.startsWith("/api/image-proxy")) {
    return withDimensions(src);
  }

  // /uploads/ paths: convert to /api/uploads/ (due to rewrite rule in next.config.ts)
  if (src.startsWith("/uploads/")) {
    const apiSrc = src.replace("/uploads/", "/api/uploads/");
    return withDimensions(apiSrc);
  }

  // External images: preserve original URL but reflect width/quality
  // Note: Next.js warns in dev if a custom loader does not utilize the `width` parameter.
  // We append `w`/`q` as query params so each size maps to a unique URL while
  // still letting the origin handle delivery (no Next optimizer in this mode).
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return withDimensions(src);
  }

  // Data URLs or other local assets: return as-is
  return src;
}
