import { cookies } from "next/headers";
import type { Friend } from "@prisma/client";
import { FRIEND_COOKIE_CONFIG, verifyFriendToken } from "@/lib/friend-auth";
import { getFriendById } from "@/lib/friends";

export async function getFriendFromCookie(): Promise<Friend | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(FRIEND_COOKIE_CONFIG.name)?.value;
  if (!token) {
    return null;
  }

  const payload = verifyFriendToken(token);
  if (!payload) {
    return null;
  }

  const friend = await getFriendById(payload.friendId);
  return friend ?? null;
}
