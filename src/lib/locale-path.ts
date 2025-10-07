export type PublicLocale = "en" | "zh";

/**
 * Build a public URL path for a given locale.
 * - Chinese uses "/zh" prefix
 * - English uses no prefix (root-based)
 */
export function localePath(locale: PublicLocale, path: string): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  if (locale === "zh") {
    return safePath === "/" ? "/zh" : `/zh${safePath}`;
  }
  return safePath;
}
