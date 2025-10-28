import { NextRequest, NextResponse } from "next/server";
import { verifyPassphrase } from "@/lib/friends";
import { FRIEND_COOKIE_CONFIG, generateFriendToken } from "@/lib/friend-auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";
import { generateFakeFriend } from "@/lib/fake-friend-data";

function getClientIdentifier(request: NextRequest): string {
  const header = request.headers.get("x-forwarded-for");
  if (header && header.length > 0) {
    return header.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const passphrase = typeof body.passphrase === "string" ? body.passphrase.trim() : "";

    if (!passphrase) {
      return NextResponse.json({ error: "缺少口令" }, { status: 400 });
    }

    const clientId = getClientIdentifier(request);
    const rateLimitKey = `friend-auth:${clientId}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "尝试次数过多，请稍后再试",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const result = await verifyPassphrase(passphrase);

    // 无论验证成功或失败，都返回成功响应
    // 失败时返回假数据，用户无法区分真假
    const friendData = result.success && result.friend ? result.friend : generateFakeFriend(passphrase);

    if (result.success) {
      resetRateLimit(rateLimitKey);
    }

    const token = generateFriendToken(friendData);
    const response = NextResponse.json({
      success: true,
      friend: {
        id: friendData.id,
        name: friendData.name,
        avatar: friendData.avatar,
        description: friendData.description,
      },
    });

    response.cookies.set({
      name: FRIEND_COOKIE_CONFIG.name,
      value: token,
      maxAge: FRIEND_COOKIE_CONFIG.maxAge,
      httpOnly: FRIEND_COOKIE_CONFIG.httpOnly,
      secure: FRIEND_COOKIE_CONFIG.secure,
      sameSite: FRIEND_COOKIE_CONFIG.sameSite,
      path: FRIEND_COOKIE_CONFIG.path,
    });

    return response;
  } catch (error) {
    console.error("朋友认证失败", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
