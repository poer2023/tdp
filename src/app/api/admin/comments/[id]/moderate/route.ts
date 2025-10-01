import { NextRequest, NextResponse } from "next/server";
import { CommentStatus, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  // Check admin role
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (!["approve", "hide", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Find comment
  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Handle action
  if (action === "delete") {
    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "Comment deleted",
    });
  }

  const newStatus =
    action === "approve" ? CommentStatus.PUBLISHED : CommentStatus.HIDDEN;

  const updated = await prisma.comment.update({
    where: { id },
    data: { status: newStatus },
  });

  return NextResponse.json({
    ok: true,
    comment: updated,
    message: `Comment ${action === "approve" ? "approved" : "hidden"}`,
  });
}
