import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";
import { PostStatus, PostLocale } from "@prisma/client";

describe("Posts API Integration", () => {
  const db = getTestDb();

  // Test 1: 创建文章完整流程
  it("should create post with all fields and relations", async () => {
    // 1. 创建admin用户
    const admin = await createTestUser("ADMIN");

    // 2. 创建文章
    const post = await db.post.create({
      data: {
        title: "测试文章",
        slug: `test-post-${Date.now()}`,
        content: "这是测试内容",
        excerpt: "摘要",
        status: PostStatus.DRAFT,
        authorId: admin.id,
        locale: PostLocale.ZH,
        tags: "测试,Next.js,集成测试", // 字符串格式的标签
      },
      include: {
        author: true,
      },
    });

    // 3. 验证Post记录创建
    expect(post.id).toBeDefined();
    expect(post.title).toBe("测试文章");
    expect(post.status).toBe(PostStatus.DRAFT);

    // 4. 验证标签字段
    expect(post.tags).toBe("测试,Next.js,集成测试");

    // 5. 验证作者关联
    expect(post.author?.id).toBe(admin.id);

    // 6. 验证默认值
    expect(post.viewCount).toBe(0);
    expect(post.publishedAt).toBeNull();
  });

  // Test 2: 发布文章触发副作用
  it("should update publishedAt and status on publish", async () => {
    // 1. 创建草稿文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "待发布文章",
        slug: `publish-test-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.DRAFT,
        authorId: admin.id,
        locale: PostLocale.ZH,
      },
    });

    expect(post.publishedAt).toBeNull();

    // 2. 更新为已发布
    const publishedPost = await db.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // 3. 验证publishedAt字段更新
    expect(publishedPost.publishedAt).not.toBeNull();
    expect(publishedPost.status).toBe(PostStatus.PUBLISHED);

    // 4. 验证发布时间合理
    const timeDiff = Date.now() - (publishedPost.publishedAt?.getTime() || 0);
    expect(timeDiff).toBeLessThan(5000); // 5秒内
  });

  // Test 3: 文章浏览计数原子性
  it("should handle concurrent view count increments correctly", async () => {
    // 1. 创建已发布文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "热门文章",
        slug: `popular-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        viewCount: 0,
        publishedAt: new Date(),
      },
    });

    // 2. 并发10个增加操作
    const incrementPromises = Array.from({ length: 10 }, () =>
      db.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
    );

    await Promise.all(incrementPromises);

    // 3. 验证viewCount正确增加10
    const updatedPost = await db.post.findUnique({
      where: { id: post.id },
    });

    expect(updatedPost?.viewCount).toBe(10);
  });

  // Test 4: 删除文章级联操作
  it("should cascade delete post with related data", async () => {
    // 1. 创建文章(带reactions和aliases)
    const admin = await createTestUser("ADMIN");

    const post = await db.post.create({
      data: {
        title: "待删除文章",
        slug: `delete-test-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        publishedAt: new Date(),
        reactionRecords: {
          create: [
            {
              sessionKeyHash: `test-session-${Date.now()}`,
            },
          ],
        },
        aliases: {
          create: [
            {
              locale: PostLocale.EN,
              oldSlug: `old-slug-${Date.now()}`,
            },
          ],
        },
      },
      include: {
        reactionRecords: true,
        aliases: true,
      },
    });

    expect(post.reactionRecords).toHaveLength(1);
    expect(post.aliases).toHaveLength(1);

    // 2. 删除文章
    await db.post.delete({
      where: { id: post.id },
    });

    // 3. 验证Post删除
    const deletedPost = await db.post.findUnique({
      where: { id: post.id },
    });
    expect(deletedPost).toBeNull();

    // 4. 验证关联数据清理(根据schema配置)
    const orphanedReactions = await db.reaction.findMany({
      where: { postId: post.id },
    });
    expect(orphanedReactions).toHaveLength(0);

    const orphanedAliases = await db.postAlias.findMany({
      where: { postId: post.id },
    });
    expect(orphanedAliases).toHaveLength(0);
  });
});
