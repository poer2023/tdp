// R2 images should NOT go through image-proxy - they are served directly via Cloudflare CDN
// image-proxy is only for external CDNs with anti-hotlinking (Bilibili, Douban, etc.)
export const INTERNAL_IMAGE_HOST_HINTS: string[] = [];

export function hostMatches(hostname: string, domain: string): boolean {
  if (!hostname || !domain) return false;
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function isInternalImageHost(hostname: string): boolean {
  return INTERNAL_IMAGE_HOST_HINTS.some((domain) => hostMatches(hostname, domain));
}

export function isAllowedImageHost(hostname: string, allowedDomains: string[]): boolean {
  return allowedDomains.some((domain) => hostMatches(hostname, domain));
}
