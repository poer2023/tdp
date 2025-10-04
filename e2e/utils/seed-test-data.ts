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
    console.log("   Creating test posts...");
    const groupId = "test-group-e2e-1";

    const enPost = await prisma.post.upsert({
      where: {
        locale_slug: {
          locale: PostLocale.EN,
          slug: "test-post-en",
        },
      },
      update: {
        title: "Test Post EN",
        excerpt: "This is a test post for E2E testing",
        content: "# Test Post\n\nThis is test content for automated E2E testing.",
        groupId,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: JSON.stringify(["test", "e2e"]),
        authorId: adminUser.id,
      },
      create: {
        title: "Test Post EN",
        slug: "test-post-en",
        excerpt: "This is a test post for E2E testing",
        content: "# Test Post\n\nThis is test content for automated E2E testing.",
        locale: PostLocale.EN,
        groupId,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: JSON.stringify(["test", "e2e"]),
        authorId: adminUser.id,
      },
    });

    const zhPost = await prisma.post.upsert({
      where: {
        locale_slug: {
          locale: PostLocale.ZH,
          slug: "ce-shi-wen-zhang",
        },
      },
      update: {
        title: "测试文章",
        excerpt: "这是一篇用于 E2E 测试的测试文章",
        content: "# 测试文章\n\n这是自动化 E2E 测试的测试内容。",
        groupId,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: JSON.stringify(["测试", "e2e"]),
        authorId: adminUser.id,
      },
      create: {
        title: "测试文章",
        slug: "ce-shi-wen-zhang",
        excerpt: "这是一篇用于 E2E 测试的测试文章",
        content: "# 测试文章\n\n这是自动化 E2E 测试的测试内容。",
        locale: PostLocale.ZH,
        groupId,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: JSON.stringify(["测试", "e2e"]),
        authorId: adminUser.id,
      },
    });

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
