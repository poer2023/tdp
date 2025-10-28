import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/friends", () => ({
  verifyPassphrase: vi.fn(),
}));

vi.mock("@/lib/fake-friend-data", () => ({
  generateFakeFriend: vi.fn(() => ({
    id: "fake_123",
    name: "神秘访客",
    accessToken: "",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mystery",
    description: "这是一个神秘的朋友空间",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}));

vi.mock("@/lib/friend-auth", () => ({
  FRIEND_COOKIE_CONFIG: {
    name: "friendAuth",
    maxAge: 3600,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  },
  generateFriendToken: vi.fn(() => "mock-token"),
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 9,
    resetAt: new Date(Date.now() + 3600000),
  })),
  resetRateLimit: vi.fn(),
}));

describe("POST /api/friends/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown) => ({
    json: async () => body,
    headers: new Headers(),
  });

  it("returns token with real friend when passphrase is valid", async () => {
    const { verifyPassphrase } = await import("@/lib/friends");
    const { POST } = await import("../route");
    vi.mocked(verifyPassphrase).mockResolvedValueOnce({
      success: true,
      friend: {
        id: "friend-id",
        name: "Alice",
        accessToken: "hashed",
        avatar: "https://example.com/avatar.jpg",
        description: "Test friend",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const response = (await POST(
      createRequest({ passphrase: "secret" }) as unknown as Request
    )) as NextResponse;
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.friend.name).toBe("Alice");
    expect(response.cookies.get("friendAuth")?.value).toBe("mock-token");
  });

  it("returns token with fake friend when passphrase is invalid", async () => {
    const { verifyPassphrase } = await import("@/lib/friends");
    const { POST } = await import("../route");
    vi.mocked(verifyPassphrase).mockResolvedValueOnce({
      success: false,
    });

    const response = (await POST(
      createRequest({ passphrase: "wrong" }) as unknown as Request
    )) as NextResponse;
    const payload = await response.json();

    // Always returns 200 with fake data
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.friend.name).toBe("神秘访客");
    expect(response.cookies.get("friendAuth")?.value).toBe("mock-token");
  });

  it("returns 429 when rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limiter");
    vi.mocked(checkRateLimit).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 3600000),
    });

    const { POST } = await import("../route");
    const response = (await POST(
      createRequest({ passphrase: "secret" }) as unknown as Request
    )) as NextResponse;
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.success).toBe(false);
  });

  it("returns 400 when passphrase is missing", async () => {
    const { POST } = await import("../route");
    const response = (await POST(createRequest({}) as unknown as Request)) as NextResponse;

    expect(response.status).toBe(400);
  });
});
