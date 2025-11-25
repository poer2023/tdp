/**
 * Module Error Fallback UI
 *
 * Reusable fallback component for disabled or failed modules.
 * Provides consistent error messaging across admin panel.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import { useMemo } from "react";
type ModuleErrorFallbackProps = {
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
};

/**
 * Display friendly error message when module fails to load
 *
 * @example
 * ```tsx
 * <AdminErrorBoundary fallback={<ModuleErrorFallback />}>
 *   <ComplexModule />
 * </AdminErrorBoundary>
 * ```
 */
export function ModuleErrorFallback({
  title = "功能暂时不可用",
  message = "此功能正在维护中,请稍后再试",
  showRetry = false,
  onRetry,
}: ModuleErrorFallbackProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-8 dark:border-stone-800 dark:bg-stone-900">
      <div className="mx-auto max-w-md text-center">
        <svg
          className="mx-auto h-12 w-12 text-stone-400 dark:text-stone-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-stone-900 dark:text-stone-100">{title}</h3>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{message}</p>

        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            重新加载
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for modules
 *
 * @example
 * ```tsx
 * <Suspense fallback={<ModuleLoadingSkeleton />}>
 *   <DynamicModule />
 * </Suspense>
 * ```
 */
export function ModuleLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  const placeholderWidths = useMemo(
    () =>
      Array.from({ length: rows }).map((_, index) => ({
        primary: 60 + ((index * 37) % 40),
        secondary: 40 + ((index * 53) % 20),
      })),
    [rows]
  );

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      {placeholderWidths.map((widths, i) => (
        <div key={i} className="animate-pulse">
          <div
            className="h-4 rounded bg-stone-200 dark:bg-stone-800"
            style={{ width: `${widths.primary}%` }}
          />
          <div
            className="mt-2 h-3 rounded bg-stone-100 dark:bg-stone-900"
            style={{ width: `${widths.secondary}%` }}
          />
        </div>
      ))}
    </div>
  );
}
