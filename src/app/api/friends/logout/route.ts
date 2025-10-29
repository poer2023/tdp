import { NextResponse } from "next/server";
import { FRIEND_COOKIE_CONFIG } from "@/lib/friend-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: FRIEND_COOKIE_CONFIG.name,
    value: "",
    maxAge: 0,
    path: FRIEND_COOKIE_CONFIG.path,
    httpOnly: FRIEND_COOKIE_CONFIG.httpOnly,
    secure: FRIEND_COOKIE_CONFIG.secure,
    sameSite: FRIEND_COOKIE_CONFIG.sameSite,
  });
  return response;
}
