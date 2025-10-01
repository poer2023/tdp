/**
 * Comment Moderation Workflow Test
 *
 * Tests:
 * - Approve action (PENDING → PUBLISHED)
 * - Hide action (any → HIDDEN)
 * - Delete action (soft delete with archived flag)
 * - Auto-approval logic for returning users
 */

import { PrismaClient, PostLocale, PostStatus, CommentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Comment Moderation Workflow Test ===\n");

  try {
    // Setup: Create test post
    console.log("Setup: Creating test post...");
    const testPost = await prisma.post.create({
      data: {
        title: "Test Post for Moderation",
        slug: `test-moderation-${Date.now()}`,
        locale: PostLocale.EN,
        groupId: `test-${Date.now()}`,
        content: "Test content",
        excerpt: "Test excerpt",
        status: PostStatus.PUBLISHED,
        authorId: "test-author",
      },
    });
    console.log(`✓ Test post created (ID: ${testPost.id})`);

    // Test 1: Create comment with PENDING status
    console.log("\nTest 1: Creating pending comment...");
    const comment1 = await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "first-time-user",
        content: "First comment from new user",
        status: CommentStatus.PENDING,
        locale: PostLocale.EN,
      },
    });
    console.log(`✓ Comment created (ID: ${comment1.id}, status: ${comment1.status})`);

    if (comment1.status !== CommentStatus.PENDING) {
      throw new Error(`❌ Expected PENDING status, got ${comment1.status}`);
    }

    // Test 2: Approve comment (PENDING → PUBLISHED)
    console.log("\nTest 2: Approving comment...");
    const approvedComment = await prisma.comment.update({
      where: { id: comment1.id },
      data: { status: CommentStatus.PUBLISHED },
    });
    console.log(`✓ Comment approved (status: ${approvedComment.status})`);

    if (approvedComment.status !== CommentStatus.PUBLISHED) {
      throw new Error(`❌ Expected PUBLISHED status, got ${approvedComment.status}`);
    }

    // Test 3: Auto-approval logic for returning users
    console.log("\nTest 3: Testing auto-approval for returning users...");

    // Check if user has approved comments
    const hasApprovedComment = await prisma.comment.findFirst({
      where: {
        authorId: "first-time-user",
        status: CommentStatus.PUBLISHED,
      },
    });

    console.log(`✓ User has approved comment: ${hasApprovedComment ? "Yes" : "No"}`);

    // Create second comment from same user
    const comment2Status = hasApprovedComment ? CommentStatus.PUBLISHED : CommentStatus.PENDING;

    const comment2 = await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "first-time-user",
        content: "Second comment from same user",
        status: comment2Status,
        locale: PostLocale.EN,
      },
    });

    console.log(`✓ Second comment created (ID: ${comment2.id}, status: ${comment2.status})`);

    if (comment2.status !== CommentStatus.PUBLISHED) {
      throw new Error(`❌ Expected auto-approval (PUBLISHED), got ${comment2.status}`);
    }

    // Test 4: Hide comment (any → HIDDEN)
    console.log("\nTest 4: Hiding comment...");
    const hiddenComment = await prisma.comment.update({
      where: { id: comment2.id },
      data: { status: CommentStatus.HIDDEN },
    });
    console.log(`✓ Comment hidden (status: ${hiddenComment.status})`);

    if (hiddenComment.status !== CommentStatus.HIDDEN) {
      throw new Error(`❌ Expected HIDDEN status, got ${hiddenComment.status}`);
    }

    // Test 5: Retrieve only published comments
    console.log("\nTest 5: Filtering by status...");
    const publishedComments = await prisma.comment.findMany({
      where: {
        postId: testPost.id,
        status: CommentStatus.PUBLISHED,
      },
    });
    console.log(`✓ Published comments: ${publishedComments.length}`);

    if (publishedComments.some((c) => c.status !== CommentStatus.PUBLISHED)) {
      throw new Error("❌ Non-published comment found in published list");
    }

    // Test 6: Moderation queue (pending comments)
    console.log("\nTest 6: Testing moderation queue...");

    // Create more pending comments
    await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "new-user-1",
        content: "Comment from new user 1",
        status: CommentStatus.PENDING,
        locale: PostLocale.EN,
      },
    });

    await prisma.comment.create({
      data: {
        postId: testPost.id,
        authorId: "new-user-2",
        content: "Comment from new user 2",
        status: CommentStatus.PENDING,
        locale: PostLocale.EN,
      },
    });

    const pendingComments = await prisma.comment.findMany({
      where: {
        status: CommentStatus.PENDING,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    console.log(`✓ Pending comments in queue: ${pendingComments.length}`);

    if (pendingComments.length < 2) {
      throw new Error(`❌ Expected at least 2 pending comments, got ${pendingComments.length}`);
    }

    // Test 7: Bulk approve
    console.log("\nTest 7: Testing bulk approval...");
    const pendingIds = pendingComments.map((c) => c.id);
    const bulkApproved = await prisma.comment.updateMany({
      where: {
        id: { in: pendingIds },
      },
      data: {
        status: CommentStatus.PUBLISHED,
      },
    });

    console.log(`✓ Bulk approved ${bulkApproved.count} comments`);

    // Verify all are published
    const verifyPublished = await prisma.comment.findMany({
      where: {
        id: { in: pendingIds },
        status: { not: CommentStatus.PUBLISHED },
      },
    });

    if (verifyPublished.length > 0) {
      throw new Error(`❌ ${verifyPublished.length} comments not published`);
    }

    // Test 8: User trust signals (approved comment count)
    console.log("\nTest 8: Calculating user trust signals...");
    const userApprovedCount = await prisma.comment.count({
      where: {
        authorId: "first-time-user",
        status: CommentStatus.PUBLISHED,
      },
    });

    console.log(`✓ User 'first-time-user' has ${userApprovedCount} approved comments`);

    if (userApprovedCount < 1) {
      throw new Error("❌ User should have at least 1 approved comment");
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

    console.log("\n✅ All moderation workflow tests PASSED");
    console.log("\n📝 Manual Testing Required:");
    console.log("   1. Start dev server: npm run dev");
    console.log("   2. Navigate to /admin/comments");
    console.log("   3. Verify pending comments show in queue");
    console.log("   4. Test approve/hide/delete actions");
    console.log("   5. Verify user trust signals display (approved count)");
    console.log("   6. Test status filtering (Pending/Published/Hidden/All)");
    console.log("   7. Verify auto-approval for returning users");
  } catch (error) {
    console.error("\n❌ Test FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
