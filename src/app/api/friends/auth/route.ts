import { NextRequest, NextResponse } from "next/server";
import { verifyFriendPassword } from "@/lib/friends";
import { FRIEND_COOKIE_CONFIG, generateFriendToken } from "@/lib/friend-auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";

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
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!slug || !password) {
      return NextResponse.json({ error: "缺少必需参数" }, { status: 400 });
    }

    const clientId = getClientIdentifier(request);
    const rateLimitKey = `friend-auth:${clientId}:${slug}`;
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

    const result = await verifyFriendPassword(slug, password);

    if (!result.success || !result.friend) {
      return NextResponse.json(
        {
          success: false,
          error: "密码错误",
          attemptsRemaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    resetRateLimit(rateLimitKey);

    const token = generateFriendToken(result.friend);
    const response = NextResponse.json({
      success: true,
      friend: {
        id: result.friend.id,
        name: result.friend.name,
        slug: result.friend.slug,
        avatar: result.friend.avatar,
        description: result.friend.description,
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
