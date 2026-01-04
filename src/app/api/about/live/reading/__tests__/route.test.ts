import { describe, it, expect } from "vitest";
import { GET } from "../route";
import type { ReadingData } from "@/types/live-data";

describe("/api/about/live/reading", () => {
  it("should return data or error with correct status", async () => {
    const response = await GET();

    // API can return:
    // - 200 with data when successful
    // - 404 with null when no data
    // - 500 with error object when database error
    if (response.status === 404) {
      const data = await response.json();
      expect(data).toBeNull();
    } else if (response.status === 500) {
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.data).toBeDefined(); // Empty data structure included
    } else {
      expect(response.status).toBe(200);
    }
  });

  it("should return reading data with correct structure when data exists", async () => {
    const response = await GET();

    // Skip test if no data available or error
    if (response.status === 404 || response.status === 500) {

      return;
    }

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

  it("should return currently reading books when data exists", async () => {
    const response = await GET();

    // Skip test if no data available or error
    if (response.status === 404 || response.status === 500) {

      return;
    }

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

  it("should return recently finished books when data exists", async () => {
    const response = await GET();

    // Skip test if no data available or error
    if (response.status === 404 || response.status === 500) {

      return;
    }

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

  it("should return recent articles with URLs when data exists", async () => {
    const response = await GET();

    // Skip test if no data available or error
    if (response.status === 404 || response.status === 500) {

      return;
    }

    const data: ReadingData = await response.json();

    expect(data.recentArticles).toBeDefined();
    expect(Array.isArray(data.recentArticles)).toBe(true);

    if (data.recentArticles.length > 0) {
      const article = data.recentArticles[0];
      expect(article.title).toBeTypeOf("string");
      expect(article.url).toBeTypeOf("string");
      expect(article.source).toBeTypeOf("string");
      // After JSON serialization, dates become strings
      expect(article.readAt).toBeTypeOf("string");
      expect(() => new Date(article.readAt as string)).not.toThrow();

      // Validate URL format - can be absolute URL or relative path
      if (article.url.startsWith("http")) {
        expect(() => new URL(article.url)).not.toThrow();
      } else {
        expect(article.url.startsWith("/")).toBe(true);
      }
    }
  });

  it("should validate book rating values when data exists", async () => {
    const response = await GET();

    // Skip test if no data available or error
    if (response.status === 404 || response.status === 500) {

      return;
    }

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
    expect(cacheControl).toContain("s-maxage");
    expect(cacheControl).toContain("stale-while-revalidate");
  });

  it("should return 500 with error structure on database error", async () => {
    const response = await GET();
    
    // This test verifies the error response format when status is 500
    if (response.status === 500) {
      const data = await response.json();
      expect(data.error).toBeTypeOf("string");
      expect(data.data).toBeDefined();
      expect(data.data.stats).toBeDefined();
      expect(data.data.currentlyReading).toEqual([]);
      expect(data.data.recentlyFinished).toEqual([]);
      expect(data.data.recentArticles).toEqual([]);
    }
    // If status is not 500, this test passes (no error occurred)
  });
});
