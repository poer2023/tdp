import { NextRequest, NextResponse } from "next/server";
import { getFriendBySlug, getFriendMoments } from "@/lib/friends";
import { getFriendFromCookie } from "@/lib/server/get-friend-from-cookie";

export async function GET(request: NextRequest, context: { params: { slug: string } }) {
  try {
    const { slug } = context.params;
    const friend = await getFriendBySlug(slug);

    if (!friend) {
      return NextResponse.json({ error: "朋友不存在" }, { status: 404 });
    }

    const sessionFriend = await getFriendFromCookie();
    if (!sessionFriend || sessionFriend.id !== friend.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const locale = searchParams.get("locale");
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "10", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 10;

    const { moments, nextCursor, hasMore } = await getFriendMoments(friend.id, {
      cursor: cursor ?? undefined,
      limit,
      lang: locale ?? undefined,
    });

    return NextResponse.json({
      moments: moments.map((moment) => ({
        ...moment,
        createdAt: moment.createdAt.toISOString(),
        happenedAt: moment.happenedAt ? moment.happenedAt.toISOString() : null,
      })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("获取朋友故事列表失败", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
