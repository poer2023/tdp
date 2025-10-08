import prisma from "@/lib/prisma";

export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) {
    throw new Error("Rate limit exceeded");
  }
  await prisma.rateLimitHit.create({ data: { key } });
}
