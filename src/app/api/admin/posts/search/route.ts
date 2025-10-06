import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";
  if (SKIP_DB) return NextResponse.json({ results: [] });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const posts = await prisma.post.findMany({
    where: { title: { contains: q, mode: "insensitive" } },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
  return NextResponse.json({ results: posts });
}
