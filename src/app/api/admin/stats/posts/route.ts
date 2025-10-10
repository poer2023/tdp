import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { UserRole, PostStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * GET /api/admin/stats/posts
 * 获取文章统计信息（需要 ADMIN 权限）
 */
export async function GET() {
  // 验证管理员权限
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    // 获取浏览量 Top 10 文章
    const topPosts = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        publishedAt: true,
      },
      orderBy: {
        viewCount: "desc",
      },
      take: 10,
    });

    // 获取总体统计
    const totalStats = await prisma.post.aggregate({
      where: {
        status: PostStatus.PUBLISHED,
      },
      _count: {
        id: true,
      },
      _sum: {
        viewCount: true,
      },
      _avg: {
        viewCount: true,
      },
    });

    return NextResponse.json({
      topPosts: topPosts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        viewCount: post.viewCount,
        publishedAt: post.publishedAt?.toISOString() || null,
      })),
      stats: {
        totalPosts: totalStats._count.id,
        totalViews: totalStats._sum.viewCount || 0,
        averageViews: Math.round(totalStats._avg.viewCount || 0),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/stats/posts] Error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
