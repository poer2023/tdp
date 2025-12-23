import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prisma } from "@prisma/client";
import { PostStatus } from "@prisma/client";
import { createPost } from "../posts";

type PrismaMock = {
  post: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

vi.mock("../prisma", () => ({
  default: {
    post: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock next/cache (for unstable_cache and revalidateTag used in posts.ts)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn), // Pass-through implementation
}));

describe("createPost / slug generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const loadPrisma = async () => (await import("../prisma")).default as unknown as PrismaMock;

  it("generates pinyin-based slug for Chinese title", async () => {
    const prisma = await loadPrisma();
    // Unique slug path
    prisma.post.findFirst.mockResolvedValueOnce(null);

    const now = new Date();
    prisma.post.create.mockResolvedValueOnce({
      id: "p1",
      title: "测试 标题",
      slug: "ce-shi-biao-ti",
      excerpt: "ex",
      content: "ct",
      tags: null,
      status: "PUBLISHED",
      coverImagePath: null,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      author: null,
    });

    await createPost({
      title: "测试 标题",
      excerpt: "ex",
      content: "ct",
      status: PostStatus.PUBLISHED,
    });

    const args = prisma.post.create.mock.calls[0]?.[0] as Prisma.PostCreateArgs;
    expect(args.data?.slug).toBe("ce-shi-biao-ti");
    expect(args.data?.publishedAt).not.toBeNull();
  });

  it("appends numeric suffix when slug exists", async () => {
    const prisma = await loadPrisma();
    // First candidate exists, second is free
    prisma.post.findFirst.mockResolvedValueOnce({ id: "exists" });
    prisma.post.findFirst.mockResolvedValueOnce(null);

    const now = new Date();
    prisma.post.create.mockResolvedValueOnce({
      id: "p2",
      title: "测试 标题",
      slug: "ce-shi-biao-ti-2",
      excerpt: "ex",
      content: "ct",
      tags: null,
      status: "DRAFT",
      coverImagePath: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      author: null,
    });

    await createPost({ title: "测试 标题", excerpt: "ex", content: "ct" });

    const args = prisma.post.create.mock.calls[0]?.[0] as Prisma.PostCreateArgs;
    expect(args.data?.slug).toBe("ce-shi-biao-ti-2");
    expect(args.data?.publishedAt).toBeNull();
  });
});
