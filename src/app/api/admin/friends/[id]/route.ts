import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteFriend, getFriendById } from "@/lib/friends";

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
