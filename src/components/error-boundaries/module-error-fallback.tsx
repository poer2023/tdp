/**
 * Module Error Fallback UI
 *
 * Reusable fallback component for disabled or failed modules.
 * Provides consistent error messaging across admin panel.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

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
    <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-md text-center">
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
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>

        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div
            className="h-4 rounded bg-zinc-200 dark:bg-zinc-800"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
          <div
            className="mt-2 h-3 rounded bg-zinc-100 dark:bg-zinc-900"
            style={{ width: `${Math.random() * 20 + 40}%` }}
          />
        </div>
      ))}
    </div>
  );
}
