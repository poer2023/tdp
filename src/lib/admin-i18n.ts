/**
 * Admin i18n Server Utilities
 * Server-side only functions for admin internationalization
 */

import { headers } from "next/headers";
import type { AdminLocale } from "./admin-translations";

/**
 * Get admin locale from Accept-Language header (Server-side only)
 */
export async function getAdminLocale(): Promise<AdminLocale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // Check if Chinese is preferred
  if (/\bzh\b|zh-cn|zh-hans/i.test(acceptLanguage)) {
    return "zh";
  }

  return "en";
}
