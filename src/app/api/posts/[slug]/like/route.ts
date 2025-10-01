import { NextRequest, NextResponse } from "next/server";
import { PostLocale } from "@prisma/client";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";

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
  const { slug } = await params;
  const { locale = "EN" } = await request.json();

  // Rate limiting: 10 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const rateLimitKey = createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");

  if (!checkRateLimit(rateLimitKey, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

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

  // Get or create session key from cookie
  let sessionKey = request.cookies.get("session_key")?.value;
  if (!sessionKey) {
    sessionKey = createHash("sha256")
      .update(`${Date.now()}:${Math.random()}`)
      .digest("hex");
  }

  const sessionKeyHash = createHash("sha256").update(sessionKey).digest("hex");

  // Check if already liked
  const existing = await prisma.reaction.findUnique({
    where: {
      postId_sessionKeyHash: {
        postId: post.id,
        sessionKeyHash,
      },
    },
  });

  if (existing) {
    // Already liked, return current count
    const aggregate = await prisma.reactionAggregate.findUnique({
      where: { postId: post.id },
    });

    const response = NextResponse.json({
      ok: true,
      likeCount: aggregate?.likeCount || 0,
      alreadyLiked: true,
    });

    response.cookies.set("session_key", sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });

    return response;
  }

  // Create reaction and update aggregate
  await prisma.$transaction([
    prisma.reaction.create({
      data: {
        postId: post.id,
        sessionKeyHash,
      },
    }),
    prisma.reactionAggregate.upsert({
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
    }),
  ]);

  const aggregate = await prisma.reactionAggregate.findUnique({
    where: { postId: post.id },
  });

  const response = NextResponse.json({
    ok: true,
    likeCount: aggregate?.likeCount || 1,
  });

  response.cookies.set("session_key", sessionKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60, // 1 year
  });

  return response;
}
