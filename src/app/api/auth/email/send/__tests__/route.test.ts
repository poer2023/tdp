import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  default: {
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/auth/email-code", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/auth/email-code")>("@/lib/auth/email-code");
  return {
    ...actual,
    generateVerificationCode: vi.fn(() => "123456"),
  };
});

import prisma from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email/send";
import { hashVerificationToken } from "@/lib/auth/email-code";
import { POST } from "../route";

const mockPrisma = vi.mocked(prisma);
const mockAssertRateLimit = vi.mocked(assertRateLimit);
const mockSendVerificationEmail = vi.mocked(sendVerificationEmail);

const ORIGINAL_ENV = process.env;

describe("POST /api/auth/email/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    process.env = {
      ...ORIGINAL_ENV,
      NEXTAUTH_SECRET: "test-secret",
      NEXTAUTH_URL: "https://example.com",
      VERIFICATION_CODE_LENGTH: "6",
      VERIFICATION_CODE_EXPIRY_MINUTES: "10",
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  const createRequest = (body: unknown, headers: Record<string, string> = {}) =>
    new NextRequest("http://localhost:3000/api/auth/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

  it("should send verification email and persist hashed token", async () => {
    mockAssertRateLimit.mockResolvedValue();
    mockPrisma.verificationToken.deleteMany.mockResolvedValue(undefined);
    mockPrisma.verificationToken.create.mockResolvedValue(undefined);
    mockSendVerificationEmail.mockResolvedValue();

    const request = createRequest(
      { email: "User@Example.com", callbackUrl: "/admin/dashboard" },
      { "x-forwarded-for": "203.0.113.7" }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });

    // Email + IP rate limits
    expect(mockAssertRateLimit).toHaveBeenCalledWith(
      "auth:email:user@example.com",
      5,
      15 * 60 * 1000
    );
    expect(mockAssertRateLimit).toHaveBeenCalledWith("auth:ip:203.0.113.7", 20, 15 * 60 * 1000);

    // Old tokens should be cleared and new hashed token stored
    expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "user@example.com" },
    });

    const expectedHash = hashVerificationToken("123456", "test-secret");
    expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith({
      data: {
        identifier: "user@example.com",
        token: expectedHash,
        expires: new Date("2024-01-01T00:10:00.000Z"),
      },
    });

    // Email contents should include OTP and callback URL
    expect(mockSendVerificationEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      verificationCode: "123456",
      loginUrl:
        "https://example.com/api/auth/callback/email?callbackUrl=%2Fadmin%2Fdashboard&token=123456&email=user%40example.com",
      locale: "zh",
    });
  });

  it("should reject invalid email address", async () => {
    const request = createRequest({ email: "invalid-email" });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "请输入有效的邮箱地址" });
    expect(mockAssertRateLimit).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should return 429 when rate limit exceeded", async () => {
    mockAssertRateLimit.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    const request = createRequest({ email: "user@example.com" });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload).toEqual({ error: "请求过于频繁，请稍后再试" });
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should return 500 when NEXTAUTH_SECRET is missing", async () => {
    process.env.NEXTAUTH_SECRET = "";

    const request = createRequest({ email: "user@example.com" });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "服务器配置错误，请联系管理员" });
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });
});
