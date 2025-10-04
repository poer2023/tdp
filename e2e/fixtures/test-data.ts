/**
 * Test Data Fixtures
 *
 * Provides deterministic test data for E2E tests.
 * Ensures test isolation and repeatability.
 */

import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Test User IDs (matching auth.ts)
export const TEST_USER_IDS = {
  regular: "test-user-e2e-1",
  admin: "test-admin-e2e-1",
} as const;

// Test Post IDs
export const TEST_POST_IDS = {
  enPost1: "test-post-en-1",
  enPost2: "test-post-en-2",
  enPost3: "test-post-en-3",
  zhPost1: "test-post-zh-1",
  zhPost2: "test-post-zh-2",
  zhPost3: "test-post-zh-3",
} as const;

// Test Group IDs (for translations)
export const TEST_GROUP_IDS = {
  group1: "test-group-1",
  group2: "test-group-2",
  group3: "test-group-3",
} as const;

/**
 * Seed test data into database
 * Called in global-setup.ts or test.beforeAll()
 */
export async function seedTestData() {
  console.log("🌱 Seeding E2E test data...");

  // Create test users
  await prisma.user.upsert({
    where: { id: TEST_USER_IDS.regular },
    create: {
      id: TEST_USER_IDS.regular,
      name: "Test User",
      email: "test-e2e@example.com",
      image: "https://avatars.githubusercontent.com/u/1?v=4",
    },
    update: {
      name: "Test User",
      email: "test-e2e@example.com",
    },
  });

  await prisma.user.upsert({
    where: { id: TEST_USER_IDS.admin },
    create: {
      id: TEST_USER_IDS.admin,
      name: "Admin User",
      email: "admin-e2e@example.com",
      image: "https://avatars.githubusercontent.com/u/2?v=4",
      role: "ADMIN",
    },
    update: {
      name: "Admin User",
      email: "admin-e2e@example.com",
      role: "ADMIN",
    },
  });

  // Create test posts (EN/ZH pairs)
  const now = new Date();

  // Group 1: EN + ZH pair
  await prisma.post.upsert({
    where: { id: TEST_POST_IDS.enPost1 },
    create: {
      id: TEST_POST_IDS.enPost1,
      title: "Test Post EN 1",
      slug: "test-post-en-1",
      content:
        "This is the first English test post for E2E testing. It has enough content to be meaningful.",
      excerpt: "First English test post",
      locale: PostLocale.EN,
      groupId: TEST_GROUP_IDS.group1,
      status: PostStatus.PUBLISHED,
      publishedAt: now,
      updatedAt: now,
      tags: "test,e2e,english",
      authorId: TEST_USER_IDS.admin,
    },
    update: {
      status: PostStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  await prisma.post.upsert({
    where: { id: TEST_POST_IDS.zhPost1 },
    create: {
      id: TEST_POST_IDS.zhPost1,
      title: "测试文章中文 1",
      slug: "test-post-zh-1",
      content: "这是第一篇中文测试文章，用于 E2E 测试。内容足够长以便有意义。",
      excerpt: "第一篇中文测试文章",
      locale: PostLocale.ZH,
      groupId: TEST_GROUP_IDS.group1,
      status: PostStatus.PUBLISHED,
      publishedAt: now,
      updatedAt: now,
      tags: "测试,e2e,中文",
      authorId: TEST_USER_IDS.admin,
    },
    update: {
      status: PostStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  // Group 2: EN only (no translation)
  await prisma.post.upsert({
    where: { id: TEST_POST_IDS.enPost2 },
    create: {
      id: TEST_POST_IDS.enPost2,
      title: "Test Post EN 2",
      slug: "test-post-en-2",
      content:
        "Second English test post without Chinese translation. Used for testing missing translation scenarios.",
      excerpt: "Second English test post",
      locale: PostLocale.EN,
      groupId: TEST_GROUP_IDS.group2,
      status: PostStatus.PUBLISHED,
      publishedAt: now,
      updatedAt: now,
      tags: "test,no-translation",
      authorId: TEST_USER_IDS.admin,
    },
    update: {
      status: PostStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  // Group 3: ZH only (no translation)
  await prisma.post.upsert({
    where: { id: TEST_POST_IDS.zhPost2 },
    create: {
      id: TEST_POST_IDS.zhPost2,
      title: "测试文章中文 2",
      slug: "test-post-zh-2",
      content: "第二篇中文测试文章，没有英文翻译。用于测试缺失翻译的场景。",
      excerpt: "第二篇中文测试文章",
      locale: PostLocale.ZH,
      groupId: TEST_GROUP_IDS.group3,
      status: PostStatus.PUBLISHED,
      publishedAt: now,
      updatedAt: now,
      tags: "测试,无翻译",
      authorId: TEST_USER_IDS.admin,
    },
    update: {
      status: PostStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  // Additional posts for pagination/listing tests
  await prisma.post.upsert({
    where: { id: TEST_POST_IDS.enPost3 },
    create: {
      id: TEST_POST_IDS.enPost3,
      title: "Test Post EN 3",
      slug: "test-post-en-3",
      content: "Third English test post for testing pagination and listing features.",
      excerpt: "Third English test post",
      locale: PostLocale.EN,
      groupId: "test-group-en-3",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: now,
      tags: "test,pagination",
      authorId: TEST_USER_IDS.admin,
    },
    update: {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  await prisma.post.upsert({
    where: { id: TEST_POST_IDS.zhPost3 },
    create: {
      id: TEST_POST_IDS.zhPost3,
      title: "测试文章中文 3",
      slug: "test-post-zh-3",
      content: "第三篇中文测试文章，用于测试分页和列表功能。",
      excerpt: "第三篇中文测试文章",
      locale: PostLocale.ZH,
      groupId: "test-group-zh-3",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      updatedAt: now,
      tags: "测试,分页",
      authorId: TEST_USER_IDS.admin,
    },
    update: {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  // Initialize reaction aggregates for test posts
  for (const postId of Object.values(TEST_POST_IDS)) {
    await prisma.reactionAggregate.upsert({
      where: { postId },
      create: {
        postId,
        likeCount: 0,
      },
      update: {},
    });
  }

  // Comments removed from test data

  console.log("✅ E2E test data seeded successfully");
}

/**
 * Clean up test data from database
 * Called in global-teardown.ts or test.afterAll()
 */
export async function cleanupTestData() {
  console.log("🧹 Cleaning up E2E test data...");

  // Delete in reverse order of dependencies
  // Comments removed

  await prisma.reaction.deleteMany({
    where: {
      postId: { in: Object.values(TEST_POST_IDS) },
    },
  });

  await prisma.reactionAggregate.deleteMany({
    where: {
      postId: { in: Object.values(TEST_POST_IDS) },
    },
  });

  await prisma.postAlias.deleteMany({
    where: {
      postId: { in: Object.values(TEST_POST_IDS) },
    },
  });

  await prisma.post.deleteMany({
    where: {
      id: { in: Object.values(TEST_POST_IDS) },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: Object.values(TEST_USER_IDS) },
    },
  });

  console.log("✅ E2E test data cleaned up");
}

/**
 * Reset specific test data (for test isolation)
 */
export async function resetLikesData() {
  await prisma.reaction.deleteMany({
    where: {
      postId: { in: Object.values(TEST_POST_IDS) },
    },
  });

  for (const postId of Object.values(TEST_POST_IDS)) {
    await prisma.reactionAggregate.update({
      where: { postId },
      data: { likeCount: 0 },
    });
  }
}

// resetCommentsData removed

// Export for use in tests
export { prisma };
