import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const items = await prisma.moment.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { id: true, slug: true, updatedAt: true },
  });
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
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
