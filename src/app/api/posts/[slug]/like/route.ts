import { NextRequest, NextResponse } from "next/server";
import { PostLocale } from "@prisma/client";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";

// Ensure Node.js runtime – Prisma is not supported on Edge
export const runtime = "nodejs";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];

  // Filter out old timestamps
  const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(key, recentTimestamps);
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Parse and validate request body
    let locale: PostLocale;
    try {
      const body = await request.json();
      locale = (body.locale || "EN") as PostLocale;
    } catch (error) {
      console.error("[Like API] Invalid request body:", error);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Rate limiting: 10 requests per minute per IP
    const ip =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const rateLimitKey = createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");

    if (!checkRateLimit(rateLimitKey, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Get or create session key from cookie
    let sessionKey = request.cookies.get("sessionKey")?.value;
    if (!sessionKey) {
      sessionKey = createHash("sha256").update(`${Date.now()}:${Math.random()}`).digest("hex");
    }

    const sessionKeyHash = createHash("sha256").update(sessionKey).digest("hex");

    // OPTIMIZATION: Single query to find post and check existing reaction
    // Using a transaction to fetch post with aggregate in one go
    const result = await prisma.$transaction(async (tx) => {
      // Find post with aggregate (1 query instead of 2)
      // FIXED: Use correct field name "reactions" not "reactionAggregate"
      const post = await tx.post.findUnique({
        where: {
          locale_slug: {
            locale: locale as PostLocale,
            slug,
          },
        },
        select: {
          id: true,
          reactions: {
            select: {
              likeCount: true,
            },
          },
        },
      });

      if (!post) {
        return { error: "Post not found", status: 404 };
      }

      // Check if already liked
      const existing = await tx.reaction.findUnique({
        where: {
          postId_sessionKeyHash: {
            postId: post.id,
            sessionKeyHash,
          },
        },
      });

      if (existing) {
        // Already liked, return current count
        return {
          ok: true,
          likeCount: post.reactions?.likeCount || 0,
          alreadyLiked: true,
        };
      }

      // Create reaction and update aggregate in one transaction
      // OPTIMIZATION: Use upsert result directly instead of additional query
      const [, updatedAggregate] = await Promise.all([
        tx.reaction.create({
          data: {
            postId: post.id,
            sessionKeyHash,
          },
        }),
        tx.reactionAggregate.upsert({
          where: { postId: post.id },
          create: {
            postId: post.id,
            likeCount: 1,
          },
          update: {
            likeCount: {
              increment: 1,
            },
          },
          select: {
            likeCount: true,
          },
        }),
      ]);

      return {
        ok: true,
        likeCount: updatedAggregate.likeCount,
        alreadyLiked: false,
      };
    });

    // Handle error cases
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Success response
    const response = NextResponse.json({
      ok: true,
      likeCount: result.likeCount,
      alreadyLiked: result.alreadyLiked,
    });

    // Set session cookie
    response.cookies.set("sessionKey", sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });

    return response;
  } catch (error) {
    // Log detailed error information for debugging
    console.error("[Like API] Unexpected error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return safe error message to client
    return NextResponse.json({ error: "Failed to process like request" }, { status: 500 });
  }
}
