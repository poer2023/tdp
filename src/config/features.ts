/**
 * Feature Flags Configuration
 *
 * Centralized feature toggle system for controlling feature rollout and A/B testing.
 * Features are controlled via environment variables with the prefix `FEATURE_*`.
 *
 * Usage:
 * ```ts
 * import { features } from '@/config/features';
 *
 * if (features.get('adminCredentials')) {
 *   // Feature is enabled
 * }
 * ```
 *
 * Environment Configuration:
 * - Set `FEATURE_<NAME>=on|true|1` to enable
 * - Set `FEATURE_<NAME>=off|false|0` to disable (default)
 *
 * @see docs/modular-development-playbook.md
 */

const raw = {
  /** Admin credential management system */
  adminCredentials: process.env.FEATURE_ADMIN_CREDENTIALS ?? "off",

  /** Admin dashboard statistics and metrics */
  adminDashboard: process.env.FEATURE_ADMIN_DASHBOARD ?? "off",

  /** Admin analytics dashboard and reporting */
  adminAnalytics: process.env.FEATURE_ADMIN_ANALYTICS ?? "off",

  /** Admin gallery management experience */
  adminGallery: process.env.FEATURE_ADMIN_GALLERY ?? "off",

  /** Admin posts management (list/edit/create) */
  adminPosts: process.env.FEATURE_ADMIN_POSTS ?? "off",

  /** Admin sync dashboard and job controls */
  adminSync: process.env.FEATURE_ADMIN_SYNC ?? "off",

  /** Admin content export utilities */
  adminExport: process.env.FEATURE_ADMIN_EXPORT ?? "off",

  /** Gallery insights and analytics features */
  galleryInsights: process.env.FEATURE_GALLERY_INSIGHTS ?? "off",
} as const;

export type FeatureKey = keyof typeof raw;

/**
 * Feature flag accessor with consistent boolean conversion
 */
export const features = {
  /**
   * Check if a feature is enabled
   *
   * @param key - Feature key to check
   * @returns true if feature is enabled, false otherwise
   *
   * @example
   * ```ts
   * if (features.get('adminCredentials')) {
   *   console.log('Credential management is enabled');
   * }
   * ```
   */
  get(key: FeatureKey): boolean {
    const value = raw[key];
    return value === "on" || value === "true" || value === "1";
  },

  /**
   * Get all feature states for debugging/admin UI
   *
   * @returns Object mapping feature keys to their enabled state
   */
  getAll(): Record<FeatureKey, boolean> {
    const keys = Object.keys(raw) as FeatureKey[];
    return keys.reduce(
      (acc, key) => {
        acc[key] = this.get(key);
        return acc;
      },
      {} as Record<FeatureKey, boolean>
    );
  },

  /**
   * Get raw environment variable value for a feature (for debugging)
   *
   * @param key - Feature key
   * @returns Raw string value from environment
   */
  getRaw(key: FeatureKey): string {
    return raw[key];
  },
};
