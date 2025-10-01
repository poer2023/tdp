/**
 * PostAlias 301 Redirect Test
 *
 * Tests:
 * - PostAlias creation and retrieval
 * - 301 redirect logic for old slugs
 * - Locale-specific redirect paths
 */

import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== PostAlias 301 Redirect Test ===\n");

  try {
    // Test 1: Create test post with new slug
    console.log("Test 1: Creating test post with new slug...");
    const testPost = await prisma.post.create({
      data: {
        title: "Test Post for Redirect",
        slug: "test-redirect-new",
        locale: PostLocale.ZH,
        groupId: `test-${Date.now()}`,
        content: "Test content",
        excerpt: "Test excerpt",
        status: PostStatus.PUBLISHED,
        authorId: "test-author",
      },
    });
    console.log(`✓ Test post created (ID: ${testPost.id}, slug: ${testPost.slug})`);

    // Test 2: Create PostAlias for old slug
    console.log("\nTest 2: Creating PostAlias for old Chinese slug...");
    const oldSlug = "测试文章";
    const alias = await prisma.postAlias.create({
      data: {
        locale: PostLocale.ZH,
        oldSlug: oldSlug,
        postId: testPost.id,
      },
    });
    console.log(`✓ PostAlias created (oldSlug: ${oldSlug} → ${testPost.slug})`);

    // Test 3: Verify alias lookup
    console.log("\nTest 3: Testing alias lookup...");
    const foundAlias = await prisma.postAlias.findUnique({
      where: {
        locale_oldSlug: {
          locale: PostLocale.ZH,
          oldSlug: oldSlug,
        },
      },
      include: {
        post: true,
      },
    });

    if (!foundAlias) {
      throw new Error("❌ Alias not found");
    }

    if (foundAlias.post.slug !== testPost.slug) {
      throw new Error(`❌ Alias points to wrong slug: ${foundAlias.post.slug}`);
    }

    console.log(`✓ Alias lookup successful`);
    console.log(`  Old slug: ${oldSlug}`);
    console.log(`  New slug: ${foundAlias.post.slug}`);
    console.log(`  Redirect path: /zh/posts/${foundAlias.post.slug}`);

    // Test 4: Test English locale alias
    console.log("\nTest 4: Creating English locale alias...");
    const enPost = await prisma.post.create({
      data: {
        title: "English Test Post",
        slug: "english-test-new",
        locale: PostLocale.EN,
        groupId: `test-en-${Date.now()}`,
        content: "English content",
        excerpt: "English excerpt",
        status: PostStatus.PUBLISHED,
        authorId: "test-author",
      },
    });

    const enAlias = await prisma.postAlias.create({
      data: {
        locale: PostLocale.EN,
        oldSlug: "old-english-slug",
        postId: enPost.id,
      },
    });

    const foundEnAlias = await prisma.postAlias.findUnique({
      where: {
        locale_oldSlug: {
          locale: PostLocale.EN,
          oldSlug: "old-english-slug",
        },
      },
      include: {
        post: true,
      },
    });

    if (!foundEnAlias) {
      throw new Error("❌ English alias not found");
    }

    console.log(`✓ English alias created and verified`);
    console.log(`  Old slug: old-english-slug`);
    console.log(`  New slug: ${foundEnAlias.post.slug}`);
    console.log(`  Redirect path: /posts/${foundEnAlias.post.slug}`);

    // Test 5: Verify locale isolation
    console.log("\nTest 5: Testing locale isolation...");
    const crossLocaleAlias = await prisma.postAlias.findUnique({
      where: {
        locale_oldSlug: {
          locale: PostLocale.EN,
          oldSlug: oldSlug, // ZH slug in EN locale
        },
      },
    });

    if (crossLocaleAlias) {
      throw new Error("❌ Cross-locale alias found (should not exist)");
    }

    console.log(`✓ Locale isolation verified (ZH slug not found in EN locale)`);

    // Cleanup
    console.log("\nCleaning up test data...");
    await prisma.postAlias.deleteMany({
      where: {
        postId: {
          in: [testPost.id, enPost.id],
        },
      },
    });
    await prisma.post.deleteMany({
      where: {
        id: {
          in: [testPost.id, enPost.id],
        },
      },
    });
    console.log("✓ Cleanup complete");

    console.log("\n✅ All PostAlias redirect tests PASSED");
    console.log("\n📝 Manual Testing Required:");
    console.log("   1. Start dev server: npm run dev");
    console.log("   2. Create a post with Chinese slug, then change it");
    console.log("   3. Visit old slug URL and verify 301 redirect");
    console.log("   4. Check browser dev tools Network tab for 301 status");
  } catch (error) {
    console.error("\n❌ Test FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
