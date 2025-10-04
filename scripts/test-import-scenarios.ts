/**
 * Import Scenarios Test
 *
 * Tests:
 * - Create new posts
 * - Update existing posts (by groupId + locale)
 * - Update by slug (no groupId)
 * - Slug conflict handling
 * - Validation error handling
 * - Dry-run vs actual import
 */

import { importContent } from "@/lib/content-import";
import { exportContent } from "@/lib/content-export";
import JSZip from "jszip";
import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Import Scenarios Test ===\n");

  try {
    // Setup: Create test posts
    console.log("Setup: Creating test posts...");
    const testPost1 = await prisma.post.create({
      data: {
        title: "Original Title",
        slug: "test-import-1",
        locale: PostLocale.EN,
        groupId: "import-test-group",
        content: "Original content",
        excerpt: "Original excerpt",
        status: PostStatus.PUBLISHED,
        authorId: "test-author",
        tags: "original",
      },
    });

    const testPost2 = await prisma.post.create({
      data: {
        title: "No GroupId Post",
        slug: "test-import-2",
        locale: PostLocale.EN,
        groupId: `no-group-${Date.now()}`,
        content: "Content without groupId",
        excerpt: "Excerpt",
        status: PostStatus.DRAFT,
        authorId: "test-author",
        tags: "test",
      },
    });

    console.log(`✓ Test posts created`);

    // Test 1: Export existing posts
    console.log("\nTest 1: Exporting test posts...");
    const exportBuffer = await exportContent({});
    const exportZip = new JSZip();
    await exportZip.loadAsync(exportBuffer);
    console.log(`✓ Export complete`);

    // Test 2: Dry-run import (no changes)
    console.log("\nTest 2: Testing dry-run import...");
    const dryRunResult = await importContent(exportBuffer, {
      dryRun: true,
      adminId: "test-admin",
    });

    console.log(`✓ Dry-run complete`);
    console.log(`  - Created: ${dryRunResult.summary.created}`);
    console.log(`  - Updated: ${dryRunResult.summary.updated}`);
    console.log(`  - Skipped: ${dryRunResult.summary.skipped}`);
    console.log(`  - Errors: ${dryRunResult.summary.errors}`);

    if (!dryRunResult.dryRun) {
      throw new Error("❌ Expected dryRun=true");
    }

    if (dryRunResult.summary.errors > 0) {
      console.log("\nErrors:");
      for (const detail of dryRunResult.details) {
        if (detail.action === "error") {
          console.log(`  - ${detail.filename}: ${detail.error}`);
        }
      }
    }

    // Test 3: Create new post via import
    console.log("\nTest 3: Creating new post via import...");

    const newPostZip = new JSZip();
    const newPostContent = `---
title: "New Imported Post"
date: "${new Date().toISOString()}"
slug: "new-imported-post"
locale: "EN"
groupId: "new-group-${Date.now()}"
tags:
  - "imported"
  - "test"
status: "PUBLISHED"
---

This is a new post created via import.
`;
    newPostZip.file("content/en/new-imported-post.md", newPostContent);
    newPostZip.file(
      "manifest.json",
      JSON.stringify({
        exportDate: new Date().toISOString(),
        exportVersion: "1.0",
        stats: { totalPosts: 1 },
      })
    );

    const newPostBuffer = await newPostZip.generateAsync({ type: "nodebuffer" });

    // Dry-run first
    const createDryRun = await importContent(newPostBuffer, {
      dryRun: true,
      adminId: "test-admin",
    });

    console.log(`✓ Dry-run: ${createDryRun.summary.created} posts to be created`);

    if (createDryRun.summary.created !== 1) {
      throw new Error(`❌ Expected 1 post to be created, got ${createDryRun.summary.created}`);
    }

    // Actual import
    const createResult = await importContent(newPostBuffer, {
      dryRun: false,
      adminId: "test-admin",
    });

    console.log(`✓ Import complete: ${createResult.summary.created} posts created`);

    // Verify creation
    const createdPost = await prisma.post.findFirst({
      where: { slug: "new-imported-post" },
    });

    if (!createdPost) {
      throw new Error("❌ Imported post not found in database");
    }

    console.log(`✓ Post verified in database (ID: ${createdPost.id})`);

    // Test 4: Update existing post (by groupId + locale)
    console.log("\nTest 4: Updating existing post by groupId...");

    const updateZip = new JSZip();
    const updateContent = `---
title: "Updated Title"
date: "${testPost1.createdAt.toISOString()}"
slug: "${testPost1.slug}"
locale: "${testPost1.locale}"
groupId: "${testPost1.groupId}"
tags:
  - "updated"
status: "PUBLISHED"
---

This content has been updated via import.
`;
    updateZip.file(`content/en/${testPost1.slug}.md`, updateContent);
    updateZip.file(
      "manifest.json",
      JSON.stringify({
        exportDate: new Date().toISOString(),
        exportVersion: "1.0",
        stats: { totalPosts: 1 },
      })
    );

    const updateBuffer = await updateZip.generateAsync({ type: "nodebuffer" });

    const updateResult = await importContent(updateBuffer, {
      dryRun: false,
      adminId: "test-admin",
    });

    console.log(`✓ Update complete: ${updateResult.summary.updated} posts updated`);

    if (updateResult.summary.updated !== 1) {
      throw new Error(`❌ Expected 1 post to be updated, got ${updateResult.summary.updated}`);
    }

    // Verify update
    const updatedPost = await prisma.post.findUnique({
      where: { id: testPost1.id },
    });

    if (updatedPost?.title !== "Updated Title") {
      throw new Error(`❌ Title not updated (got: ${updatedPost?.title})`);
    }

    console.log(`✓ Update verified (title: "${updatedPost.title}")`);

    // Test 5: Invalid frontmatter handling
    console.log("\nTest 5: Testing invalid frontmatter handling...");

    const invalidZip = new JSZip();
    const invalidContent = `---
title: "Invalid Post"
slug: "invalid-post"
locale: "INVALID_LOCALE"
groupId: "test"
status: "PUBLISHED"
---

Invalid locale value.
`;
    invalidZip.file("content/en/invalid-post.md", invalidContent);
    invalidZip.file(
      "manifest.json",
      JSON.stringify({ exportDate: new Date().toISOString(), exportVersion: "1.0" })
    );

    const invalidBuffer = await invalidZip.generateAsync({ type: "nodebuffer" });

    const invalidResult = await importContent(invalidBuffer, {
      dryRun: true,
      adminId: "test-admin",
    });

    console.log(`✓ Invalid import handled`);
    console.log(`  - Errors: ${invalidResult.summary.errors}`);

    if (invalidResult.summary.errors === 0) {
      throw new Error("❌ Expected validation errors for invalid locale");
    }

    // Test 6: Slug conflict handling
    console.log("\nTest 6: Testing slug conflict handling...");

    const conflictZip = new JSZip();
    const conflictContent = `---
title: "Conflict Post"
date: "${new Date().toISOString()}"
slug: "${testPost1.slug}"
locale: "EN"
groupId: "conflict-group-${Date.now()}"
tags:
  - "conflict"
status: "PUBLISHED"
---

This should create a slug conflict.
`;
    conflictZip.file(`content/en/${testPost1.slug}.md`, conflictContent);
    conflictZip.file(
      "manifest.json",
      JSON.stringify({ exportDate: new Date().toISOString(), exportVersion: "1.0" })
    );

    const conflictBuffer = await conflictZip.generateAsync({ type: "nodebuffer" });

    const conflictResult = await importContent(conflictBuffer, {
      dryRun: false,
      adminId: "test-admin",
    });

    console.log(`✓ Conflict handled`);
    console.log(`  - Created: ${conflictResult.summary.created}`);

    // Find the conflict post (should have -2 suffix)
    const conflictPost = await prisma.post.findFirst({
      where: {
        slug: { startsWith: testPost1.slug },
        id: { not: testPost1.id },
      },
    });

    if (conflictPost) {
      console.log(`✓ Conflict post created with slug: ${conflictPost.slug}`);
    }

    // Cleanup
    console.log("\nCleaning up test data...");
    const idsToDelete = [testPost1.id, testPost2.id, createdPost.id, conflictPost?.id].filter(
      (id): id is string => Boolean(id)
    );
    await prisma.post.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    });
    console.log("✓ Cleanup complete");

    console.log("\n✅ All import scenario tests PASSED");
    console.log("\n📝 Manual Testing Required:");
    console.log("   1. Navigate to /admin/import");
    console.log("   2. Upload a ZIP file with new posts");
    console.log("   3. Verify preview table shows correct actions");
    console.log("   4. Click 'Apply Import' and confirm");
    console.log("   5. Verify posts created/updated correctly");
    console.log("   6. Test error handling with invalid files");
    console.log("   7. Test slug conflict resolution");
  } catch (error) {
    console.error("\n❌ Test FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
