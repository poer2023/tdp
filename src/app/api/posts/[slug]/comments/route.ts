import { NextRequest, NextResponse } from "next/server";
import { PostLocale, CommentStatus } from "@prisma/client";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// Rate limiter
const commentRateLimitMap = new Map<string, number[]>();
const dailyCommentMap = new Map<string, number>();

function checkCommentRateLimit(userId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Check 3 comments per 5 minutes
  const recentComments = commentRateLimitMap.get(userId) || [];
  const commentsInLast5Min = recentComments.filter((t) => t > fiveMinAgo);

  if (commentsInLast5Min.length >= 3) {
    return { allowed: false, reason: "Rate limit: max 3 comments per 5 minutes" };
  }

  // Check 20 comments per day
  const dailyCount = dailyCommentMap.get(userId) || 0;
  if (dailyCount >= 20) {
    return { allowed: false, reason: "Rate limit: max 20 comments per day" };
  }

  return { allowed: true };
}

function recordComment(userId: string) {
  const now = Date.now();

  // Update 5-min window
  const recent = commentRateLimitMap.get(userId) || [];
  recent.push(now);
  commentRateLimitMap.set(userId, recent);

  // Update daily count
  const daily = dailyCommentMap.get(userId) || 0;
  dailyCommentMap.set(userId, daily + 1);
}

// GET /api/posts/[slug]/comments - List comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale") || "EN";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  // Find post
  const post = await prisma.post.findUnique({
    where: {
      locale_slug: {
        locale: locale as PostLocale,
        slug,
      },
    },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Fetch comments
  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      status: CommentStatus.PUBLISHED,
      parentId: null, // Top-level only
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      replies: {
        where: {
          status: CommentStatus.PUBLISHED,
        },
        include: {
          author: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  return NextResponse.json({
    comments,
    hasMore: comments.length === limit,
    nextCursor: comments.length === limit ? comments[comments.length - 1].id : null,
  });
}

// POST /api/posts/[slug]/comments - Create comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { slug } = await params;
  const { content, parentId, locale = "EN" } = await request.json();

  // Validate content
  if (!content || typeof content !== "string" || content.trim().length < 1) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Content too long (max 2000 chars)" }, { status: 400 });
  }

  // Rate limiting
  const rateLimitCheck = checkCommentRateLimit(session.user.id);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json({ error: rateLimitCheck.reason }, { status: 429 });
  }

  // Find post
  const post = await prisma.post.findUnique({
    where: {
      locale_slug: {
        locale: locale as PostLocale,
        slug,
      },
    },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Validate parent comment if provided
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.postId !== post.id) {
      return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
    }

    if (parent.parentId) {
      return NextResponse.json({ error: "Cannot reply to a reply" }, { status: 400 });
    }
  }

  // Get IP hash
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const userAgent = request.headers.get("user-agent") || undefined;

  // Check if user has approved comments before
  const hasApprovedComments = await prisma.comment.findFirst({
    where: {
      authorId: session.user.id,
      status: CommentStatus.PUBLISHED,
    },
  });

  // Create comment
  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      parentId: parentId || null,
      authorId: session.user.id,
      content: content.trim(),
      status: hasApprovedComments ? CommentStatus.PUBLISHED : CommentStatus.PENDING,
      ipHash,
      userAgent,
      locale: locale as PostLocale,
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  recordComment(session.user.id);

  return NextResponse.json(
    {
      comment,
      status: comment.status,
      message: comment.status === CommentStatus.PENDING
        ? "Comment awaiting moderation"
        : "Comment published",
    },
    { status: 201 }
  );
}
