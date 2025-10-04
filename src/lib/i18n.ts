/**
 * i18n Utilities
 * Helper functions for internationalization support
 */

export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: Locale[] = ["en", "zh"];

/**
 * Get HTML lang attribute value from locale
 */
export function getHtmlLang(locale?: Locale | string): string {
  if (locale === "zh") {
    return "zh-CN";
  }
  return "en";
}

/**
 * Validate if a locale is supported
 */
export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get locale from URL pathname
 * @param pathname - URL pathname (e.g., "/zh/posts/hello")
 * @returns Locale or undefined if not found
 */
export function getLocaleFromPathname(pathname: string): Locale | undefined {
  const parts = pathname.split("/").filter(Boolean);
  const firstPart = parts[0];

  if (firstPart && isValidLocale(firstPart)) {
    return firstPart as Locale;
  }

  return undefined;
}
