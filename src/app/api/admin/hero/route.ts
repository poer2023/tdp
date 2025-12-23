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

export async function GET() {
  try {
    await requireAdmin();
    const images = await prisma.heroImage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ images });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] list hero images failed", error);
    return NextResponse.json({ error: "Failed to fetch hero images" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    const sortOrder =
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : 0;

    const image = await prisma.heroImage.create({
      data: {
        url,
        sortOrder,
        active: body.active === false ? false : true,
      },
    });
    // Invalidate hero images cache so homepage updates immediately
    revalidateTag(HERO_IMAGES_TAG, "max");
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] create hero image failed", error);
    return NextResponse.json({ error: "Failed to create hero image" }, { status: 500 });
  }
}
