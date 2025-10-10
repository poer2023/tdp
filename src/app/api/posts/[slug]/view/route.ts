import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * POST /api/posts/[slug]/view
 * 记录文章浏览量
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ error: "缺少文章 slug" }, { status: 400 });
  }

  try {
    // 查找文章并增加浏览量
    const post = await prisma.post.findFirst({
      where: {
        slug,
        status: PostStatus.PUBLISHED,
      },
      select: { id: true, viewCount: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 原子性增加浏览量
    await prisma.post.update({
      where: { id: post.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      viewCount: post.viewCount + 1,
    });
  } catch (error) {
    console.error("[POST /api/posts/[slug]/view] Error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
