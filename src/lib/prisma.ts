import { PrismaClient } from "@prisma/client";

// CI/SSG fallback: ensure Prisma has a URL even when DATABASE_URL is absent (e.g. build pipelines without DB).
// We also enable skip-db mode to let withDbFallback return mock data instead of querying.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/tdp";
  if (!process.env.E2E_SKIP_DB) {
    process.env.E2E_SKIP_DB = "1";
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
