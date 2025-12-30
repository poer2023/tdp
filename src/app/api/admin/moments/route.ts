import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, MomentVisibility, MomentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const moments = await prisma.moment.findMany({
      orderBy: { createdAt: "desc" },
      take: Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 50,
    });
    return NextResponse.json({ moments });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] list moments failed", error);
    return NextResponse.json({ error: "Failed to fetch moments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Validate and filter images - reject blob URLs which are temporary browser-only URLs
    const images = Array.isArray(body.images)
      ? body.images
          .map((img: any) => ({
            url: typeof img?.url === "string" ? img.url : "",
            w: typeof img?.w === "number" ? img.w : null,
            h: typeof img?.h === "number" ? img.h : null,
            alt: typeof img?.alt === "string" ? img.alt : null,
            previewUrl: typeof img?.previewUrl === "string" ? img.previewUrl : null,
            microThumbUrl: typeof img?.microThumbUrl === "string" ? img.microThumbUrl : null,
            smallThumbUrl: typeof img?.smallThumbUrl === "string" ? img.smallThumbUrl : null,
            mediumUrl: typeof img?.mediumUrl === "string" ? img.mediumUrl : null,
          }))
          .filter((img: {
            url: string;
            w: number | null;
            h: number | null;
            alt: string | null;
            previewUrl: string | null;
            microThumbUrl: string | null;
            smallThumbUrl: string | null;
            mediumUrl: string | null;
          }) => {
            // Reject blob URLs - they are temporary browser URLs that won't work on server
            if (img.url.startsWith("blob:")) {
              console.warn("[Admin] Rejected blob URL in moment images:", img.url);
              return false;
            }
            // Reject empty URLs
            if (!img.url) {
              return false;
            }
            // Only allow valid URL patterns
            const isValidUrl =
              img.url.startsWith("/") || // Relative URLs (local storage)
              img.url.startsWith("http://") ||
              img.url.startsWith("https://");
            if (!isValidUrl) {
              console.warn("[Admin] Rejected invalid URL in moment images:", img.url);
              return false;
            }
            return true;
          })
      : [];

    const moment = await prisma.moment.create({
      data: {
        authorId: session.user.id,
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

    return NextResponse.json({ moment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] create moment failed", error);
    return NextResponse.json({ error: "Failed to create moment" }, { status: 500 });
  }
}
