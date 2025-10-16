import { describe, it, expect } from "vitest";
import { GET } from "../route";
import type { ReadingData } from "@/types/live-data";

describe("/api/about/live/reading", () => {
  it("should return reading data with correct structure", async () => {
    const response = await GET();
    const data: ReadingData = await response.json();

    // Verify stats structure
    expect(data.stats).toBeDefined();
    expect(data.stats.thisMonth).toBeDefined();
    expect(data.stats.thisMonth.books).toBeTypeOf("number");
    expect(data.stats.thisMonth.articles).toBeTypeOf("number");

    expect(data.stats.thisYear).toBeDefined();
    expect(data.stats.thisYear.books).toBeTypeOf("number");
    expect(data.stats.thisYear.articles).toBeTypeOf("number");

    expect(data.stats.allTime).toBeDefined();
    expect(data.stats.allTime.books).toBeTypeOf("number");
    expect(data.stats.allTime.articles).toBeTypeOf("number");
  });

  it("should return currently reading books", async () => {
    const response = await GET();
    const data: ReadingData = await response.json();

    expect(data.currentlyReading).toBeDefined();
    expect(Array.isArray(data.currentlyReading)).toBe(true);

    if (data.currentlyReading.length > 0) {
      const book = data.currentlyReading[0];
      expect(book.title).toBeTypeOf("string");
      expect(book.author).toBeTypeOf("string");

      if (book.progress !== undefined) {
        expect(book.progress).toBeGreaterThanOrEqual(0);
        expect(book.progress).toBeLessThanOrEqual(100);
      }

      if (book.currentPage !== undefined && book.totalPages !== undefined) {
        expect(book.currentPage).toBeLessThanOrEqual(book.totalPages);
        expect(book.currentPage).toBeGreaterThanOrEqual(0);
        expect(book.totalPages).toBeGreaterThan(0);
      }
    }
  });

  it("should return recently finished books", async () => {
    const response = await GET();
    const data: ReadingData = await response.json();

    expect(data.recentlyFinished).toBeDefined();
    expect(Array.isArray(data.recentlyFinished)).toBe(true);

    if (data.recentlyFinished.length > 0) {
      const book = data.recentlyFinished[0];
      expect(book.title).toBeTypeOf("string");
      expect(book.author).toBeTypeOf("string");

      if (book.rating !== undefined) {
        expect(book.rating).toBeGreaterThanOrEqual(1);
        expect(book.rating).toBeLessThanOrEqual(5);
      }
    }
  });

  it("should return recent articles with URLs", async () => {
    const response = await GET();
    const data: ReadingData = await response.json();

    expect(data.recentArticles).toBeDefined();
    expect(Array.isArray(data.recentArticles)).toBe(true);

    if (data.recentArticles.length > 0) {
      const article = data.recentArticles[0];
      expect(article.title).toBeTypeOf("string");
      expect(article.url).toBeTypeOf("string");
      expect(article.source).toBeTypeOf("string");
      expect(article.readAt).toBeInstanceOf(Date);

      // Validate URL format
      expect(() => new URL(article.url)).not.toThrow();
    }
  });

  it("should validate book rating values", async () => {
    const response = await GET();
    const data: ReadingData = await response.json();

    data.recentlyFinished.forEach((book) => {
      if (book.rating !== undefined) {
        expect(book.rating).toBeGreaterThanOrEqual(1);
        expect(book.rating).toBeLessThanOrEqual(5);
        expect(Number.isInteger(book.rating)).toBe(true);
      }
    });
  });

  it("should set correct cache headers", async () => {
    const response = await GET();
    const cacheControl = response.headers.get("Cache-Control");

    expect(cacheControl).toBeDefined();
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage=3600"); // 1 hour
    expect(cacheControl).toContain("stale-while-revalidate");
  });

  it("should return 200 status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
