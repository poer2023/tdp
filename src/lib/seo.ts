import { PostLocale } from "@prisma/client";

type BlogPostData = {
  title: string;
  excerpt: string;
  content: string;
  publishedAt: Date | null;
  coverImagePath: string | null;
  locale: PostLocale;
  author?: {
    name: string | null;
  } | null;
};

export function generateBlogPostingSchema(
  post: BlogPostData,
  url: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    inLanguage: post.locale === PostLocale.ZH ? "zh-CN" : "en-US",
    datePublished: post.publishedAt?.toISOString(),
    image: post.coverImagePath
      ? `${process.env.NEXT_PUBLIC_SITE_URL || ""}${post.coverImagePath}`
      : undefined,
    author: {
      "@type": "Person",
      name: post.author?.name || "Anonymous",
    },
    publisher: {
      "@type": "Organization",
      name: "Hao's Blog",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function generateAlternateLinks(
  currentLocale: PostLocale,
  currentSlug: string,
  alternateSlug?: string
): {
  en?: string;
  zh?: string;
  "x-default"?: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const links: Record<string, string> = {};

  if (currentLocale === PostLocale.EN) {
    links.en = `${baseUrl}/posts/${currentSlug}`;
    links["x-default"] = links.en;

    if (alternateSlug) {
      links.zh = `${baseUrl}/zh/posts/${alternateSlug}`;
    }
  } else {
    links.zh = `${baseUrl}/zh/posts/${currentSlug}`;

    if (alternateSlug) {
      links.en = `${baseUrl}/posts/${alternateSlug}`;
      links["x-default"] = links.en;
    }
  }

  return links;
}
