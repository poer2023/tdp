import { NextRequest, NextResponse } from "next/server";
import { PostLocale } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  return NextResponse.json({ likeCount: aggregate.likeCount });
}
