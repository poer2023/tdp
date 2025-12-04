import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { createFriend, listFriends } from "@/lib/friends";
import { generateRandomPassphrase } from "@/lib/friends";

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
    const friends = await listFriends();
    return NextResponse.json({ friends });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] list friends failed", error);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const passphrase =
      typeof body.passphrase === "string" && body.passphrase.trim()
        ? body.passphrase.trim()
        : generateRandomPassphrase();

    const friend = await createFriend({
      name,
      passphrase,
      avatar: typeof body.avatar === "string" ? body.avatar.trim() : null,
      cover: typeof body.cover === "string" ? body.cover.trim() : null,
      description: typeof body.description === "string" ? body.description.trim() : null,
    });

    return NextResponse.json({ friend, passphrase }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] create friend failed", error);
    return NextResponse.json({ error: "Failed to create friend" }, { status: 500 });
  }
}
