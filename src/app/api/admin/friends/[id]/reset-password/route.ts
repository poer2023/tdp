import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateRandomPassphrase, updateFriendPassphrase, getFriendById } from "@/lib/friends";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const friend = await getFriendById(id);
  if (!friend) {
    return NextResponse.json({ error: "朋友不存在" }, { status: 404 });
  }

  const newPassphrase = generateRandomPassphrase();
  await updateFriendPassphrase(friend.id, newPassphrase);

  return NextResponse.json({ success: true, newPassphrase });
}
