import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PostStatus, PostLocale } from "@prisma/client";

/**
 * Atom 1.0 Feed Route Handler
 * Supports both English and Chinese feeds via query parameter
 * Usage: /atom.xml or /atom.xml?locale=zh
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const localeParam = searchParams.get("locale");
    const locale = localeParam === "zh" ? PostLocale.ZH : PostLocale.EN;
    const localePrefix = locale === PostLocale.ZH ? "/zh" : "";

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
            updatedAt: true,
            author: { select: { name: true } },
        },
    });

    const latestUpdate = posts.length > 0
        ? (posts[0]?.updatedAt || posts[0]?.publishedAt || new Date())
        : new Date();

    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${locale === PostLocale.ZH ? "zh-CN" : "en-US"}">
  <title>ZHI·Soft Hours</title>
  <subtitle>${locale === PostLocale.ZH ? "个人博客、生活分享与作品集" : "Personal Blog, Life Sharing & Portfolio"}</subtitle>
  <link href="${siteUrl}${localePrefix}" rel="alternate"/>
  <link href="${siteUrl}/atom.xml${localeParam ? `?locale=${localeParam}` : ""}" rel="self" type="application/atom+xml"/>
  <id>${siteUrl}/</id>
  <updated>${latestUpdate.toISOString()}</updated>
  <author>
    <name>ZHI</name>
    <uri>${siteUrl}</uri>
  </author>
  <generator uri="https://nextjs.org/">Next.js</generator>
  <rights>© ${new Date().getFullYear()} ZHI. All rights reserved.</rights>
${posts
            .map(
                (post) => `  <entry>
    <title><![CDATA[${post.title}]]></title>
    <link href="${siteUrl}${localePrefix}/posts/${post.slug}" rel="alternate"/>
    <id>${siteUrl}${localePrefix}/posts/${post.slug}</id>
    <published>${post.publishedAt?.toISOString() || new Date().toISOString()}</published>
    <updated>${(post.updatedAt || post.publishedAt || new Date()).toISOString()}</updated>
    <author>
      <name>${post.author?.name || "ZHI"}</name>
    </author>
    <summary type="html"><![CDATA[${post.excerpt || ""}]]></summary>
  </entry>`
            )
            .join("\n")}
</feed>`;

    return new NextResponse(atom, {
        headers: {
            "Content-Type": "application/atom+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
    });
}
