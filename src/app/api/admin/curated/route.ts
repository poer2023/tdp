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

export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.shareItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] list curated failed", error);
    return NextResponse.json({ error: "Failed to fetch curated items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!title || !url) {
      return NextResponse.json({ error: "Title and url are required" }, { status: 400 });
    }

    const item = await prisma.shareItem.create({
      data: {
        title,
        description: typeof body.description === "string" ? body.description.trim() : "",
        url,
        domain: typeof body.domain === "string" ? body.domain.trim() : "",
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : null,
        tags: Array.isArray(body.tags)
          ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
        likes: typeof body.likes === "number" ? body.likes : 0,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] create curated failed", error);
    return NextResponse.json({ error: "Failed to create curated item" }, { status: 500 });
  }
}
