---
name: tdp-prisma-patterns
description: Use when writing Prisma queries, creating migrations, or fixing database issues. Triggers for N+1 queries, transactions, caching with unstable_cache, CI build failures, withDbFallback usage, or raw SQL queries.
---

# TDP Prisma Patterns

## Overview

40+ Prisma models, 20+ database-related fixes in commit history. This skill covers proven patterns for queries, transactions, caching, migrations, and CI compatibility.

## Prisma Client Setup

### Singleton Pattern (src/lib/prisma.ts)

```typescript
import { PrismaClient } from "@prisma/client";

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
```

### CI/Build Fallback

```typescript
// Handle missing DATABASE_URL in CI builds
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/tdp";
  process.env.E2E_SKIP_DB = "1";
}
```

## Query Patterns

### Select Optimization (Avoid N+1)

```typescript
// ❌ BAD - fetches all fields, may cause N+1
const posts = await prisma.post.findMany({
  include: { author: true },
});

// ✅ GOOD - select only needed fields
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    author: { select: { id: true, name: true, image: true } },
  },
});
```

### Pagination

```typescript
// Cursor-based pagination (efficient for large datasets)
const images = await prisma.galleryImage.findMany({
  take: 20,
  skip: 1,  // Skip cursor
  cursor: { id: lastId },
  orderBy: { createdAt: "desc" },
});

// Offset pagination (simple but slower on large tables)
const images = await prisma.galleryImage.findMany({
  take: limit,
  skip: offset,
  orderBy: { createdAt: "desc" },
});
```

## Transaction Pattern

### Atomic Operations (commit from likes/route.ts)

```typescript
// Toggle like with aggregate update - all or nothing
await prisma.$transaction(async (tx) => {
  const existing = await tx.momentLike.findUnique({
    where: { momentId_userId: { momentId: id, userId } },
  });

  if (existing) {
    await tx.momentLike.delete({
      where: { momentId_userId: { momentId: id, userId } },
    });
  } else {
    await tx.momentLike.create({
      data: { momentId: id, userId },
    });
  }

  // Update aggregate count
  const likeCount = await tx.momentLike.count({ where: { momentId: id } });
  await tx.momentLikeAggregate.upsert({
    where: { momentId: id },
    create: { momentId: id, likeCount },
    update: { likeCount },
  });
});
```

## Raw SQL for Complex Queries

### CTE Pattern (commit from gallery.ts)

```typescript
// Get adjacent images with single query using CTE
const result = await prisma.$queryRaw<Array<{
  id: string;
  position: string;
}>>`
  WITH current_img AS (
    SELECT "id", "createdAt"
    FROM "GalleryImage"
    WHERE "id" = ${id}
  )
  SELECT "id", 'prev' as position
  FROM "GalleryImage"
  WHERE "createdAt" < (SELECT "createdAt" FROM current_img)
  ORDER BY "createdAt" DESC
  LIMIT 1

  UNION ALL

  SELECT "id", 'next' as position
  FROM "GalleryImage"
  WHERE "createdAt" > (SELECT "createdAt" FROM current_img)
  ORDER BY "createdAt" ASC
  LIMIT 1
`;
```

## Database Fallback Pattern

### withDbFallback (src/lib/utils/db-fallback.ts)

```typescript
import { withDbFallback } from "@/lib/utils/db-fallback";

// Graceful degradation when DB unavailable
export async function listGalleryImages(): Promise<GalleryImage[]> {
  return withDbFallback(
    async () => {
      // Primary: fetch from database
      const images = await prisma.galleryImage.findMany({
        orderBy: { createdAt: "desc" },
      });
      return images.map(toGalleryImage);
    },
    async () => {
      // Fallback: read from filesystem
      return loadFromFilesystem();
    },
    "gallery:listGalleryImages"  // Context for logging
  );
}
```

## Caching with unstable_cache

### Pattern (commits from posts.ts, gallery.ts)

