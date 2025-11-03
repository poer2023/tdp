/**
 * Prisma Retry Wrapper
 *
 * Provides automatic retry logic for transient database connection failures.
 * Uses exponential backoff strategy to handle temporary network issues gracefully.
 *
 * Features:
 * - Automatic retry for transient errors (P1001, P1017, P2024)
 * - Exponential backoff with configurable delays
 * - Preserves non-transient errors (immediate throw)
 * - Comprehensive error logging for debugging
 *
 * Usage:
 *   import { withRetry } from "@/lib/prisma-with-retry";
 *   const result = await withRetry(() => prisma.post.count());
 */

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 8000; // 8 seconds cap

/**
 * Transient Prisma error codes that should be retried:
 * - P1001: Can't reach database server
 * - P1017: Server has closed the connection
 * - P2024: Timed out fetching a new connection from the pool
 */
const TRANSIENT_ERROR_CODES = new Set(["P1001", "P1017", "P2024"]);

/**
 * Check if an error is a transient database error that should be retried
 */
function isTransientError(error: any): boolean {
  const errorCode = error?.code;
  return errorCode ? TRANSIENT_ERROR_CODES.has(errorCode) : false;
}

/**
 * Execute a Prisma operation with automatic retry on transient failures
 *
 * @param operation - Async function that returns a Prisma operation
 * @param retries - Number of retry attempts remaining (internal use)
 * @returns Promise resolving to the operation result
 * @throws Original error if non-transient or max retries exceeded
 *
 * @example
 * ```typescript
 * // Retry a count operation
 * const postCount = await withRetry(() =>
 *   prisma.post.count({ where: { status: "PUBLISHED" } })
 * );
 *
 * // Retry a complex query
 * const users = await withRetry(() =>
 *   prisma.user.findMany({ include: { posts: true } })
 * );
 * ```
 */
export async function withRetry<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // If no retries left, throw the error
    if (retries === 0) {
      console.error("[Prisma Retry] Max retries exceeded, giving up");
      throw error;
    }

    // Check if this is a transient error worth retrying
    if (!isTransientError(error)) {
      console.error(`[Prisma Retry] Non-transient error (${error?.code}), not retrying`);
      throw error;
    }

    // Calculate delay with exponential backoff
    const attempt = MAX_RETRIES - retries + 1;
    const delay = Math.min(INITIAL_DELAY * 2 ** (attempt - 1), MAX_DELAY);

    // Log retry attempt
    console.warn(
      `[Prisma Retry] Attempt ${attempt}/${MAX_RETRIES + 1} failed with ${error?.code || "unknown error"}. Retrying in ${delay}ms...`
    );

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Recursive retry with decremented counter
    return withRetry(operation, retries - 1);
  }
}

/**
 * Utility function to wrap multiple Prisma operations with retry logic
 *
 * @example
 * ```typescript
 * const [posts, photos, moments] = await withRetryAll([
 *   () => prisma.post.count(),
 *   () => prisma.photo.count(),
 *   () => prisma.moment.count(),
 * ]);
 * ```
 */
export async function withRetryAll<T extends readonly unknown[]>(operations: {
  [K in keyof T]: () => Promise<T[K]>;
}): Promise<{ [K in keyof T]: T[K] }> {
  const results = await Promise.all(operations.map((operation) => withRetry(operation)));
  return results as { [K in keyof T]: T[K] };
}
