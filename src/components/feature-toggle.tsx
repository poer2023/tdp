/**
 * Feature Toggle Component
 *
 * Conditionally renders children based on feature flag state.
 * Provides a declarative way to wrap features that can be toggled on/off.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import { type ReactNode } from "react";
import { features, type FeatureKey } from "@/config/features";

type FeatureToggleProps = {
  /** Feature key to check */
  name: FeatureKey;
  /** Content to render when feature is disabled */
  fallback?: ReactNode;
  /** Content to render when feature is enabled */
  children: ReactNode;
};

/**
 * Conditionally render content based on feature flag
 *
 * @example
 * ```tsx
 * <FeatureToggle
 *   name="adminCredentials"
 *   fallback={<div>Feature coming soon</div>}
 * >
 *   <CredentialManagement />
 * </FeatureToggle>
 * ```
 */
export function FeatureToggle({ name, fallback = null, children }: FeatureToggleProps) {
  if (!features.get(name)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

/**
 * Fallback component for disabled features
 *
 * @example
 * ```tsx
 * <FeatureToggle name="newFeature" fallback={<ComingSoonFallback />}>
 *   <NewFeature />
 * </FeatureToggle>
 * ```
 */
export function ComingSoonFallback() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-md">
        <svg
          className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">功能即将上线</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">此功能正在开发中,敬请期待</p>
      </div>
    </div>
  );
}
