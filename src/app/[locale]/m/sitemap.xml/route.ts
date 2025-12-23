import { NextResponse } from "next/server";
import { listMomentsForSitemap } from "@/lib/moments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Align with Cache-Control header (600s = 10 minutes)
export const revalidate = 600;

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const items = await listMomentsForSitemap(500);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${items
      .map(
        (i) => `
      <url>
        <loc>${site}/m/${i.slug || i.id}</loc>
        <lastmod>${new Date(i.updatedAt).toISOString()}</lastmod>
      </url>`
      )
      .join("")}
  </urlset>`;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=600",
    },
  });
}
