import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole, PostStatus } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

// Mock NextAuth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { GET } from "../route";

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);

describe("GET /api/admin/stats/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTopPosts = [
    {
      id: "1",
      title: "Most Popular Post",
      slug: "most-popular",
      viewCount: 1000,
      publishedAt: new Date("2025-10-01T00:00:00.000Z"),
    },
    {
      id: "2",
      title: "Second Post",
      slug: "second-post",
      viewCount: 800,
      publishedAt: new Date("2025-10-02T00:00:00.000Z"),
    },
    {
      id: "3",
      title: "Third Post",
      slug: "third-post",
      viewCount: 600,
      publishedAt: new Date("2025-10-03T00:00:00.000Z"),
    },
  ];

  const mockAggregateStats = {
    _count: { id: 10 },
    _sum: { viewCount: 5000 },
    _avg: { viewCount: 500 },
  };

  it("should return stats for admin user", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockResolvedValueOnce(mockTopPosts);
    mockPrisma.post.aggregate.mockResolvedValueOnce(mockAggregateStats);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      topPosts: [
        {
          id: "1",
          title: "Most Popular Post",
          slug: "most-popular",
          viewCount: 1000,
          publishedAt: "2025-10-01T00:00:00.000Z",
        },
        {
          id: "2",
          title: "Second Post",
          slug: "second-post",
          viewCount: 800,
          publishedAt: "2025-10-02T00:00:00.000Z",
        },
        {
          id: "3",
          title: "Third Post",
          slug: "third-post",
          viewCount: 600,
          publishedAt: "2025-10-03T00:00:00.000Z",
        },
      ],
      stats: {
        totalPosts: 10,
        totalViews: 5000,
        averageViews: 500,
      },
    });
  });

  it("should return 401 when no session exists", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: "未授权",
    });

    expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.post.aggregate).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "user-id",
        role: UserRole.USER,
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: "未授权",
    });

    expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.post.aggregate).not.toHaveBeenCalled();
  });

  it("should only query published posts", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockResolvedValueOnce([]);
    mockPrisma.post.aggregate.mockResolvedValueOnce({
      _count: { id: 0 },
      _sum: { viewCount: 0 },
      _avg: { viewCount: 0 },
    });

    await GET();

    expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
      where: {
        status: PostStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        publishedAt: true,
      },
      orderBy: {
        viewCount: "desc",
      },
      take: 10,
    });

    expect(mockPrisma.post.aggregate).toHaveBeenCalledWith({
      where: {
        status: PostStatus.PUBLISHED,
      },
      _count: {
        id: true,
      },
      _sum: {
        viewCount: true,
      },
      _avg: {
        viewCount: true,
      },
    });
  });

  it("should return top 10 posts ordered by viewCount", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockResolvedValueOnce([]);
    mockPrisma.post.aggregate.mockResolvedValueOnce(mockAggregateStats);

    await GET();

    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          viewCount: "desc",
        },
        take: 10,
      })
    );
  });

  it("should handle posts with null publishedAt", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    const postsWithNullDate = [
      {
        id: "1",
        title: "Post without date",
        slug: "no-date",
        viewCount: 100,
        publishedAt: null,
      },
    ];

    mockPrisma.post.findMany.mockResolvedValueOnce(postsWithNullDate);
    mockPrisma.post.aggregate.mockResolvedValueOnce(mockAggregateStats);

    const response = await GET();
    const data = await response.json();

    expect(data.topPosts[0].publishedAt).toBeNull();
  });

  it("should handle zero stats gracefully", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockResolvedValueOnce([]);
    mockPrisma.post.aggregate.mockResolvedValueOnce({
      _count: { id: 0 },
      _sum: { viewCount: null }, // null when no posts
      _avg: { viewCount: null }, // null when no posts
    });

    const response = await GET();
    const data = await response.json();

    expect(data.stats).toEqual({
      totalPosts: 0,
      totalViews: 0,
      averageViews: 0,
    });
  });

  it("should round average views", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockResolvedValueOnce([]);
    mockPrisma.post.aggregate.mockResolvedValueOnce({
      _count: { id: 7 },
      _sum: { viewCount: 1000 },
      _avg: { viewCount: 142.857 },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.stats.averageViews).toBe(143); // Rounded
  });

  it("should return 500 when database error occurs", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockRejectedValueOnce(new Error("Database connection failed"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "服务器错误",
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[GET /api/admin/stats/posts] Error:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return 500 when aggregate fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockResolvedValueOnce([]);
    mockPrisma.post.aggregate.mockRejectedValueOnce(new Error("Aggregate failed"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "服务器错误",
    });

    consoleErrorSpy.mockRestore();
  });

  it("should correctly serialize dates to ISO format", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    const testDate = new Date("2025-10-15T14:30:00.000Z");
    mockPrisma.post.findMany.mockResolvedValueOnce([
      {
        id: "1",
        title: "Test Post",
        slug: "test",
        viewCount: 100,
        publishedAt: testDate,
      },
    ]);
    mockPrisma.post.aggregate.mockResolvedValueOnce(mockAggregateStats);

    const response = await GET();
    const data = await response.json();

    expect(data.topPosts[0].publishedAt).toBe("2025-10-15T14:30:00.000Z");
  });

  it("should return empty array when no posts exist", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "admin-id",
        role: UserRole.ADMIN,
      },
    });

    mockPrisma.post.findMany.mockResolvedValueOnce([]);
    mockPrisma.post.aggregate.mockResolvedValueOnce({
      _count: { id: 0 },
      _sum: { viewCount: 0 },
      _avg: { viewCount: 0 },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.topPosts).toEqual([]);
    expect(data.stats.totalPosts).toBe(0);
  });
});
