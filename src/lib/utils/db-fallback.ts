/**
 * Database fallback utilities
 *
 * Provides helpers to gracefully degrade when the database is unreachable
 * (e.g. when running with E2E_SKIP_DB) or when Prisma throws an error.
 *
 * @module db-fallback
 */

export function shouldSkipDb(): boolean {
  return (
    process.env.E2E_SKIP_DB === "1" ||
    process.env.E2E_SKIP_DB === "true" ||
    process.env.E2E_SKIP_DB === "yes"
  );
}

type FallbackFn<T> = () => T | Promise<T>;

/**
 * Wrap a database call with fallback handling.
 *
 * @param task - The async function that performs the DB query.
 * @param fallback - Function returning fallback value (defaults to `undefined`).
 * @param context - Optional string used for logging.
 */
export async function withDbFallback<T>(
  task: () => Promise<T>,
  fallback: FallbackFn<T> = () => undefined as unknown as T,
  context?: string
): Promise<T> {
  if (shouldSkipDb()) {
    return await fallback();
  }

  try {
    return await task();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const label = context ? `[db-fallback] ${context}` : "[db-fallback]";
      console.warn(`${label} failed, returning fallback value.`, error);
    }
    return await fallback();
  }
}
