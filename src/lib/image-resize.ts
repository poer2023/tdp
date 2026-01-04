import { isAllowedImageHost } from "@/lib/image-hosts";
import { getAllowedImageProxyDomains } from "@/lib/image-proxy";

const DEFAULT_QUALITY = 75;
const ALLOWED_PROXY_DOMAINS = getAllowedImageProxyDomains();

function stripResizeParams(input: string): string {
  const [base, rawQuery] = input.split("?");
  if (!rawQuery) return input;
  const params = new URLSearchParams(rawQuery);
  params.delete("w");
  params.delete("q");
  params.delete("fm");
  params.delete("format");
  const query = params.toString();
  return query ? `${base}?${query}` : base ?? input;
}

function withDimensions(input: string, width: number, quality: number): string {
  const [base, rawQuery] = input.split("?");
  const params = new URLSearchParams(rawQuery ?? "");
  params.set("w", String(width));
  params.set("q", String(quality));
  const query = params.toString();
  return query ? `${base}?${query}` : base ?? input;
}

export function buildImageUrl(src: string, width: number, quality?: number): string {
  if (!src) return src;
  const normalizedQuality = typeof quality === "number" ? quality : DEFAULT_QUALITY;

  if (src.startsWith("data:")) return src;

  if (src.startsWith("/api/image-proxy")) {
    return withDimensions(src, width, normalizedQuality);
  }

  if (src.startsWith("/api/uploads/")) {
    return withDimensions(src, width, normalizedQuality);
  }

  if (src.startsWith("/uploads/")) {
    const apiSrc = src.replace("/uploads/", "/api/uploads/");
    return withDimensions(apiSrc, width, normalizedQuality);
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    const cleaned = stripResizeParams(src);
    try {
      const host = new URL(cleaned).hostname;
      if (isAllowedImageHost(host, ALLOWED_PROXY_DOMAINS)) {
        const proxied = `/api/image-proxy?url=${encodeURIComponent(cleaned)}`;
        return withDimensions(proxied, width, normalizedQuality);
      }
    } catch {
      return withDimensions(cleaned, width, normalizedQuality);
    }
    return withDimensions(cleaned, width, normalizedQuality);
  }

  return src;
}

export function buildImageSrcSet(
  src: string,
  widths: number[],
  quality?: number
): string {
  return widths.map((w) => `${buildImageUrl(src, w, quality)} ${w}w`).join(", ");
}
