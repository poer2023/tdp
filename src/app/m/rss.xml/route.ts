import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.moment.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, slug: true, content: true, createdAt: true },
  });
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel>
  <title>Moments</title>
  <link>${site}/m</link>
  <description>Recent moments</description>
  ${items
    .map((i) => {
      const url = `${site}/m/${i.slug || i.id}`;
      return `<item><title>${escapeXml(i.content.slice(0, 60))}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(
        i.createdAt
      ).toUTCString()}</pubDate><description>${escapeXml(i.content)}</description></item>`;
    })
    .join("")}
  </channel></rss>`;
  return new NextResponse(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=600",
    },
  });
}

function escapeXml(s: string) {
  const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
  return s.replace(/[<>&"]/g, (c) => map[c] || c);
}
