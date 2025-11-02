import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPosts, searchGalleryImages, searchMoments } from "../search";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findMany: vi.fn(),
    },
    galleryImage: {
      findMany: vi.fn(),
    },
    moment: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

describe("searchPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基础功能", () => {
    it("应该返回匹配的文章", async () => {
      const mockResults = [
        {
          id: "1",
          title: "Travel Guide",
          slug: "travel-guide",
          excerpt: "Best travel tips",
          publishedAt: new Date("2024-01-01"),
          locale: "EN",
          authorName: "John",
          rank: 0.9,
        },
      ];

      (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

      const results = await searchPosts("travel", { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Travel Guide");
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("空查询应该返回空数组", async () => {
      const results = await searchPosts("");
      expect(results).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("应该按语言过滤", async () => {
      const mockResults = [
        {
          id: "1",
          title: "旅行指南",
          slug: "travel-guide-zh",
          excerpt: "最佳旅行建议",
          publishedAt: new Date("2024-01-01"),
          locale: "ZH",
          authorName: "张三",
          rank: 0.9,
        },
      ];

      (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

      const results = await searchPosts("旅行", { locale: "ZH", limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].locale).toBe("ZH");
    });

    it("应该限制结果数量", async () => {
      const mockResults = Array.from({ length: 3 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Post ${i + 1}`,
        slug: `post-${i + 1}`,
        excerpt: "excerpt",
        publishedAt: new Date(),
        locale: "EN",
        authorName: "Author",
        rank: 0.9 - i * 0.1,
      }));

      (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

      const results = await searchPosts("post", { limit: 3 });

      expect(results).toHaveLength(3);
    });
  });

  describe("模糊匹配降级", () => {
    it("没有精确匹配时应该尝试模糊匹配", async () => {
      // First call returns empty (no exact match)
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      // Second call returns fuzzy match
      const fuzzyResults = [
        {
          id: "1",
          title: "Travel Tips",
          slug: "travel-tips",
          excerpt: "Tips for travelers",
          publishedAt: new Date(),
          locale: "EN",
          authorName: "John",
          similarity: 0.75,
        },
      ];
      (prisma.$queryRaw as any).mockResolvedValueOnce(fuzzyResults);

      const results = await searchPosts("travle"); // Typo

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain("Travel");
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });

  describe("错误处理", () => {
    it("数据库错误时应该降级到 LIKE 查询", async () => {
      (prisma.$queryRaw as any).mockRejectedValueOnce(new Error("DB Error"));

      const fallbackResults = [
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
      (prisma.post.findMany as any).mockResolvedValueOnce(fallbackResults);

      const results = await searchPosts("travel");

      expect(results).toHaveLength(1);
      expect(prisma.post.findMany).toHaveBeenCalled();
    });

    it("应该处理特殊字符", async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const results = await searchPosts("@#$%^&*()");

      expect(results).toEqual([]);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe("边界情况", () => {
    it("应该处理超长查询", async () => {
      const longQuery = "a".repeat(100);
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);
      (prisma.$queryRaw as any).mockResolvedValueOnce([]);

      const results = await searchPosts(longQuery);

      expect(results).toEqual([]);
    });

    it("应该处理 Unicode 字符", async () => {
      const mockResults = [
        {
          id: "1",
          title: "北京旅游",
          slug: "beijing-travel",
          excerpt: "北京景点介绍",
          publishedAt: new Date(),
          locale: "ZH",
          authorName: "李四",
          rank: 0.9,
        },
      ];

      (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

      const results = await searchPosts("北京");

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain("北京");
    });
  });
});

describe("searchGalleryImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该搜索图片标题", async () => {
    const mockResults = [
      {
        id: "1",
        title: "Beijing Tower",
        description: "Beautiful tower",
        microThumbPath: "/thumb/1.webp",
        smallThumbPath: "/small/1.webp",
        locationName: "Beijing",
        city: "Beijing",
        country: "China",
        category: "ORIGINAL",
        createdAt: new Date(),
        rank: 0.9,
      },
    ];

    (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

    const results = await searchGalleryImages("Beijing");

    expect(results).toHaveLength(1);
    expect(results[0].city).toBe("Beijing");
    expect(results[0].microThumbPath).toBe("/thumb/1.webp");
  });

  it("应该搜索地点信息", async () => {
    const mockResults = [
      {
        id: "1",
        title: "Street Photo",
        description: null,
        microThumbPath: "/thumb/1.webp",
        smallThumbPath: null,
        locationName: "Tokyo Station",
        city: "Tokyo",
        country: "Japan",
        category: "REPOST",
        createdAt: new Date(),
        rank: 0.85,
      },
    ];

    (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

    const results = await searchGalleryImages("Tokyo");

    expect(results).toHaveLength(1);
    expect(results[0].locationName).toContain("Tokyo");
  });

  it("空查询应该返回空数组", async () => {
    const results = await searchGalleryImages("");
    expect(results).toEqual([]);
  });

  it("应该限制结果数量", async () => {
    const mockResults = Array.from({ length: 6 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Image ${i + 1}`,
      description: null,
      microThumbPath: `/thumb/${i + 1}.webp`,
      smallThumbPath: null,
      locationName: null,
      city: null,
      country: null,
      category: "ORIGINAL",
      createdAt: new Date(),
      rank: 0.9 - i * 0.1,
    }));

    (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

    const results = await searchGalleryImages("image", { limit: 6 });

    expect(results).toHaveLength(6);
  });
});

describe("searchMoments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该搜索动态内容", async () => {
    const mockResults = [
      {
        id: "1",
        slug: "moment-1",
        content: "Great travel experience in Tokyo",
        tags: ["travel", "japan"],
        createdAt: new Date(),
        lang: "en-US",
        rank: 0.9,
      },
    ];

    (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

    const results = await searchMoments("travel");

    expect(results).toHaveLength(1);
    expect(results[0].content).toContain("travel");
    expect(results[0].tags).toContain("travel");
  });

  it("应该按语言过滤", async () => {
    const mockResults = [
      {
        id: "1",
        slug: null,
        content: "很棒的旅行体验",
        tags: ["旅行"],
        createdAt: new Date(),
        lang: "zh-CN",
        rank: 0.9,
      },
    ];

    (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

    const results = await searchMoments("旅行", { lang: "zh-CN" });

    expect(results).toHaveLength(1);
    expect(results[0].lang).toBe("zh-CN");
  });

  it("空查询应该返回空数组", async () => {
    const results = await searchMoments("");
    expect(results).toEqual([]);
  });

  it("应该限制结果数量", async () => {
    const mockResults = Array.from({ length: 4 }, (_, i) => ({
      id: `${i + 1}`,
      slug: `moment-${i + 1}`,
      content: `Content ${i + 1}`,
      tags: ["tag"],
      createdAt: new Date(),
      lang: "en-US",
      rank: 0.9 - i * 0.1,
    }));

    (prisma.$queryRaw as any).mockResolvedValueOnce(mockResults);

    const results = await searchMoments("content", { limit: 4 });

    expect(results).toHaveLength(4);
  });
});
