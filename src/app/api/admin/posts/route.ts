import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { listAllPosts } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await listAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("[Admin] list posts failed", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
