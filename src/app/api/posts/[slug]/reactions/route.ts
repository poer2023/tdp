import { NextRequest, NextResponse } from "next/server";
import { PostLocale } from "@prisma/client";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";

// Ensure Node.js runtime – Prisma is not supported on Edge
export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const locale = request.nextUrl.searchParams.get("locale") || "EN";

    // Find post
    const post = await prisma.post.findUnique({
      where: {
        locale_slug: {
          locale: locale as PostLocale,
          slug,
        },
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get or create reaction aggregate
    let aggregate = await prisma.reactionAggregate.findUnique({
      where: { postId: post.id },
    });

    if (!aggregate) {
      aggregate = await prisma.reactionAggregate.create({
        data: {
          postId: post.id,
          likeCount: 0,
        },
      });
    }

    // Determine if current session has already liked
    let alreadyLiked = false;
    const sessionKey = request.cookies.get("sessionKey")?.value;
    if (sessionKey) {
      const sessionKeyHash = createHash("sha256").update(sessionKey).digest("hex");
      const existing = await prisma.reaction.findUnique({
        where: {
          postId_sessionKeyHash: {
            postId: post.id,
            sessionKeyHash,
          },
        },
      });
      alreadyLiked = !!existing;
    }

    return NextResponse.json({ likeCount: aggregate.likeCount, alreadyLiked });
  } catch (error) {
    // Log detailed error information for debugging
    console.error("[Reactions API] Unexpected error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return safe error message to client
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}
