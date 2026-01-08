import { NextResponse } from "next/server";
import { listPostsForSitemap } from "@/lib/posts";

// Sitemaps query the DB – ensure Node.js runtime
export const runtime = "nodejs";
// In CI, disable caching to ensure E2E tests see fresh data
// In production, cache for 1 hour
export const revalidate = process.env.CI === "true" ? 0 : 3600;
export const dynamic = process.env.CI === "true" ? "force-dynamic" : "auto";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  // Fetch all published English posts (cached)
  const posts = await listPostsForSitemap("EN");

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/posts</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${posts
      .map(
        (post) => `  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${typeof post.updatedAt === "string" ? post.updatedAt : new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate",
    },
  });
}
