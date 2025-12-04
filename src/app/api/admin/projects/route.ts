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
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] list projects failed", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: typeof body.description === "string" ? body.description.trim() : "",
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : null,
        technologies: Array.isArray(body.technologies)
          ? body.technologies.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
        demoUrl: typeof body.demoUrl === "string" ? body.demoUrl.trim() : null,
        repoUrl: typeof body.repoUrl === "string" ? body.repoUrl.trim() : null,
        role: typeof body.role === "string" ? body.role.trim() : null,
        year: typeof body.year === "string" ? body.year.trim() : null,
        features: Array.isArray(body.features)
          ? body.features.map((f: unknown) => String(f).trim()).filter(Boolean)
          : [],
        stats: body.stats ?? undefined,
        featured: Boolean(body.featured),
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] create project failed", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
