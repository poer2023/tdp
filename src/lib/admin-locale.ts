/**
 * Admin locale utilities
 * TODO: Replace with proper locale detection if needed
 */

export type AdminLocale = "en" | "zh";

export function getAdminLocale(): AdminLocale {
  // For now, default to English
  // TODO: Implement proper admin locale detection
  return "en";
}
