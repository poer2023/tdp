import { NextRequest, NextResponse } from "next/server";
import { getFriendMoments } from "@/lib/friends";
import { getFriendFromCookie } from "@/lib/server/get-friend-from-cookie";
import { isFakeFriendId, generateFakeMoments } from "@/lib/fake-friend-data";

export async function GET(request: NextRequest) {
  try {
    const sessionFriend = await getFriendFromCookie();
    if (!sessionFriend) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 如果是假 Friend ID，返回假数据
    if (isFakeFriendId(sessionFriend.id)) {
      const fakeMoments = generateFakeMoments();
      return NextResponse.json({
        moments: fakeMoments,
        nextCursor: null,
        hasMore: false,
      });
    }

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const locale = searchParams.get("locale");
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "10", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 10;

    const { moments, nextCursor, hasMore } = await getFriendMoments(sessionFriend.id, {
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
