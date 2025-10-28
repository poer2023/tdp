import { NextRequest, NextResponse } from "next/server";
import { getFriendBySlug } from "@/lib/friends";

export async function GET(
  _request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    const slug = context.params.slug;
    const friend = await getFriendBySlug(slug);

    if (!friend) {
      return NextResponse.json({ error: "朋友不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: friend.id,
      name: friend.name,
      slug: friend.slug,
      avatar: friend.avatar,
      description: friend.description,
      createdAt: friend.createdAt,
    });
  } catch (error) {
    console.error("获取朋友信息失败", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
