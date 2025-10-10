import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";
import { PostStatus, PostLocale } from "@prisma/client";
import crypto from "crypto";

describe("Reactions API Integration", () => {
  const db = getTestDb();

  // Helper: 生成sessionKeyHash
  function generateSessionKeyHash(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // Test 1: 创建点赞记录
  it("should create reaction record for a post", async () => {
    // 1. 创建测试文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "测试文章",
        slug: `reaction-test-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        publishedAt: new Date(),
      },
    });

    // 2. 创建点赞记录
    const sessionKeyHash = generateSessionKeyHash();
    const reaction = await db.reaction.create({
      data: {
        postId: post.id,
        sessionKeyHash,
      },
    });

    // 3. 验证记录创建
    expect(reaction.id).toBeDefined();
    expect(reaction.postId).toBe(post.id);
    expect(reaction.sessionKeyHash).toBe(sessionKeyHash);
    expect(reaction.createdAt).toBeInstanceOf(Date);
  });

  // Test 2: 防止同一session重复点赞
  it("should prevent duplicate reactions from same session", async () => {
    // 1. 创建文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "重复点赞测试",
        slug: `duplicate-reaction-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        publishedAt: new Date(),
      },
    });

    // 2. 第一次点赞
    const sessionKeyHash = generateSessionKeyHash();
    await db.reaction.create({
      data: {
        postId: post.id,
        sessionKeyHash,
      },
    });

    // 3. 第二次点赞应该失败 (unique constraint)
    await expect(
      db.reaction.create({
        data: {
          postId: post.id,
          sessionKeyHash, // 相同的sessionKeyHash
        },
      })
    ).rejects.toThrow(); // Unique constraint violation
  });

  // Test 3: 统计文章点赞数
  it("should count reactions for a post correctly", async () => {
    // 1. 创建文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "点赞统计测试",
        slug: `count-reactions-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        publishedAt: new Date(),
      },
    });

    // 2. 添加3个不同session的点赞
    const sessions = [generateSessionKeyHash(), generateSessionKeyHash(), generateSessionKeyHash()];

    for (const sessionKeyHash of sessions) {
      await db.reaction.create({
        data: {
          postId: post.id,
          sessionKeyHash,
        },
      });
    }

    // 3. 统计点赞数
    const reactionCount = await db.reaction.count({
      where: { postId: post.id },
    });

    expect(reactionCount).toBe(3);
  });

  // Test 4: 检查session是否已点赞
  it("should check if session already liked a post", async () => {
    // 1. 创建文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "检查点赞状态",
        slug: `check-liked-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        publishedAt: new Date(),
      },
    });

    // 2. Session A点赞
    const sessionA = generateSessionKeyHash();
    await db.reaction.create({
      data: {
        postId: post.id,
        sessionKeyHash: sessionA,
      },
    });

    // 3. 检查Session A是否已点赞
    const sessionAReaction = await db.reaction.findUnique({
      where: {
        postId_sessionKeyHash: {
          postId: post.id,
          sessionKeyHash: sessionA,
        },
      },
    });
    expect(sessionAReaction).toBeDefined();

    // 4. 检查Session B是否已点赞
    const sessionB = generateSessionKeyHash();
    const sessionBReaction = await db.reaction.findUnique({
      where: {
        postId_sessionKeyHash: {
          postId: post.id,
          sessionKeyHash: sessionB,
        },
      },
    });
    expect(sessionBReaction).toBeNull();
  });

  // Test 5: 删除文章时级联删除点赞记录
  it("should cascade delete reactions when post is deleted", async () => {
    // 1. 创建文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "级联删除测试",
        slug: `cascade-delete-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        publishedAt: new Date(),
      },
    });

    // 2. 添加点赞记录
    const sessionKeyHash = generateSessionKeyHash();
    await db.reaction.create({
      data: {
        postId: post.id,
        sessionKeyHash,
      },
    });

    // 3. 验证点赞记录存在
    const reactionsBefore = await db.reaction.count({
      where: { postId: post.id },
    });
    expect(reactionsBefore).toBe(1);

    // 4. 删除文章
    await db.post.delete({
      where: { id: post.id },
    });

    // 5. 验证点赞记录被级联删除
    const reactionsAfter = await db.reaction.count({
      where: { postId: post.id },
    });
    expect(reactionsAfter).toBe(0);
  });

  // Test 6: ReactionAggregate更新逻辑
  it("should update reaction aggregate count", async () => {
    // 1. 创建文章
    const admin = await createTestUser("ADMIN");
    const post = await db.post.create({
      data: {
        title: "聚合统计测试",
        slug: `aggregate-test-${Date.now()}`,
        content: "内容",
        excerpt: "摘要",
        status: PostStatus.PUBLISHED,
        authorId: admin.id,
        locale: PostLocale.ZH,
        publishedAt: new Date(),
      },
    });

    // 2. 创建或更新ReactionAggregate
    await db.reactionAggregate.upsert({
      where: { postId: post.id },
      create: {
        postId: post.id,
        likeCount: 1,
      },
      update: {
        likeCount: { increment: 1 },
      },
    });

    // 3. 验证聚合记录
    const aggregate = await db.reactionAggregate.findUnique({
      where: { postId: post.id },
    });

    expect(aggregate).toBeDefined();
    expect(aggregate?.likeCount).toBe(1);

    // 4. 再次增加
    await db.reactionAggregate.update({
      where: { postId: post.id },
      data: { likeCount: { increment: 1 } },
    });

    // 5. 验证计数增加
    const updatedAggregate = await db.reactionAggregate.findUnique({
      where: { postId: post.id },
    });
    expect(updatedAggregate?.likeCount).toBe(2);
  });

  // Test 7: 批量查询文章点赞状态
  it("should batch query reaction status for multiple posts", async () => {
    // 1. 创建多个文章
    const admin = await createTestUser("ADMIN");
    const posts = await Promise.all([
      db.post.create({
        data: {
          title: "文章1",
          slug: `batch-1-${Date.now()}`,
          content: "内容",
          excerpt: "摘要",
          status: PostStatus.PUBLISHED,
          authorId: admin.id,
          locale: PostLocale.ZH,
          publishedAt: new Date(),
        },
      }),
      db.post.create({
        data: {
          title: "文章2",
          slug: `batch-2-${Date.now()}`,
          content: "内容",
          excerpt: "摘要",
          status: PostStatus.PUBLISHED,
          authorId: admin.id,
          locale: PostLocale.ZH,
          publishedAt: new Date(),
        },
      }),
      db.post.create({
        data: {
          title: "文章3",
          slug: `batch-3-${Date.now()}`,
          content: "内容",
          excerpt: "摘要",
          status: PostStatus.PUBLISHED,
          authorId: admin.id,
          locale: PostLocale.ZH,
          publishedAt: new Date(),
        },
      }),
    ]);

    // 2. Session对部分文章点赞
    const sessionKeyHash = generateSessionKeyHash();
    await db.reaction.create({
      data: {
        postId: posts[0].id,
        sessionKeyHash,
      },
    });
    await db.reaction.create({
      data: {
        postId: posts[2].id,
        sessionKeyHash,
      },
    });

    // 3. 批量查询该session的点赞状态
    const postIds = posts.map((p) => p.id);
    const reactions = await db.reaction.findMany({
      where: {
        postId: { in: postIds },
        sessionKeyHash,
      },
      select: { postId: true },
    });

    // 4. 验证结果
    expect(reactions).toHaveLength(2);
    const likedPostIds = reactions.map((r) => r.postId);
    expect(likedPostIds).toContain(posts[0].id);
    expect(likedPostIds).toContain(posts[2].id);
    expect(likedPostIds).not.toContain(posts[1].id);
  });
});
