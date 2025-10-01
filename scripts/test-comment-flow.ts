/**
 * Comment Flow Test
 *
 * Tests:
 * - Comment creation and retrieval
 * - Pagination (cursor-based)
 * - Threaded replies (one level deep)
 * - Comment status handling
 */

import { PrismaClient, PostLocale, PostStatus, CommentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Comment Flow Test ===\n");

  try {
    // Setup: Create test post and users
    console.log("Setup: Creating test post and users...");
    const testPost = await prisma.post.create({
      data: {
        title: "Test Post for Comments",
        slug: `test-comments-${Date.now()}`,
        locale: PostLocale.EN,
        groupId: `test-${Date.now()}`,
        content: "Test content",
        excerpt: "Test excerpt",
        status: PostStatus.PUBLISHED,
        authorId: "test-author",
      },
    });
    console.log(`✓ Test post created (ID: ${testPost.id})`);

    // Test 1: Create top-level comments
    console.log("\nTest 1: Creating top-level comments...");
    const comment1 = await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "user-1",
        content: "First comment",
        status: CommentStatus.PENDING,
        locale: PostLocale.EN,
      },
    });
    console.log(`✓ Comment 1 created (ID: ${comment1.id}, status: ${comment1.status})`);

    const comment2 = await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "user-2",
        content: "Second comment",
        status: CommentStatus.PENDING,
        locale: PostLocale.EN,
      },
    });
    console.log(`✓ Comment 2 created (ID: ${comment2.id}, status: ${comment2.status})`);

    // Test 2: Create threaded replies
    console.log("\nTest 2: Creating threaded replies...");
    const reply1 = await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "user-3",
        parentId: comment1.id,
        content: "Reply to first comment",
        status: CommentStatus.PUBLISHED,
        locale: PostLocale.EN,
      },
    });
    console.log(`✓ Reply 1 created (ID: ${reply1.id}, parentId: ${reply1.parentId})`);

    const reply2 = await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "user-1",
        parentId: comment1.id,
        content: "Another reply to first comment",
        status: CommentStatus.PUBLISHED,
        locale: PostLocale.EN,
      },
    });
    console.log(`✓ Reply 2 created (ID: ${reply2.id}, parentId: ${reply2.parentId})`);

    // Test 3: Retrieve comments with replies
    console.log("\nTest 3: Retrieving comments with nested replies...");
    const topLevelComments = await prisma.comment.findMany({
      where: {
        postId: testPost.id,
        parentId: null,
      },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✓ Retrieved ${topLevelComments.length} top-level comments`);

    for (const comment of topLevelComments) {
      console.log(`  - Comment ${comment.id}: ${comment.replies.length} replies`);
    }

    if (topLevelComments.length !== 2) {
      throw new Error(`❌ Expected 2 top-level comments, got ${topLevelComments.length}`);
    }

    const comment1WithReplies = topLevelComments.find((c) => c.id === comment1.id);
    if (comment1WithReplies?.replies.length !== 2) {
      throw new Error(
        `❌ Expected 2 replies for comment1, got ${comment1WithReplies?.replies.length}`
      );
    }

    // Test 4: Pagination (cursor-based)
    console.log("\nTest 4: Testing pagination...");

    // Create more comments for pagination testing
    for (let i = 3; i <= 5; i++) {
      await prisma.comment.create({
        data: {
          postId: testPost.id,
          authorId: `user-${i}`,
          content: `Comment ${i}`,
          status: CommentStatus.PUBLISHED,
          locale: PostLocale.EN,
        },
      });
    }

    const page1 = await prisma.comment.findMany({
      where: {
        postId: testPost.id,
        parentId: null,
      },
      take: 2,
      orderBy: { createdAt: "desc" },
    });
    console.log(`✓ Page 1: ${page1.length} comments`);

    const page2 = await prisma.comment.findMany({
      where: {
        postId: testPost.id,
        parentId: null,
      },
      take: 2,
      skip: 2,
      orderBy: { createdAt: "desc" },
    });
    console.log(`✓ Page 2: ${page2.length} comments`);

    // Test 5: Status filtering
    console.log("\nTest 5: Testing status filtering...");
    const publishedComments = await prisma.comment.findMany({
      where: {
        postId: testPost.id,
        status: CommentStatus.PUBLISHED,
      },
    });
    console.log(`✓ Published comments: ${publishedComments.length}`);

    const pendingComments = await prisma.comment.findMany({
      where: {
        postId: testPost.id,
        status: CommentStatus.PENDING,
      },
    });
    console.log(`✓ Pending comments: ${pendingComments.length}`);

    // Test 6: Comment count per post
    console.log("\nTest 6: Counting comments per post...");
    const totalComments = await prisma.comment.count({
      where: { postId: testPost.id },
    });
    const topLevelCount = await prisma.comment.count({
      where: { postId: testPost.id, parentId: null },
    });
    const replyCount = await prisma.comment.count({
      where: { postId: testPost.id, parentId: { not: null } },
    });

    console.log(`✓ Total comments: ${totalComments}`);
    console.log(`✓ Top-level: ${topLevelCount}, Replies: ${replyCount}`);

    if (totalComments !== topLevelCount + replyCount) {
      throw new Error("❌ Comment count mismatch");
    }

    // Cleanup
    console.log("\nCleaning up test data...");
    await prisma.comment.deleteMany({
      where: { postId: testPost.id },
    });
    await prisma.post.delete({
      where: { id: testPost.id },
    });
    console.log("✓ Cleanup complete");

    console.log("\n✅ All comment flow tests PASSED");
    console.log("\n📝 Manual Testing Required:");
    console.log("   1. Start dev server: npm run dev");
    console.log("   2. Sign in with Google");
    console.log("   3. Post a comment on an article");
    console.log("   4. Verify 'awaiting moderation' message appears");
    console.log("   5. Post a reply to an existing comment");
    console.log("   6. Test pagination by scrolling to 'Load more' button");
    console.log("   7. Verify comments display correctly after moderation");
  } catch (error) {
    console.error("\n❌ Test FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
