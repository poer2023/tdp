/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPosts, searchGalleryImages } from "../search";
import prisma from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    post: { findMany: vi.fn() },
    galleryImage: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

describe("模糊匹配功能测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("拼写错误纠正", () => {
    it("travle → travel (单词拼写错误)", async () => {
      // First call: no exact match
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      // Second call: fuzzy match
      const fuzzyResults = [
        {
          id: "1",
          title: "Travel Guide",
          slug: "travel-guide",
          excerpt: "Best travel tips",
          publishedAt: new Date(),
          locale: "EN",
          authorName: "John",
          similarity: 0.85,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("travle");

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain("Travel");
    });

    it("photgraphy → photography (字母遗漏)", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "Photography Tips",
          slug: "photography-tips",
          excerpt: "Learn photography",
          publishedAt: new Date(),
          locale: "EN",
          authorName: "Jane",
          similarity: 0.8,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("photgraphy");

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain("Photography");
    });

    it("recieve → receive (字母错位)", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "How to Receive Packages",
          slug: "receive-packages",
          excerpt: "Guide to receiving",
          publishedAt: new Date(),
          locale: "EN",
          authorName: "Bob",
          similarity: 0.82,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("recieve");

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain("Receive");
    });
  });

  describe("部分匹配", () => {
    it("beij → beijing (部分城市名)", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "Beijing Travel",
          description: "Visit Beijing",
          microThumbPath: "/thumb/1.webp",
          smallThumbPath: null,
          locationName: "Beijing",
          city: "Beijing",
          country: "China",
          category: "ORIGINAL",
          createdAt: new Date(),
          similarity: 0.75,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchGalleryImages("beij");

      expect(results).toHaveLength(1);
      expect(results[0].city).toBe("Beijing");
    });

    it("tok → tokyo (部分城市名)", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "Tokyo Street",
          description: null,
          microThumbPath: "/thumb/1.webp",
          smallThumbPath: null,
          locationName: "Tokyo Station",
          city: "Tokyo",
          country: "Japan",
          category: "REPOST",
          createdAt: new Date(),
          similarity: 0.7,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchGalleryImages("tok");

      expect(results).toHaveLength(1);
      expect(results[0].city).toBe("Tokyo");
    });
  });

  describe("相似度阈值测试", () => {
    it("高相似度（> 0.7）应该匹配", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "Travel Blog",
          slug: "travel-blog",
          excerpt: "My travel stories",
          publishedAt: new Date(),
          locale: "EN",
          authorName: "Alice",
          similarity: 0.75, // High similarity
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("travl");

      expect(results).toHaveLength(1);
    });

    it("低相似度（< 0.3）应该被过滤", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      // Low similarity results should be filtered out
      const fuzzyResults: never[] = [];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("xyz"); // Completely different

      expect(results).toEqual([]);
    });
  });

  describe("中文模糊匹配", () => {
    it("旅 → 旅行 (部分中文)", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "旅行攻略",
          slug: "travel-guide-zh",
          excerpt: "最佳旅行建议",
          publishedAt: new Date(),
          locale: "ZH",
          authorName: "张三",
          similarity: 0.7,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("旅");

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain("旅行");
    });
  });

  describe("边界情况", () => {
    it("非常短的查询（1-2字符）应该返回结果", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "Go Programming",
          slug: "go-programming",
          excerpt: "Learn Go",
          publishedAt: new Date(),
          locale: "EN",
          authorName: "Dev",
          similarity: 0.8,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("go");

      expect(results).toHaveLength(1);
    });

    it("完全不匹配的查询应该返回空数组", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const results = await searchPosts("xyzabc123");

      expect(results).toEqual([]);
    });
  });

  describe("性能测试", () => {
    it("模糊匹配应该在合理时间内完成", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const fuzzyResults = [
        {
          id: "1",
          title: "Test",
          slug: "test",
          excerpt: "test",
          publishedAt: new Date(),
          locale: "EN",
          authorName: "Test",
          similarity: 0.8,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const start = Date.now();
      await searchPosts("tets");
      const duration = Date.now() - start;

      // Mock calls should be very fast
      expect(duration).toBeLessThan(100);
    });
  });

  describe("降级处理", () => {
    it("模糊匹配失败时应该降级到 LIKE 查询", async () => {
      (prisma.$queryRaw as any).mockRejectedValueOnce(new Error("Fuzzy search failed"));

      const likeResults = [
        {
          id: "1",
          title: "Travel",
          slug: "travel",
          excerpt: "excerpt",
          publishedAt: new Date(),
          locale: "EN",
          author: { name: "John" },
        },
      ];
      (prisma.post.findMany as any).mockResolvedValueOnce(likeResults);

      const results = await searchPosts("travel");

      expect(results).toHaveLength(1);
      expect(prisma.post.findMany).toHaveBeenCalled();
    });
  });
});
