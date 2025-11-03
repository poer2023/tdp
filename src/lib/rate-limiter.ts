import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, number>({
  max: 1000,
  ttl: 60 * 60 * 1000,
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export function checkRateLimit(key: string, maxAttempts = 10): RateLimitResult {
  const attempts = cache.get(key) ?? 0;
  if (attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }
  cache.set(key, attempts + 1);
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - attempts - 1),
    resetAt: new Date(Date.now() + 60 * 60 * 1000),
  };
}

export function resetRateLimit(key: string): void {
  cache.delete(key);
}

export function getRemainingAttempts(key: string, maxAttempts = 10): number {
  const attempts = cache.get(key) ?? 0;
  return Math.max(0, maxAttempts - attempts);
}
