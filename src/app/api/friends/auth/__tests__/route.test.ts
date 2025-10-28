import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/friends", () => ({
  verifyFriendPassword: vi.fn(),
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

  it("returns token when password is valid", async () => {
    const { verifyFriendPassword } = await import("@/lib/friends");
    const { POST } = await import("../route");
    vi.mocked(verifyFriendPassword).mockResolvedValueOnce({
      success: true,
      friend: {
        id: "friend-id",
        name: "Alice",
        slug: "alice",
        avatar: "https://example.com/avatar.jpg",
        description: "Test friend",
      },
    });

    const response = (await POST(
      createRequest({ slug: "alice", password: "secret" }) as unknown as Request
    )) as NextResponse;
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.friend.slug).toBe("alice");
    expect(response.cookies.get("friendAuth")?.value).toBe("mock-token");
  });

  it("returns 401 when password invalid", async () => {
    const { verifyFriendPassword } = await import("@/lib/friends");
    const { POST } = await import("../route");
    vi.mocked(verifyFriendPassword).mockResolvedValueOnce({
      success: false,
    });

    const response = (await POST(
      createRequest({ slug: "alice", password: "wrong" }) as unknown as Request
    )) as NextResponse;
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.success).toBe(false);
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
      createRequest({ slug: "alice", password: "secret" }) as unknown as Request
    )) as NextResponse;
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.success).toBe(false);
  });
});
