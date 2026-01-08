/**
 * Admin Translation Types
 * Shared type definitions for admin translations
 */

// All translation keys (using English as the reference)
export type AdminTranslationKey =
    | "admin"
    | "contentManagement"
    | "backToSite"
    | "content"
    | "operations"
    | "management"
    | "media"
    | "quantifiedSelf"
    | "system"
    | "overview"
    | "dashboard"
    | "trafficStats"
    | "trafficStatsDescription"
    | "posts"
    | "managePosts"
    | "moments"
    | "momentsDescription"
    | "curated"
    | "curatedDescription"
    | "projects"
    | "projectsDescription"
    | "gallery"
    | "photoManagement"
    | "heroImages"
    | "heroImagesDescription"
    | "friends"
    | "friendManagement"
    | "friendManagementDescription"
    | "profile"
    | "profileDescription"
    | "tools"
    | "toolsDescription"
    | "contentIO"
    | "importExport"
    | "subscriptions"
    | "subscriptionManagement"
    | "subscriptionDescription"
    | "lifeLogData"
    | "lifeLogDataDescription"
    | "createNewSubscription"
    | "credentials"
    | "credentialManagement"
    | "credentialDescription"
    // ... more keys defined by the actual translations
    | string; // Allow any string for flexibility

export type AdminLocale = "en" | "zh";

export type AdminTranslations = Record<AdminTranslationKey, string>;
