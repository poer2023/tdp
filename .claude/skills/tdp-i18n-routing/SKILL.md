---
name: tdp-i18n-routing
description: Use when working with localization, multi-language routes, or locale-aware components. Triggers for [locale] params, PostLocale enum, language switcher, alternate URLs, or hreflang tags.
---

# TDP i18n Routing

## Overview

Dual-language support (EN/ZH) using Next.js App Router `[locale]` segment. English is default (no prefix), Chinese uses `/zh` prefix. This skill covers routing, content localization, and SEO patterns.

## URL Structure

```
/                    → English homepage (default)
/zh                  → Chinese homepage
/posts/my-article    → English post
/zh/posts/我的文章    → Chinese post
/gallery             → English gallery
/zh/gallery          → Chinese gallery
```

## Locale Layout Pattern

### src/app/[locale]/layout.tsx

```typescript
type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Redirect invalid locales to default English site
  if (locale !== "en" && locale !== "zh") {
    redirect("/");
  }

  return <>{children}</>;
}
```

## Page Pattern with Locale

### Accessing Locale in Pages

```typescript
type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function PostPage({ params }: PageProps) {
  const { locale, slug } = await params;

  // Convert URL locale to database enum
  const dbLocale = locale === "zh" ? PostLocale.ZH : PostLocale.EN;

  const post = await prisma.post.findFirst({
    where: {
      slug,
      locale: dbLocale,
      status: PostStatus.PUBLISHED,
    },
  });

  if (!post) notFound();

  return <Article post={post} />;
}
```

### Using Locale in Client Components

```typescript
"use client";

import { useParams } from "next/navigation";

export function LocaleAwareComponent() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div>
      {locale === "zh" ? "中文内容" : "English content"}
    </div>
  );
}
```

## Language Switcher

### Server Component Pattern (for posts)

```typescript
import { PostLocale } from "@prisma/client";
import prisma from "@/lib/prisma";

type LanguageSwitcherProps = {
  currentLocale: PostLocale;
  groupId: string | null;  // Posts linked by groupId
};

export async function LanguageSwitcher({
  currentLocale,
  groupId,
}: LanguageSwitcherProps) {
  if (!groupId) return null;

  // Find alternate language version
  const alternateLocale = currentLocale === PostLocale.EN
    ? PostLocale.ZH
    : PostLocale.EN;

  const alternatePost = await prisma.post.findFirst({
    where: { groupId, locale: alternateLocale },
    select: { slug: true },
  });

  if (!alternatePost) return null;

  // English: no prefix, Chinese: /zh prefix
  const alternateUrl = alternateLocale === PostLocale.EN
    ? `/posts/${alternatePost.slug}`
    : `/zh/posts/${alternatePost.slug}`;

  return (
    <a href={alternateUrl}>
      {alternateLocale === PostLocale.EN ? "English" : "中文"}
    </a>
  );
}
```

### Global Language Switcher

```typescript
"use client";

import { usePathname } from "next/navigation";

export function GlobalLanguageSwitcher() {
  const pathname = usePathname();
  const isZh = pathname.startsWith("/zh");

  // Toggle between locales
  const newPath = isZh
    ? pathname.replace(/^\/zh/, "") || "/"
    : `/zh${pathname}`;

  return (
    <a href={newPath}>
      {isZh ? "English" : "中文"}
    </a>
  );
}
```

## SEO: Alternate Links & hreflang

### generateMetadata Pattern

```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale);

  if (!post) return { title: "Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  // Canonical: English no prefix, Chinese with /zh
  const url = locale === "en"
    ? `${baseUrl}/posts/${slug}`
    : `${baseUrl}/zh/posts/${slug}`;

  // Find alternate version for hreflang
  const alternateLocale = post.locale === PostLocale.EN ? PostLocale.ZH : PostLocale.EN;
  let alternateSlug: string | undefined;

  if (post.groupId) {
    const alt = await prisma.post.findFirst({
      where: { groupId: post.groupId, locale: alternateLocale },
      select: { slug: true },
    });
    alternateSlug = alt?.slug;
  }

  return {
    title: post.title,
    alternates: {
      canonical: url,
      languages: alternateSlug ? {
        "en": `${baseUrl}/posts/${alternateSlug}`,
        "zh": `${baseUrl}/zh/posts/${alternateSlug}`,
      } : undefined,
    },
  };
}
```

## Database: Locale-Aware Queries

### PostLocale Enum

```prisma
enum PostLocale {
  EN
  ZH
}

model Post {
  locale PostLocale @default(EN)
  slug   String

  // Unique slug per locale
  @@unique([locale, slug])
}
```

### Query by Locale

```typescript
// Convert URL locale to enum
const dbLocale = urlLocale === "zh" ? PostLocale.ZH : PostLocale.EN;

// Filter by locale
const posts = await prisma.post.findMany({
  where: {
    locale: dbLocale,
    status: PostStatus.PUBLISHED,
  },
});
```

### Linking Translations (groupId)

```typescript
// Posts with same groupId are translations of each other
model Post {
  groupId String?  // Links EN and ZH versions

  @@unique([groupId, locale])  // One version per locale per group
}

// Find all translations
const translations = await prisma.post.findMany({
  where: { groupId: post.groupId },
});
```

## Path Revalidation

### Revalidate Both Locales

```typescript
import { revalidatePath } from "next/cache";

const revalidateGallery = () => {
  revalidatePath("/gallery");      // English
  revalidatePath("/zh/gallery");   // Chinese
  revalidatePath("/admin/gallery");
};
```

## Common Patterns

### Locale-Aware Links

```typescript
// ❌ BAD - hardcoded locale
<Link href="/posts/my-article">Read</Link>

// ✅ GOOD - respect current locale
const locale = params.locale;
const href = locale === "zh"
  ? `/zh/posts/${slug}`
  : `/posts/${slug}`;

<Link href={href}>Read</Link>
```

### Default to English

```typescript
// URL locale might be undefined for root paths
const locale = params.locale || "en";
const isZh = locale === "zh";
```

## Checklist

### Creating Locale-Aware Pages
- [ ] Use `params: Promise<{ locale: string }>` type
- [ ] Validate locale in layout (redirect invalid)
- [ ] Convert URL locale to `PostLocale` enum for DB queries
- [ ] Generate alternate links in metadata

### Language Switcher
- [ ] Use `groupId` to link translations
- [ ] Handle missing translations gracefully
- [ ] English: no prefix, Chinese: `/zh` prefix

### SEO
- [ ] Set canonical URL (locale-aware)
- [ ] Add hreflang alternate links
- [ ] Use `generateAlternateLinks` helper

### Cache Invalidation
- [ ] Revalidate both `/path` and `/zh/path`

## Quick Reference

| Task | Pattern |
|------|---------|
| Get locale | `const { locale } = await params` |
| Convert to enum | `locale === "zh" ? PostLocale.ZH : PostLocale.EN` |
| English URL | `/posts/slug` (no prefix) |
| Chinese URL | `/zh/posts/slug` |
| Link translations | Use `groupId` field |
| Validate locale | Check in layout, redirect if invalid |
| Revalidate cache | Call for both `/path` and `/zh/path` |
