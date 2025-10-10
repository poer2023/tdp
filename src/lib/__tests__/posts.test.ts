import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseTags, serializeTags, getPostById, getPostBySlug } from "../posts";
import { PostStatus } from "@prisma/client";

// Mock Prisma client
vi.mock("../prisma", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import prisma from "../prisma";
const mockPrisma = vi.mocked(prisma);

describe("Posts Utility Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseTags", () => {
    it("should return empty array for null input", () => {
      expect(parseTags(null)).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      expect(parseTags(undefined)).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      expect(parseTags("")).toEqual([]);
    });

    it("should parse comma-separated tags", () => {
      expect(parseTags("react,next.js,typescript")).toEqual(["react", "next.js", "typescript"]);
    });

    it("should trim whitespace from tags", () => {
      expect(parseTags(" react , next.js , typescript ")).toEqual([
        "react",
        "next.js",
        "typescript",
      ]);
    });

    it("should filter out empty tags", () => {
      expect(parseTags("react,,next.js, ,typescript")).toEqual(["react", "next.js", "typescript"]);
    });
  });

  describe("serializeTags", () => {
    it("should return null for empty array", () => {
      expect(serializeTags([])).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(serializeTags(undefined)).toBeNull();
    });

    it("should serialize tags to comma-separated string", () => {
      expect(serializeTags(["react", "next.js", "typescript"])).toBe("react,next.js,typescript");
    });

    it("should trim and filter empty tags", () => {
      expect(serializeTags([" react ", "", "next.js", " ", "typescript "])).toBe(
        "react,next.js,typescript"
      );
    });
  });

  describe("viewCount support", () => {
    const mockPostData = {
      id: "post-123",
      title: "Test Post",
      slug: "test-post",
      excerpt: "Test excerpt",
      content: "Test content",
      coverImagePath: null,
      tags: "react,typescript",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2025-10-01T00:00:00.000Z"),
      createdAt: new Date("2025-10-01T00:00:00.000Z"),
      updatedAt: new Date("2025-10-01T00:00:00.000Z"),
      locale: "EN" as const,
      authorId: "author-123",
      relatedPostIds: null,
      author: {
        id: "author-123",
        name: "Test Author",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        role: "USER" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it("should include viewCount when post has views", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...mockPostData,
        viewCount: 100,
      });

      const result = await getPostById("post-123");

      expect(result).toBeDefined();
      expect(result?.viewCount).toBe(100);
    });

    it("should return 0 when viewCount is null", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...mockPostData,
        viewCount: null,
      });

      const result = await getPostById("post-123");

      expect(result).toBeDefined();
      expect(result?.viewCount).toBe(0);
    });

    it("should return 0 when viewCount is undefined", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...mockPostData,
        viewCount: undefined,
      });

      const result = await getPostById("post-123");

      expect(result).toBeDefined();
      expect(result?.viewCount).toBe(0);
    });

    it("should return 0 when viewCount is 0", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...mockPostData,
        viewCount: 0,
      });

      const result = await getPostById("post-123");

      expect(result).toBeDefined();
      expect(result?.viewCount).toBe(0);
    });

    it("should handle large viewCount values", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...mockPostData,
        viewCount: 999999,
      });

      const result = await getPostById("post-123");

      expect(result).toBeDefined();
      expect(result?.viewCount).toBe(999999);
    });

    it("should include viewCount in getPostBySlug", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...mockPostData,
        viewCount: 250,
      });

      const result = await getPostBySlug("test-post", "EN");

      expect(result).toBeDefined();
      expect(result?.viewCount).toBe(250);
    });

    it("should preserve other post fields when including viewCount", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...mockPostData,
        viewCount: 42,
      });

      const result = await getPostById("post-123");

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        id: "post-123",
        title: "Test Post",
        slug: "test-post",
        viewCount: 42,
        status: PostStatus.PUBLISHED,
      });
    });
  });
});
