import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { generateVerificationCode, hashVerificationToken } from "@/lib/auth/email-code";
import { sendVerificationEmail } from "@/lib/email/send";

const EMAIL_LIMIT_PER_WINDOW = 5;
const IP_LIMIT_PER_WINDOW = 20;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => undefined);
    const email: unknown = body?.email;
    const locale = typeof body?.locale === "string" ? body.locale : "zh";
    const callbackUrl = typeof body?.callbackUrl === "string" ? body.callbackUrl : "/admin";

    if (typeof email !== "string") {
      return NextResponse.json({ error: "邮箱地址格式不正确" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    // Rate limit by email
    await assertRateLimit(`auth:email:${normalizedEmail}`, EMAIL_LIMIT_PER_WINDOW, WINDOW_MS);

    // Rate limit by client IP if available
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || null;
    if (clientIp) {
      await assertRateLimit(`auth:ip:${clientIp}`, IP_LIMIT_PER_WINDOW, WINDOW_MS);
    }

    const codeLength = parseInt(process.env.VERIFICATION_CODE_LENGTH || "6", 10);
    const verificationCode = generateVerificationCode(Number.isFinite(codeLength) ? codeLength : 6);

    const expiryMinutes = parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES || "10", 10);
    const expires = new Date(
      Date.now() + (Number.isFinite(expiryMinutes) ? expiryMinutes : 10) * 60 * 1000
    );

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("❌ NEXTAUTH_SECRET is not configured");
      return NextResponse.json({ error: "服务器配置错误，请联系管理员" }, { status: 500 });
    }

    const hashedToken = hashVerificationToken(verificationCode, secret);

    // Clean up previous tokens for this identifier to avoid stale entries
    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: hashedToken,
        expires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      console.error("❌ NEXTAUTH_URL (或 NEXT_PUBLIC_SITE_URL) 未配置");
      return NextResponse.json({ error: "服务器配置错误，请联系管理员" }, { status: 500 });
    }

    const loginParams = new URLSearchParams({
      callbackUrl,
      token: verificationCode,
      email: normalizedEmail,
    });
    const loginUrl = `${baseUrl.replace(/\/$/, "")}/api/auth/callback/email?${loginParams.toString()}`;

    await sendVerificationEmail({
      to: normalizedEmail,
      verificationCode,
      loginUrl,
      locale: locale === "en" ? "en" : "zh",
    });

    console.info(
      `✉️  Verification code sent to ${normalizedEmail}${clientIp ? ` (ip: ${clientIp})` : ""}`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    console.error("❌ Failed to send verification code:", error);
    return NextResponse.json({ error: "发送验证码失败，请稍后重试" }, { status: 500 });
  }
}

export const runtime = "nodejs";
