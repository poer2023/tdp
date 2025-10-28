import { describe, it, expect } from "vitest";

process.env.FRIEND_JWT_SECRET = process.env.FRIEND_JWT_SECRET ?? "test-friend-secret-key-1234567890";

const loadModule = async () => import("../friend-auth");

describe("friend-auth", () => {

  it("generates a signed JWT", async () => {
    const { generateFriendToken } = await loadModule();
    const token = generateFriendToken({
      id: "friend",
      name: "Friend",
      slug: "friend",
      accessToken: "hashed",
      avatar: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifies a valid token", async () => {
    const { generateFriendToken, verifyFriendToken } = await loadModule();
    const token = generateFriendToken({
      id: "friend",
      name: "Friend",
      slug: "friend",
      accessToken: "hashed",
      avatar: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const payload = verifyFriendToken(token);
    expect(payload?.friendId).toBe("friend");
    expect(payload?.slug).toBe("friend");
  });

  it("returns null for invalid token", async () => {
    const { verifyFriendToken } = await loadModule();
    const payload = verifyFriendToken("invalid.token.here");
    expect(payload).toBeNull();
  });
});
