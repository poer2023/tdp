/**
 * Admin i18n Server Utilities
 * Server-side only functions for admin internationalization
 */

import { headers } from "next/headers";

export type { AdminLocale } from "./admin-translations";
export { t, adminTranslations } from "./admin-translations";

/**
 * Get admin locale from Accept-Language header (Server-side only)
 */
export async function getAdminLocale() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // Check if Chinese is preferred
  if (/\bzh\b|zh-cn|zh-hans/i.test(acceptLanguage)) {
    return "zh" as const;
  }

  return "en" as const;
}
