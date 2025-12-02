import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/moments/[id]/comments - 获取评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comments = await prisma.momentComment.findMany({
      where: { momentId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("[Comments API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/moments/[id]/comments - 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Content too long (max 1000 chars)" }, { status: 400 });
    }

    // Verify moment exists
    const moment = await prisma.moment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!moment) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 });
    }

    const comment = await prisma.momentComment.create({
      data: {
        momentId: id,
        authorId: session.user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("[Comments API] POST error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
