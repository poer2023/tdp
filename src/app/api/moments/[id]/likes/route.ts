import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

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

    // Ensure moment exists and is not deleted
    const moment = await prisma.moment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!moment) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 });
    }

    let liked = false;
    let likeCount = 0;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.momentLike.findUnique({
        where: {
          momentId_userId: { momentId: id, userId: session.user.id },
        },
      });

      if (existing) {
        await tx.momentLike.delete({
          where: { momentId_userId: { momentId: id, userId: session.user.id } },
        });
        liked = false;
      } else {
        await tx.momentLike.create({
          data: { momentId: id, userId: session.user.id },
        });
        liked = true;
      }

      likeCount = await tx.momentLike.count({ where: { momentId: id } });
      await tx.momentLikeAggregate.upsert({
        where: { momentId: id },
        create: { momentId: id, likeCount },
        update: { likeCount },
      });
    });

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error("[Moment Like] error", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
