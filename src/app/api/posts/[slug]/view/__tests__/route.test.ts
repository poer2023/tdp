import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PostStatus } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { POST } from "../route";

const mockPrisma = vi.mocked(prisma);

describe("POST /api/posts/[slug]/view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  it("should increment viewCount for published post", async () => {
    const mockPost = {
      id: "post-id-123",
      viewCount: 10,
    };

    mockPrisma.post.findFirst.mockResolvedValueOnce(mockPost);
    mockPrisma.post.update.mockResolvedValueOnce({
      ...mockPost,
      viewCount: 11,
    });

    const request = new NextRequest("http://localhost:3000/api/posts/test-post/view", {
      method: "POST",
    });
    const context = createMockContext("test-post");

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      viewCount: 11,
    });

    expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
      where: {
        slug: "test-post",
        status: PostStatus.PUBLISHED,
      },
      select: { id: true, viewCount: true },
    });

    expect(mockPrisma.post.update).toHaveBeenCalledWith({
      where: { id: "post-id-123" },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  });

  it("should return 400 when slug is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/posts//view", {
      method: "POST",
    });
    const context = createMockContext("");

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "缺少文章 slug",
    });

    expect(mockPrisma.post.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 404 when post is not found", async () => {
    mockPrisma.post.findFirst.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/posts/non-existent/view", {
      method: "POST",
    });
    const context = createMockContext("non-existent");

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "文章不存在",
    });

    expect(mockPrisma.post.findFirst).toHaveBeenCalled();
    expect(mockPrisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 404 when post is draft (not published)", async () => {
    // Draft posts won't be found because we filter by PUBLISHED status
    mockPrisma.post.findFirst.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/posts/draft-post/view", {
      method: "POST",
    });
    const context = createMockContext("draft-post");

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "文章不存在",
    });

    expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
      where: {
        slug: "draft-post",
        status: PostStatus.PUBLISHED,
      },
      select: { id: true, viewCount: true },
    });
  });

  it("should return 500 when database error occurs during findFirst", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.post.findFirst.mockRejectedValueOnce(new Error("Database connection failed"));

    const request = new NextRequest("http://localhost:3000/api/posts/test-post/view", {
      method: "POST",
    });
    const context = createMockContext("test-post");

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "服务器错误",
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[POST /api/posts/[slug]/view] Error:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return 500 when database error occurs during update", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.post.findFirst.mockResolvedValueOnce({
      id: "post-id-123",
      viewCount: 10,
    });
    mockPrisma.post.update.mockRejectedValueOnce(new Error("Update failed"));

    const request = new NextRequest("http://localhost:3000/api/posts/test-post/view", {
      method: "POST",
    });
    const context = createMockContext("test-post");

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "服务器错误",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should use atomic increment operation", async () => {
    mockPrisma.post.findFirst.mockResolvedValueOnce({
      id: "post-id-123",
      viewCount: 100,
    });
    mockPrisma.post.update.mockResolvedValueOnce({
      id: "post-id-123",
      viewCount: 101,
    });

    const request = new NextRequest("http://localhost:3000/api/posts/test-post/view", {
      method: "POST",
    });
    const context = createMockContext("test-post");

    await POST(request, context);

    // Verify that increment is used, not a manual calculation
    expect(mockPrisma.post.update).toHaveBeenCalledWith({
      where: { id: "post-id-123" },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  });

  it("should return correct viewCount in response", async () => {
    mockPrisma.post.findFirst.mockResolvedValueOnce({
      id: "post-id-123",
      viewCount: 999,
    });
    mockPrisma.post.update.mockResolvedValueOnce({
      id: "post-id-123",
      viewCount: 1000,
    });

    const request = new NextRequest("http://localhost:3000/api/posts/popular-post/view", {
      method: "POST",
    });
    const context = createMockContext("popular-post");

    const response = await POST(request, context);
    const data = await response.json();

    expect(data.viewCount).toBe(1000);
  });

  it("should handle post with zero viewCount", async () => {
    mockPrisma.post.findFirst.mockResolvedValueOnce({
      id: "post-id-123",
      viewCount: 0,
    });
    mockPrisma.post.update.mockResolvedValueOnce({
      id: "post-id-123",
      viewCount: 1,
    });

    const request = new NextRequest("http://localhost:3000/api/posts/new-post/view", {
      method: "POST",
    });
    const context = createMockContext("new-post");

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.viewCount).toBe(1);
  });
});
