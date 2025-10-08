import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.moment.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, slug: true, content: true, createdAt: true },
  });
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Moments",
    home_page_url: `${site}/m`,
    feed_url: `${site}/m/feed.json`,
    items: items.map((i) => ({
      id: `${site}/m/${i.slug || i.id}`,
      url: `${site}/m/${i.slug || i.id}`,
      title: i.content.slice(0, 60),
      content_text: i.content,
      date_published: new Date(i.createdAt).toISOString(),
    })),
  };
  return NextResponse.json(feed, { headers: { "Cache-Control": "s-maxage=600" } });
}
