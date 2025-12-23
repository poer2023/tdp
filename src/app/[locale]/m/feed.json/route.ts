import { NextResponse } from "next/server";
import { listMomentsForFeed } from "@/lib/moments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Align with Cache-Control header (600s = 10 minutes)
export const revalidate = 600;

export async function GET() {
  const items = await listMomentsForFeed(50);
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
