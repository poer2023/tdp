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

  // API-served images: return as-is (already optimized)
  if (src.startsWith("/api/uploads/")) {
    return withDimensions(src);
  }

  // /uploads/ paths: convert to /api/uploads/ (due to rewrite rule in next.config.ts)
  if (src.startsWith("/uploads/")) {
    const apiSrc = src.replace("/uploads/", "/api/uploads/");
    return withDimensions(apiSrc);
  }

  // External images (e.g., Google profile pictures): return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    if (src.startsWith("https://lh3.googleusercontent.com/")) {
      const sizedSrc = src.replace(/=s(\d+)-c$/, `=s${width}-c`);
      if (sizedSrc !== src) {
        return sizedSrc;
      }
    }
    return withDimensions(src);
  }

  // Other local images: use Next.js default optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${normalizedQuality}`;
}
