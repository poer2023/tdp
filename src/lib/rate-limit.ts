import prisma from "@/lib/prisma";

/**
 * Assert rate limit for a given key within a time window
 * @param key - Unique identifier for the rate limit (e.g., "auth:email:user@example.com")
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @throws Error if rate limit is exceeded
 */
export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) {
    throw new Error("Rate limit exceeded");
  }
  await prisma.rateLimitHit.create({ data: { key } });
}

/**
 * Check if rate limit is exceeded without creating a new hit
 * @param key - Unique identifier for the rate limit
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit would be exceeded
 */
export async function isRateLimitExceeded(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  return count >= limit;
}

/**
 * Get remaining rate limit count
 * @param key - Unique identifier for the rate limit
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Number of requests remaining
 */
export async function getRateLimitRemaining(
  key: string,
  limit: number,
  windowMs: number
): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  return Math.max(0, limit - count);
}
