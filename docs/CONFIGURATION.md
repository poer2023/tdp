# Configuration Guide

Configuration options and resolution of open questions from ROADMAP.

## Table of Contents

- [Open Questions Resolution](#open-questions-resolution)
- [Environment Variables](#environment-variables)
- [Feature Flags](#feature-flags)
- [Rate Limiting Configuration](#rate-limiting-configuration)

---

## Open Questions Resolution

### Q1: Default Author for Imported Posts Without authorId

**Question**: Who is the default author for imported Markdown files that don't specify an authorId?

**Recommendation**: **Assign to the admin who performed the import**

**Rationale**:

- Maintains accountability (admin is responsible for content they import)
- Simpler implementation (no need for system user)
- Allows flexibility (admin can manually reassign authorship later)

**Implementation**:

```typescript
// src/lib/content-import.ts

export async function importContent(
  zipBuffer: Buffer,
  options: { dryRun: boolean; adminId: string } // adminId from session
): Promise<ImportResult> {
  // ...

  const authorId = frontmatter.author || options.adminId; // Fallback to admin

  await prisma.post.create({
    data: {
      title,
      content,
      authorId, // Admin's ID
      // ...
    },
  });
}
```

**Alternative Options** (not recommended):

1. **System User**:
   - Create a special "System" user with ID `system-import`
   - Cons: Less accountability, orphaned content if system user deleted

2. **Require authorId**:
   - Reject import if authorId missing
   - Cons: More friction, requires mapping external authors

3. **Author mapping file**:
   - Provide `authors.json` in import ZIP
   - Maps external author IDs to internal user IDs
   - Cons: Complex, manual mapping required

**Configuration**:

```typescript
// config/import.ts
export const importConfig = {
  defaultAuthorStrategy: "admin", // 'admin' | 'system' | 'require'
  systemAuthorId: "system-import", // Used if strategy is 'system'
};
```

---

<!-- Comments feature removed: this section intentionally deleted. -->

### Q2: Per-Locale Tag Display Names

**Question**: Should we implement localized tag names (Tag and TagTranslation models) now or defer?

**Recommendation**: **Defer to Phase 2** (post-launch enhancement)

**Rationale**:

- Not critical for MVP launch
- Current system (tags as simple strings) works for 80% of use cases
- Adds significant complexity (translation management, UI updates)
- Better to validate tag usage patterns first

**Current System** (simple strings):

```typescript
// prisma/schema.prisma
model Post {
  // ...
  tags String @default("") // Comma-separated: "technology,tutorial"
}

// Usage
const post = await prisma.post.findUnique({ where: { id } });
const tags = post.tags.split(',').filter(Boolean);
```

**Future Enhancement** (Phase 2):

```typescript
// prisma/schema.prisma
model Tag {
  id          String   @id @default(cuid())
  slug        String   @unique // "technology"
  createdAt   DateTime @default(now())

  translations TagTranslation[]
  posts        PostTag[]
}

model TagTranslation {
  id     String     @id @default(cuid())
  tagId  String
  locale PostLocale
  name   String     // "Technology" (EN) or "技术" (ZH)

  tag Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([tagId, locale])
}

model PostTag {
  postId String
  tagId  String

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}
```

**Migration Path**:

1. **Phase 1** (current): Simple string tags
2. **Phase 2** (post-launch):
   - Implement Tag/TagTranslation models
   - Create migration script to backfill from existing tags
   - Update UI to use localized tag names
   - Maintain backward compatibility

**When to revisit**:

- When you have 20+ distinct tags
- When user feedback requests localized tags
- When you want tag-based filtering/navigation

---

## Environment Variables

### Required

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

### Optional

```bash
# Security: Enable IP and User Agent hashing for spam prevention
ENABLE_IP_HASHING="true"

# Analytics
NEXT_PUBLIC_ANALYTICS_ID="UA-XXXXX-X"

# Error Tracking (Sentry)
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
SENTRY_AUTH_TOKEN="<your-auth-token>"

# Rate Limiting (Redis)
REDIS_URL="redis://localhost:6379"



# Content Operations
IMPORT_MAX_FILE_SIZE="50" # MB
EXPORT_RATE_LIMIT="10" # Per hour
```

---

## Feature Flags

### Enabling/Disabling Features

```typescript
// config/features.ts

export const featureFlags = {
  // Core Features
  i18n: {
    enabled: true,
    supportedLocales: ["EN", "ZH"],
    defaultLocale: "EN",
  },

  // Engagement
  likes: {
    enabled: true,
    requireLogin: false,
    idempotencyWindow: 24, // hours
  },

  // Content Operations
  import: {
    enabled: true,
    allowedRoles: ["ADMIN"],
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },

  export: {
    enabled: true,
    allowedRoles: ["ADMIN"],
    rateLimit: 10, // Per hour
  },

  // SEO
  seo: {
    hreflang: true,
    jsonLd: true,
    sitemap: true,
  },
};
```

### Usage

```typescript
// In components or API routes
import { featureFlags } from '@/config/features';

export default function LikeButton() {
  if (!featureFlags.likes.enabled) {
    return null; // Feature disabled
  }

  // Feature enabled, render button
  return <button>Like</button>;
}
```

---

## Rate Limiting Configuration

### Likes

```typescript
// config/rate-limits.ts

export const rateLimits = {
  likes: {
    window: 60 * 1000, // 1 minute in milliseconds
    maxRequests: 10, // 10 likes per minute
    storage: "memory", // 'memory' | 'redis'
    keyBy: "ip", // 'ip' | 'session' | 'user'
  },
};
```

**Recommended Settings**:

- **Small blog** (<1000 daily visitors): Memory storage, IP-based
- **Medium blog** (1000-10000 daily visitors): Redis, IP + session
- **Large blog** (>10000 daily visitors): Redis with advanced config

### Admin Operations

```typescript
export const rateLimits = {
  export: {
    window: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 exports per hour
    keyBy: "user",
  },

  import: {
    window: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 imports per hour
    keyBy: "user",
  },
};
```

---

## Security Configuration

### IP Hashing (Optional)

```typescript
// config/security.ts

export const securityConfig = {
  ipHashing: {
    enabled: process.env.ENABLE_IP_HASHING === "true",
    algorithm: "sha256",
    salt: process.env.IP_HASH_SALT || "default-salt", // Change in production
  },
};
```

**When to enable**:

- If you need to detect spam patterns
- If you need to enforce per-IP rate limits
- For forensic analysis of abuse

**When to disable**:

- If you want maximum privacy
- If all rate limiting is session/user-based
- If GDPR compliance is strict

### Session Security

```typescript
export const securityConfig = {
  session: {
    cookieName: "session-key",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax", // CSRF protection
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

---

## Summary

### Recommended Configuration for Production

```typescript
// config/index.ts

export const config = {
  // Q1: Default author for imports
  import: {
    defaultAuthorStrategy: "admin", // Assign to importing admin
  },
  // Q2: Localized tags
  tags: {
    localized: false, // Defer to Phase 2
  },

  // Rate limiting
  rateLimits: {
    likes: { maxRequests: 10, window: 60000 },
  },

  // Security
  security: {
    ipHashing: true, // Enable for spam detection
  },
};
```

This configuration balances **user experience**, **security**, and **maintainability** for a production blog.
