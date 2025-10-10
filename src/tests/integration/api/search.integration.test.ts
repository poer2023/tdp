import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";
import { PostStatus, PostLocale } from "@prisma/client";

describe("Search API Integration", () => {
  const db = getTestDb();

  // Test 1: 多语言搜索功能
  it("should search posts across Chinese and English content", async () => {
    // 1. 创建测试文章
    const admin = await createTestUser("ADMIN");

    // 创建中文文章
    const zhPost = await db.post.create({
      data: {
        title: "Next.js 服务端渲染指南",
        slug: `zh-post-${Date.now()}`,
        content: "这是关于Next.js SSR的详细教程，包含React Server Components的使用方法。",
        excerpt: "Next.js SSR教程",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        tags: "Next.js,React,SSR",
        publishedAt: new Date(),
      },
    });

    // 创建英文文章
    const enPost = await db.post.create({
      data: {
        title: "Getting Started with Next.js",
        slug: `en-post-${Date.now()}`,
        content:
          "A comprehensive guide to building modern web applications with Next.js and React Server Components.",
        excerpt: "Next.js tutorial",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.EN,
        tags: "Next.js,React,Tutorial",
        publishedAt: new Date(),
      },
    });

    // 2. 测试中文搜索
    const zhSearchResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          {
            OR: [
              { title: { contains: "Next.js", mode: "insensitive" } },
              { content: { contains: "Next.js", mode: "insensitive" } },
              { tags: { contains: "Next.js", mode: "insensitive" } },
            ],
          },
        ],
      },
      orderBy: { publishedAt: "desc" },
    });

    // 3. 验证搜索结果包含两篇文章
    expect(zhSearchResults.length).toBeGreaterThanOrEqual(2);
    const postIds = zhSearchResults.map((p) => p.id);
    expect(postIds).toContain(zhPost.id);
    expect(postIds).toContain(enPost.id);

    // 4. 测试标签搜索
    const tagSearchResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { tags: { contains: "React", mode: "insensitive" } },
        ],
      },
    });

    expect(tagSearchResults.length).toBeGreaterThanOrEqual(2);
    expect(tagSearchResults.map((p) => p.id)).toContain(zhPost.id);
    expect(tagSearchResults.map((p) => p.id)).toContain(enPost.id);

    // 5. 测试语言过滤
    const zhOnlyResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { locale: PostLocale.ZH },
          {
            OR: [
              { title: { contains: "Next.js", mode: "insensitive" } },
              { content: { contains: "Next.js", mode: "insensitive" } },
            ],
          },
        ],
      },
    });

    expect(zhOnlyResults).toHaveLength(1);
    expect(zhOnlyResults[0]?.id).toBe(zhPost.id);
  });

  // Test 2: 搜索结果排序和性能
  it("should return search results with proper ordering and performance", async () => {
    // 1. 创建多篇测试文章
    const admin = await createTestUser("ADMIN");
    const now = Date.now();

    const posts = await Promise.all([
      db.post.create({
        data: {
          title: "TypeScript 基础教程",
          slug: `ts-basics-${now}`,
          content: "TypeScript是JavaScript的超集，提供类型安全",
          excerpt: "TS基础",
          status: PostStatus.PUBLISHED,
          authorId: admin.id,
          locale: PostLocale.ZH,
          publishedAt: new Date(Date.now() - 3600000), // 1小时前
          viewCount: 100,
        },
      }),
      db.post.create({
        data: {
          title: "TypeScript 高级技巧",
          slug: `ts-advanced-${now}`,
          content: "深入探讨TypeScript高级类型和泛型",
          excerpt: "TS高级",
          status: PostStatus.PUBLISHED,
          authorId: admin.id,
          locale: PostLocale.ZH,
          publishedAt: new Date(), // 刚发布
          viewCount: 10,
        },
      }),
      db.post.create({
        data: {
          title: "TypeScript 实战项目",
          slug: `ts-project-${now}`,
          content: "使用TypeScript构建真实项目",
          excerpt: "TS实战",
          status: PostStatus.PUBLISHED,
          authorId: admin.id,
          locale: PostLocale.ZH,
          publishedAt: new Date(Date.now() - 7200000), // 2小时前
          viewCount: 500,
        },
      }),
    ]);

    // 2. 测试按发布时间倒序排序
    const startTime = performance.now();
    const timeOrderedResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { title: { contains: "TypeScript", mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
    });
    const timeSearchDuration = performance.now() - startTime;

    // 验证时间排序正确
    expect(timeOrderedResults).toHaveLength(3);
    expect(timeOrderedResults[0]?.id).toBe(posts[1].id); // 最新的
    expect(timeOrderedResults[1]?.id).toBe(posts[0].id); // 中间的
    expect(timeOrderedResults[2]?.id).toBe(posts[2].id); // 最早的

    // 3. 测试按热度排序
    const popularityOrderedResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { title: { contains: "TypeScript", mode: "insensitive" } },
        ],
      },
      orderBy: { viewCount: "desc" },
      take: 10,
    });

    // 验证热度排序正确
    expect(popularityOrderedResults).toHaveLength(3);
    expect(popularityOrderedResults[0]?.id).toBe(posts[2].id); // 500 views
    expect(popularityOrderedResults[1]?.id).toBe(posts[0].id); // 100 views
    expect(popularityOrderedResults[2]?.id).toBe(posts[1].id); // 10 views

    // 4. 验证搜索性能 (应该在1秒内完成，考虑远程数据库延迟)
    expect(timeSearchDuration).toBeLessThan(1000);

    // 5. 测试分页功能
    const paginatedResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { title: { contains: "TypeScript", mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 2,
      skip: 0,
    });

    expect(paginatedResults).toHaveLength(2);
    expect(paginatedResults[0]?.id).toBe(posts[1].id);
    expect(paginatedResults[1]?.id).toBe(posts[0].id);

    // 获取第二页
    const secondPageResults = await db.post.findMany({
      where: {
        AND: [
          { status: PostStatus.PUBLISHED },
          { title: { contains: "TypeScript", mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 2,
      skip: 2,
    });

    expect(secondPageResults).toHaveLength(1);
    expect(secondPageResults[0]?.id).toBe(posts[2].id);
  });
});