```typescript
import { unstable_cache, revalidateTag } from "next/cache";

const GALLERY_TAG = "gallery:location";

// Internal fetch function
async function _fetchGalleryImages(limit: number): Promise<GalleryImage[]> {
  const images = await prisma.galleryImage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return images.map(toGalleryImage);
}

// Cached version with TTL and tags
const getCachedGalleryImages = unstable_cache(
  _fetchGalleryImages,
  ["gallery-images-list"],  // Cache key
  { revalidate: 300, tags: [GALLERY_TAG] }  // 5 min TTL
);

// Export for use
export async function listCachedGalleryImages(limit = 100) {
  return getCachedGalleryImages(limit);
}

// Invalidate on mutation
export async function addGalleryImage(input: CreateGalleryImageInput) {
  const image = await prisma.galleryImage.create({ data: input });
  revalidateTag(GALLERY_TAG);  // Clear cache
  return image;
}
```

## CI Build Compatibility

### Database-Dependent Pages (commits e214479d, bc0adca7)

```typescript
// Pages that fetch from database need dynamic export for CI builds
// Without this, build fails when DATABASE_URL is missing

// src/app/[locale]/gallery/page.tsx
export const dynamic = "force-dynamic";

// Common pages needing this:
// - src/app/[locale]/posts/page.tsx
// - src/app/[locale]/gallery/page.tsx
// - src/app/[locale]/moments/page.tsx
// - Archive pages
// - Sitemap routes
```

### Generate Prisma Client in CI

```yaml
# .github/workflows/ci.yml
- name: Generate Prisma Client
  run: pnpm prisma generate

- name: Type check
  run: pnpm type-check
```

## Migration Patterns

### Idempotent Migrations (commit 33ddac4e)

```sql
-- Make migrations safe to re-run on fresh databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Moment' AND column_name = 'showLocation'
  ) THEN
    ALTER TABLE "Moment" ADD COLUMN "showLocation" BOOLEAN DEFAULT true;
  END IF;
END $$;
```

### Auto-Run Migrations (commit abb5b3cc)

```bash
# migrate.sh - for Coolify/Docker deployments
#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Running data migrations..."
npx prisma db seed || true  # Non-fatal
```

## Schema Best Practices

### Indexes for Common Queries

```prisma
model GalleryImage {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  category  GalleryCategory @default(REPOST)

  // Compound index for category + date filtering
  @@index([category, createdAt])
  @@index([createdAt, id])  // For cursor pagination
}
```

### Compound Unique Constraints

```prisma
model MomentLike {
  momentId String
  userId   String

  // Prevent duplicate likes
  @@unique([momentId, userId])
}

model Post {
  locale PostLocale
  slug   String

  // Unique slug per locale
  @@unique([locale, slug])
}
```

### Cascade Deletes

```prisma
model MomentLike {
  moment Moment @relation(fields: [momentId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Checklist

### Before Writing Queries
- [ ] Use `select` to fetch only needed fields
- [ ] Add indexes for filtered/sorted columns
- [ ] Consider cursor pagination for large datasets
- [ ] Wrap in `withDbFallback` for graceful degradation

### Transactions
- [ ] Use `$transaction` for multi-step operations
- [ ] Use `tx` client inside transaction, not `prisma`
- [ ] Handle errors - transaction rolls back automatically

### Caching
- [ ] Use `unstable_cache` for read-heavy queries
- [ ] Define cache tags for invalidation
- [ ] Call `revalidateTag` after mutations

### CI Compatibility
- [ ] Add `export const dynamic = "force-dynamic"` to DB-dependent pages
- [ ] Run `prisma generate` before type-check in CI
- [ ] Use `withDbFallback` for optional DB features

### Migrations
- [ ] Make migrations idempotent when possible
- [ ] Test migrations on fresh database
- [ ] Keep schema.prisma in sync with migrations

## Quick Reference

| Task | Pattern |
|------|---------|
| Avoid N+1 | Use `select` with nested fields |
| Atomic updates | `prisma.$transaction(async (tx) => ...)` |
| Complex queries | `prisma.$queryRaw` with CTEs |
| Graceful degradation | `withDbFallback(dbFn, fallbackFn)` |
| Query caching | `unstable_cache` + `revalidateTag` |
| CI build fix | `export const dynamic = "force-dynamic"` |
| Prevent duplicates | `@@unique([field1, field2])` |
| Fast filtering | `@@index([field1, field2])` |
