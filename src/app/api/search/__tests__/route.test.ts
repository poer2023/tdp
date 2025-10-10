import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import * as searchLib from "@/lib/search";

// Mock the search functions
vi.mock("@/lib/search", () => ({
  searchPosts: vi.fn(),
  searchGalleryImages: vi.fn(),
  searchMoments: vi.fn(),
}));

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("参数验证", () => {
    it("缺少查询参数应返回空结果", async () => {
      const request = new NextRequest("http://localhost:3000/api/search");

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ posts: [], images: [], moments: [] });
    });

    it("空查询参数应返回空结果", async () => {
      const request = new NextRequest("http://localhost:3000/api/search?q=");

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ posts: [], images: [], moments: [] });
    });

    it("空白查询参数应返回空结果", async () => {
      const request = new NextRequest("http://localhost:3000/api/search?q=%20%20%20");

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ posts: [], images: [], moments: [] });
    });
  });

  describe("快速模式 (quick mode)", () => {
    it("应该只返回文章结果", async () => {
      const mockPosts = [
        {
          id: "1",
          title: "Test Post",
          slug: "test-post",
          excerpt: "excerpt",
          publishedAt: new Date().toISOString(),
          locale: "EN",
          authorName: "John",
        },
      ];

      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce(mockPosts);

      const request = new NextRequest("http://localhost:3000/api/search?q=test&mode=quick");

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.posts).toEqual(mockPosts);
      expect(data.images).toEqual([]);
      expect(data.moments).toEqual([]);

      // Verify only posts search was called
      expect(searchLib.searchPosts).toHaveBeenCalledTimes(1);
      expect(searchLib.searchPosts).toHaveBeenCalledWith("test", { locale: undefined, limit: 8 });
      expect(searchLib.searchGalleryImages).not.toHaveBeenCalled();
      expect(searchLib.searchMoments).not.toHaveBeenCalled();
    });

    it("应该传递正确的 locale", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=测试&mode=quick&locale=ZH"
      );

      await GET(request);

      expect(searchLib.searchPosts).toHaveBeenCalledWith("测试", { locale: "ZH", limit: 8 });
    });
  });

  describe("完整模式 (full mode)", () => {
    it("应该返回所有类型的结果", async () => {
      const mockPosts = [
        {
          id: "1",
          title: "Post",
          slug: "post",
          excerpt: "excerpt",
          publishedAt: new Date().toISOString(),
          locale: "EN",
          authorName: "John",
        },
      ];

      const mockImages = [
        {
          id: "1",
          title: "Image",
          description: null,
          microThumbPath: "/thumb.webp",
          smallThumbPath: null,
          locationName: "Tokyo",
          city: "Tokyo",
          country: "Japan",
          category: "ORIGINAL",
          createdAt: new Date().toISOString(),
        },
      ];

      const mockMoments = [
        {
          id: "1",
          slug: "moment-1",
          content: "Test moment",
          tags: ["test"],
          createdAt: new Date().toISOString(),
          lang: "en-US",
        },
      ];

      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce(mockPosts);
      (searchLib.searchGalleryImages as vi.Mock).mockResolvedValueOnce(mockImages);
      (searchLib.searchMoments as vi.Mock).mockResolvedValueOnce(mockMoments);

      const request = new NextRequest("http://localhost:3000/api/search?q=test&mode=full");

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.posts).toEqual(mockPosts);
      expect(data.images).toEqual(mockImages);
      expect(data.moments).toEqual(mockMoments);

      // Verify all searches were called
      expect(searchLib.searchPosts).toHaveBeenCalledWith("test", { locale: undefined, limit: 5 });
      expect(searchLib.searchGalleryImages).toHaveBeenCalledWith("test", { limit: 6 });
      expect(searchLib.searchMoments).toHaveBeenCalledWith("test", {
        lang: "en-US",
        limit: 4,
      });
    });

    it("默认应该使用完整模式", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchGalleryImages as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchMoments as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=test");

      await GET(request);

      // All three search functions should be called
      expect(searchLib.searchPosts).toHaveBeenCalled();
      expect(searchLib.searchGalleryImages).toHaveBeenCalled();
      expect(searchLib.searchMoments).toHaveBeenCalled();
    });

    it("中文语言应该映射到 zh-CN", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchGalleryImages as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchMoments as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=测试&locale=ZH");

      await GET(request);

      expect(searchLib.searchPosts).toHaveBeenCalledWith("测试", { locale: "ZH", limit: 5 });
      expect(searchLib.searchMoments).toHaveBeenCalledWith("测试", { lang: "zh-CN", limit: 4 });
    });

    it("英文语言应该映射到 en-US", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchGalleryImages as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchMoments as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=test&locale=EN");

      await GET(request);

      expect(searchLib.searchMoments).toHaveBeenCalledWith("test", { lang: "en-US", limit: 4 });
    });
  });

  describe("错误处理", () => {
    it("搜索失败应返回 500", async () => {
      (searchLib.searchPosts as vi.Mock).mockRejectedValueOnce(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/search?q=test&mode=quick");

      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Search failed");
    });

    it("完整模式中的错误应该被捕获", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchGalleryImages as vi.Mock).mockRejectedValueOnce(
        new Error("Image search failed")
      );
      (searchLib.searchMoments as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=test");

      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("边界情况", () => {
    it("应该处理特殊字符查询", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=%40%23%24%25&mode=quick");

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(searchLib.searchPosts).toHaveBeenCalledWith("@#$%", expect.any(Object));
    });

    it("应该处理超长查询", async () => {
      const longQuery = "a".repeat(200);

      const request = new NextRequest(`http://localhost:3000/api/search?q=${longQuery}&mode=quick`);

      const response = await GET(request);

      // Should return 400 for queries > 64 characters
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Query too long");
    });

    it("应该处理 URL 编码的中文查询", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=%E6%97%85%E8%A1%8C&mode=quick"
      );

      await GET(request);

      expect(searchLib.searchPosts).toHaveBeenCalledWith("旅行", expect.any(Object));
    });

    it("无效的 locale 应该返回 undefined", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=test&locale=INVALID&mode=quick"
      );

      await GET(request);

      expect(searchLib.searchPosts).toHaveBeenCalledWith("test", { locale: undefined, limit: 8 });
    });
  });

  describe("结果结构", () => {
    it("应该返回正确的 JSON 结构", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchGalleryImages as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchMoments as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=test");

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("posts");
      expect(data).toHaveProperty("images");
      expect(data).toHaveProperty("moments");
      expect(Array.isArray(data.posts)).toBe(true);
      expect(Array.isArray(data.images)).toBe(true);
      expect(Array.isArray(data.moments)).toBe(true);
    });

    it("空结果应该返回空数组", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchGalleryImages as vi.Mock).mockResolvedValueOnce([]);
      (searchLib.searchMoments as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=nonexistent");

      const response = await GET(request);
      const data = await response.json();

      expect(data.posts).toEqual([]);
      expect(data.images).toEqual([]);
      expect(data.moments).toEqual([]);
    });
  });

  describe("性能测试", () => {
    it("快速模式应该快速响应", async () => {
      (searchLib.searchPosts as vi.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/search?q=test&mode=quick");

      const start = Date.now();
      await GET(request);
      const duration = Date.now() - start;

      // Mock calls should be very fast
      expect(duration).toBeLessThan(100);
    });

    it("完整模式应该并行执行搜索", async () => {
      // Simulate delays
      (searchLib.searchPosts as vi.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 10))
      );
      (searchLib.searchGalleryImages as vi.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 10))
      );
      (searchLib.searchMoments as vi.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 10))
      );

      const request = new NextRequest("http://localhost:3000/api/search?q=test");

      const start = Date.now();
      await GET(request);
      const duration = Date.now() - start;

      // Should be ~10ms (parallel) not ~30ms (sequential)
      expect(duration).toBeLessThan(25);
    });
  });
});
