const DEFAULT_ALLOWED_DOMAINS = [
  "i0.hdslb.com",
  "i1.hdslb.com",
  "i2.hdslb.com",
  "img1.doubanio.com",
  "img2.doubanio.com",
  "img3.doubanio.com",
  "img9.doubanio.com",
  "lh3.googleusercontent.com", // Google avatars
];

/**
 * Build an image URL that goes through our image-proxy when the host is allowed.
 * Falls back to the original URL if host is not whitelisted or URL is invalid.
 */
export function toOptimizedImageUrl(url?: string | null): string | undefined {
  if (!url) return url ?? undefined;
  if (url.startsWith("/")) return url; // local/static asset

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const extra = (process.env.NEXT_PUBLIC_IMAGE_PROXY_EXTRA_DOMAINS || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  const allowed = new Set([...DEFAULT_ALLOWED_DOMAINS, ...extra]);

  if (!allowed.has(parsed.hostname)) {
    return url;
  }

  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export function getAllowedImageProxyDomains(): string[] {
  const extra = (process.env.NEXT_PUBLIC_IMAGE_PROXY_EXTRA_DOMAINS || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_DOMAINS, ...extra];
}
