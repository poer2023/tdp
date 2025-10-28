import { describe, it, expect, beforeEach, vi } from "vitest";

const friendMock = {
  findUnique: vi.fn(),
  create: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
};

const momentMock = {
  updateMany: vi.fn(),
  findMany: vi.fn(),
};

const bcryptMock = {
  hash: vi.fn(),
  compare: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  default: {
    friend: friendMock,
    moment: momentMock,
  },
}));

vi.mock("bcrypt", () => ({
  default: bcryptMock,
}));

const loadModule = async () => {
  const mod = await import("../friends");
  return mod;
};

describe("friends library", () => {
  beforeEach(() => {
    Object.values(friendMock).forEach((fn) => fn.mockReset());
    Object.values(momentMock).forEach((fn) => fn.mockReset());
    Object.values(bcryptMock).forEach((fn) => fn.mockReset());
  });

  it("creates a friend with hashed password", async () => {
    const { createFriend } = await loadModule();
    friendMock.findUnique.mockResolvedValueOnce(null);
    bcryptMock.hash.mockResolvedValueOnce("hashed");
    const expected = {
      id: "friend",
      name: "Test",
      slug: "test",
      accessToken: "hashed",
      avatar: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    friendMock.create.mockResolvedValueOnce(expected);

    const result = await createFriend({
      name: "Test",
      slug: "test",
      password: "secret",
      avatar: null,
      description: null,
    });

    expect(friendMock.findUnique).toHaveBeenCalledWith({ where: { slug: "test" } });
    expect(bcryptMock.hash).toHaveBeenCalledWith("secret", 12);
    expect(friendMock.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("throws when slug already exists", async () => {
    const { createFriend } = await loadModule();
    friendMock.findUnique.mockResolvedValueOnce({ id: "existing" });

    await expect(
      createFriend({ name: "Test", slug: "test", password: "secret" })
    ).rejects.toThrow('Slug "test" 已被使用');
  });

  it("verifies password successfully", async () => {
    const { verifyFriendPassword } = await loadModule();
    friendMock.findUnique.mockResolvedValueOnce({
      id: "friend",
      slug: "slug",
      name: "Friend",
      accessToken: "hashed",
    });
    bcryptMock.compare.mockResolvedValueOnce(true);

    const result = await verifyFriendPassword("slug", "secret");
    expect(result.success).toBe(true);
    expect(result.friend?.id).toBe("friend");
  });

  it("rejects invalid password", async () => {
    const { verifyFriendPassword } = await loadModule();
    friendMock.findUnique.mockResolvedValueOnce({
      id: "friend",
      slug: "slug",
      name: "Friend",
      accessToken: "hashed",
    });
    bcryptMock.compare.mockResolvedValueOnce(false);

    const result = await verifyFriendPassword("slug", "secret");
    expect(result.success).toBe(false);
  });

  it("fetches friend moments with pagination", async () => {
    const { getFriendMoments } = await loadModule();
    const now = new Date();
    momentMock.findMany.mockResolvedValueOnce([
      {
        id: "1",
        content: "story1",
        images: null,
        friendVisibility: "PUBLIC",
        happenedAt: now,
        createdAt: now,
        location: null,
        tags: [],
        author: { id: "u", name: "User" },
      },
      {
        id: "2",
        content: "story2",
        images: null,
        friendVisibility: "PUBLIC",
        happenedAt: now,
        createdAt: now,
        location: null,
        tags: [],
        author: { id: "u", name: "User" },
      },
    ]);

    const result = await getFriendMoments("friend", { limit: 1 });
    expect(momentMock.findMany).toHaveBeenCalled();
    expect(result.moments).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("1");
  });

  it("generates random password of desired length", async () => {
    const { generateRandomPassword } = await loadModule();
    const password = generateRandomPassword(16);
    expect(password).toHaveLength(16);
    expect(/^[A-Za-z0-9]+$/.test(password)).toBe(true);
  });
});
