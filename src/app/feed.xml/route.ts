import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PostStatus, PostLocale } from "@prisma/client";

/**
 * RSS 2.0 Feed Route Handler
 * Supports both English and Chinese feeds via query parameter
 * Usage: /feed.xml or /feed.xml?locale=zh
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const localeParam = searchParams.get("locale");
    const locale = localeParam === "zh" ? PostLocale.ZH : PostLocale.EN;
    const localePrefix = locale === PostLocale.ZH ? "/zh" : "";
    const langCode = locale === PostLocale.ZH ? "zh-CN" : "en-US";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

    // Fetch latest published posts
    const posts = await prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED, locale },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: {
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
            author: { select: { name: true } },
        },
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>ZHI·Soft Hours</title>
    <link>${siteUrl}${localePrefix}</link>
    <description>${locale === PostLocale.ZH ? "个人博客、生活分享与作品集" : "Personal Blog, Life Sharing & Portfolio"}</description>
    <language>${langCode}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml${localeParam ? `?locale=${localeParam}` : ""}" rel="self" type="application/rss+xml"/>
    <generator>Next.js</generator>
    <copyright>© ${new Date().getFullYear()} ZHI. All rights reserved.</copyright>
${posts
            .map(
                (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}${localePrefix}/posts/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}${localePrefix}/posts/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${post.publishedAt?.toUTCString() || new Date().toUTCString()}</pubDate>
      <author>${post.author?.name || "ZHI"}</author>
    </item>`
            )
            .join("\n")}
  </channel>
</rss>`;

    return new NextResponse(rss, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
    });
}
