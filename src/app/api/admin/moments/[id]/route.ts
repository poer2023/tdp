import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, MomentStatus, MomentVisibility } from "@prisma/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const images = Array.isArray(body.images)
      ? body.images.map((img: any) => ({
          url: typeof img?.url === "string" ? img.url : "",
          w: typeof img?.w === "number" ? img.w : null,
          h: typeof img?.h === "number" ? img.h : null,
          alt: typeof img?.alt === "string" ? img.alt : null,
          previewUrl: typeof img?.previewUrl === "string" ? img.previewUrl : null,
        }))
      : [];

    const updated = await prisma.moment.update({
      where: { id: params.id },
      data: {
        content,
        images,
        visibility: (body.visibility as MomentVisibility) ?? "PUBLIC",
        tags: Array.isArray(body.tags)
          ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
        location: (body.location ?? null) as any,
        lang: typeof body.lang === "string" ? body.lang : "en-US",
        status:
          typeof body.status === "string" && body.status.toUpperCase() === "DRAFT"
            ? MomentStatus.DRAFT
            : MomentStatus.PUBLISHED,
        scheduledAt:
          typeof body.scheduledAt === "string" && body.scheduledAt
            ? new Date(body.scheduledAt)
            : null,
        happenedAt:
          typeof body.happenedAt === "string" && body.happenedAt
            ? new Date(body.happenedAt)
            : null,
      },
    });

    return NextResponse.json({ moment: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] update moment failed", error);
    return NextResponse.json({ error: "Failed to update moment" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.moment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] delete moment failed", error);
    return NextResponse.json({ error: "Failed to delete moment" }, { status: 500 });
  }
}
