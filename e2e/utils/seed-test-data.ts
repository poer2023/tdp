import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";
import { TEST_USERS } from "./auth";

const prisma = new PrismaClient();

export async function seedTestData() {
  console.log("🌱 Seeding E2E test data...");

  try {
    // 1. 创建测试用户
    console.log("   Creating test users...");
    const regularUser = await prisma.user.upsert({
      where: { id: TEST_USERS.regular.id },
      update: {
        name: TEST_USERS.regular.name,
        email: TEST_USERS.regular.email,
        image: TEST_USERS.regular.image,
      },
      create: {
        id: TEST_USERS.regular.id,
        name: TEST_USERS.regular.name,
        email: TEST_USERS.regular.email,
        image: TEST_USERS.regular.image,
      },
    });

    const adminUser = await prisma.user.upsert({
      where: { id: TEST_USERS.admin.id },
      update: {
        name: TEST_USERS.admin.name,
        email: TEST_USERS.admin.email,
        image: TEST_USERS.admin.image,
      },
      create: {
        id: TEST_USERS.admin.id,
        name: TEST_USERS.admin.name,
        email: TEST_USERS.admin.email,
        image: TEST_USERS.admin.image,
      },
    });

    // 2. 创建测试文章 (EN/ZH 配对)
    // NOTE: IDs/slugs must match TEST_POST_IDS in fixtures/test-data.ts
    console.log("   Creating test posts...");
    const groupId1 = "test-group-1";
    const groupId2 = "test-group-2";
    const groupId3 = "test-group-3";

    // Group 1: EN + ZH pair (for translation tests)
    const enPost1 = await prisma.post.upsert({
      where: { id: "test-post-en-1" },
      update: {
        title: "Test Post EN 1",
        excerpt: "This is the first English test post for E2E testing",
        content: "# Test Post EN 1\n\nThis is test content for automated E2E testing. It has enough content to be meaningful.",
        groupId: groupId1,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: "test,e2e,english",
        authorId: adminUser.id,
      },
      create: {
        id: "test-post-en-1",
        title: "Test Post EN 1",
        slug: "test-post-en-1",
        excerpt: "This is the first English test post for E2E testing",
        content: "# Test Post EN 1\n\nThis is test content for automated E2E testing. It has enough content to be meaningful.",
        locale: PostLocale.EN,
        groupId: groupId1,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: "test,e2e,english",
        authorId: adminUser.id,
      },
    });

    const zhPost1 = await prisma.post.upsert({
      where: { id: "test-post-zh-1" },
      update: {
        title: "测试文章中文 1",
        excerpt: "这是第一篇中文测试文章，用于 E2E 测试",
        content: "# 测试文章中文 1\n\n这是自动化 E2E 测试的测试内容。内容足够长以便有意义。",
        groupId: groupId1,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: "测试,e2e,中文",
        authorId: adminUser.id,
      },
      create: {
        id: "test-post-zh-1",
        title: "测试文章中文 1",
        slug: "test-post-zh-1",
        excerpt: "这是第一篇中文测试文章，用于 E2E 测试",
        content: "# 测试文章中文 1\n\n这是自动化 E2E 测试的测试内容。内容足够长以便有意义。",
        locale: PostLocale.ZH,
        groupId: groupId1,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: "测试,e2e,中文",
        authorId: adminUser.id,
      },
    });

    // Group 2: EN only (no translation) - for testing posts without translations
    const enPost2 = await prisma.post.upsert({
      where: { id: "test-post-en-2" },
      update: {
        title: "Test Post EN 2",
        excerpt: "Second English test post without translation",
        content: "# Test Post EN 2\n\nThis post does not have a Chinese translation.",
        groupId: groupId2,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: "test,no-translation",
        authorId: adminUser.id,
      },
      create: {
        id: "test-post-en-2",
        title: "Test Post EN 2",
        slug: "test-post-en-2",
        excerpt: "Second English test post without translation",
        content: "# Test Post EN 2\n\nThis post does not have a Chinese translation.",
        locale: PostLocale.EN,
        groupId: groupId2,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: "test,no-translation",
        authorId: adminUser.id,
      },
    });

    // Group 3: EN only for pagination tests
    const enPost3 = await prisma.post.upsert({
      where: { id: "test-post-en-3" },
      update: {
        title: "Test Post EN 3",
        excerpt: "Third English test post for pagination",
        content: "# Test Post EN 3\n\nUsed for testing pagination and listing.",
        groupId: groupId3,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        tags: "test,pagination",
        authorId: adminUser.id,
      },
      create: {
        id: "test-post-en-3",
        title: "Test Post EN 3",
        slug: "test-post-en-3",
        excerpt: "Third English test post for pagination",
        content: "# Test Post EN 3\n\nUsed for testing pagination and listing.",
        locale: PostLocale.EN,
        groupId: groupId3,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        tags: "test,pagination",
        authorId: adminUser.id,
      },
    });

    // Initialize reaction aggregates for test posts
    const postIds = ["test-post-en-1", "test-post-zh-1", "test-post-en-2", "test-post-en-3"];
    for (const postId of postIds) {
      await prisma.reactionAggregate.upsert({
        where: { postId },
        create: { postId, likeCount: 0 },
        update: {},
      });
    }

    // For backwards compatibility, keep the old posts
    const enPost = enPost1;
    const zhPost = zhPost1;

    console.log("✅ E2E test data seeded successfully");
    console.log(`   - Regular User: ${regularUser.email} (${regularUser.id})`);
    console.log(`   - Admin User: ${adminUser.email} (${adminUser.id})`);
    console.log(`   - EN Post: /posts/${enPost.slug}`);
    console.log(`   - ZH Post: /zh/posts/${zhPost.slug}`);
    // Comments removed
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  }
}

export async function cleanupTestData() {
  console.log("🧹 Cleaning up E2E test data...");

  try {
    // 按照外键依赖顺序删除

    // 1. 删除点赞
    const deletedReactions = await prisma.reaction.deleteMany({
      where: {
        post: { authorId: { in: [TEST_USERS.regular.id, TEST_USERS.admin.id] } },
      },
    });
    console.log(`   - Deleted ${deletedReactions.count} reactions`);

    // 2. 删除文章
    const deletedPosts = await prisma.post.deleteMany({
      where: {
        authorId: {
          in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
        },
      },
    });
    console.log(`   - Deleted ${deletedPosts.count} posts`);

    // 3. 删除账户
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        userId: {
          in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
        },
      },
    });
    console.log(`   - Deleted ${deletedAccounts.count} accounts`);

    // 4. 删除会话
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId: {
          in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
        },
      },
    });
    console.log(`   - Deleted ${deletedSessions.count} sessions`);

    // 5. 删除用户
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          in: [TEST_USERS.regular.id, TEST_USERS.admin.id],
        },
      },
    });
    console.log(`   - Deleted ${deletedUsers.count} users`);

    console.log("✅ E2E test data cleaned up successfully");
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const action = process.argv[2];

  if (action === "cleanup" || action === "--cleanup") {
    cleanupTestData()
      .then(() => {
        console.log("\n✨ Cleanup completed");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Cleanup failed:", error);
        process.exit(1);
      })
      .finally(() => prisma.$disconnect());
  } else {
    seedTestData()
      .then(() => {
        console.log("\n✨ Seeding completed");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
      })
      .finally(() => prisma.$disconnect());
  }
}
