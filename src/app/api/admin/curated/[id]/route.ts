import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!title || !url) {
      return NextResponse.json({ error: "Title and url are required" }, { status: 400 });
    }

    const updated = await prisma.shareItem.update({
      where: { id },
      data: {
        title,
        description: typeof body.description === "string" ? body.description.trim() : "",
        url,
        domain: typeof body.domain === "string" ? body.domain.trim() : "",
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : null,
        tags: Array.isArray(body.tags)
          ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
        likes: typeof body.likes === "number" ? body.likes : undefined,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] update curated failed", error);
    return NextResponse.json({ error: "Failed to update curated item" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.shareItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] delete curated failed", error);
    return NextResponse.json({ error: "Failed to delete curated item" }, { status: 500 });
  }
}
