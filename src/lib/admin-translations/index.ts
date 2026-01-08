/**
 * Admin Translations Module
 * 
 * Provides both static and dynamic access to admin translations.
 * For dynamic loading based on locale, use getTranslations(locale).
 * For static access (backwards compatible), import { adminTranslations, t } from this module.
 */

// Re-export everything from the original file for backwards compatibility
export { adminTranslations, t, type AdminLocale } from "../admin-translations";

// Re-export types
export type { AdminTranslationKey, AdminTranslations } from "./types";

/**
 * Get translations for a specific locale
 * This function can be used for future dynamic loading optimization
 */
export function getTranslations(locale: "en" | "zh") {
    // Currently returns from the static bundle
    // In the future, this could be changed to use dynamic import
    const { adminTranslations } = require("../admin-translations");
    return adminTranslations[locale];
}
