import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteFriend, getFriendById, updateFriend } from "@/lib/friends";

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friend = await getFriendById(context.params.id);
  if (!friend) {
    return NextResponse.json({ error: "朋友不存在" }, { status: 404 });
  }

  await deleteFriend(friend.id);
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friend = await getFriendById(context.params.id);
  if (!friend) {
    return NextResponse.json({ error: "朋友不存在" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  const updated = await updateFriend(friend.id, {
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    avatar: typeof body.avatar === "string" ? body.avatar.trim() : undefined,
    cover: typeof body.cover === "string" ? body.cover.trim() : undefined,
    description: typeof body.description === "string" ? body.description.trim() : undefined,
  });

  return NextResponse.json({ friend: updated });
}
