import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { listGalleryImages, deleteGalleryImage } from "@/lib/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit"); // Legacy support
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const category = searchParams.get("category") as "REPOST" | "ORIGINAL" | "AI" | null;

    let limit: number | { take: number; skip: number } | undefined;

    if (pageParam && pageSizeParam) {
      const page = parseInt(pageParam, 10);
      const pageSize = parseInt(pageSizeParam, 10);
      if (!isNaN(page) && !isNaN(pageSize) && page > 0 && pageSize > 0) {
        limit = {
          take: pageSize,
          skip: (page - 1) * pageSize,
        };
      }
    } else if (limitParam) {
      limit = Number.parseInt(limitParam, 10);
    }

    const [images, total] = await Promise.all([
      listGalleryImages(limit, category ?? undefined),
      prisma.galleryImage.count({ where: category ? { category } : undefined })
    ]);

    return NextResponse.json({ images, total });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] list gallery failed", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await deleteGalleryImage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] delete gallery failed", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
