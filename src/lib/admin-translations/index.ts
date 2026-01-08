/**
 * Admin Translations Module
 *
 * Split by locale for better tree-shaking and lazy loading.
 * Replaces: src/lib/admin-translations.ts (deleted)
 */

import { en } from "./en";
import { zh } from "./zh";

export type AdminLocale = "en" | "zh";

// Combined translations object (for backwards compatibility)
export const adminTranslations = { en, zh } as const;

// Type for translation keys (inferred from en)
export type AdminTranslationKey = keyof typeof en;

/**
 * Get translated text
 * @param locale - The locale to use
 * @param key - The translation key
 * @returns The translated string
 */
export function t(locale: AdminLocale, key: AdminTranslationKey): string {
    return adminTranslations[locale][key];
}

/**
 * Get translations for a specific locale
 * Can be used for dynamic imports in the future
 */
export function getTranslations(locale: AdminLocale) {
    return adminTranslations[locale];
}

// Re-export individual locale modules for direct imports
export { en } from "./en";
export { zh } from "./zh";
