import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { HERO_IMAGES_TAG } from "@/lib/hero";

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
    const data: Record<string, unknown> = {};
    if (typeof body.url === "string") data.url = body.url.trim();
    if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
      data.sortOrder = body.sortOrder;
    }
    if (typeof body.active === "boolean") data.active = body.active;

    const updated = await prisma.heroImage.update({
      where: { id },
      data,
    });
    // Invalidate hero images cache so homepage updates immediately
    revalidateTag(HERO_IMAGES_TAG, "max");
    return NextResponse.json({ image: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] update hero image failed", error);
    return NextResponse.json({ error: "Failed to update hero image" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.heroImage.delete({ where: { id } });
    // Invalidate hero images cache so homepage updates immediately
    revalidateTag(HERO_IMAGES_TAG, "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] delete hero image failed", error);
    return NextResponse.json({ error: "Failed to delete hero image" }, { status: 500 });
  }
}
