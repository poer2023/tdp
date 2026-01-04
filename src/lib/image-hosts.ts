export const INTERNAL_IMAGE_HOST_HINTS = ["r2.dev", "r2.cloudflarestorage.com", "dybzy.com"];

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
