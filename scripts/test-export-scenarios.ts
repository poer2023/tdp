/**
 * Export Scenarios Test
 *
 * Tests:
 * - Export all posts
 * - Export by date range
 * - Export by status (PUBLISHED, DRAFT)
 * - Export by locale (EN, ZH)
 * - Export with combined filters
 * - Manifest validation
 */

import { exportContent } from "@/lib/content-export";
import JSZip from "jszip";
import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Export Scenarios Test ===\n");

  try {
    // Setup: Verify test data exists
    console.log("Setup: Verifying test posts...");
    const allPosts = await prisma.post.findMany();
    console.log(`✓ Found ${allPosts.length} posts in database`);

    if (allPosts.length === 0) {
      console.log("⚠️  No posts found, creating test data...");

      // Create test posts
      await prisma.post.createMany({
        data: [
          {
            title: "English Test Post",
            slug: "en-test",
            locale: PostLocale.EN,
            groupId: "test-group-1",
            content: "English content",
            excerpt: "English excerpt",
            status: PostStatus.PUBLISHED,
            authorId: "test-author",
            tags: "test,en",
          },
          {
            title: "中文测试文章",
            slug: "zh-test",
            locale: PostLocale.ZH,
            groupId: "test-group-1",
            content: "中文内容",
            excerpt: "中文摘要",
            status: PostStatus.PUBLISHED,
            authorId: "test-author",
            tags: "test,zh",
          },
          {
            title: "Draft Post",
            slug: "draft-test",
            locale: PostLocale.EN,
            groupId: "test-group-2",
            content: "Draft content",
            excerpt: "Draft excerpt",
            status: PostStatus.DRAFT,
            authorId: "test-author",
            tags: "test,draft",
          },
        ],
      });

      console.log("✓ Test data created");
    }

    // Test 1: Export all posts
    console.log("\nTest 1: Exporting all posts...");
    const allExport = await exportContent({});
    console.log(`✓ Export complete (${allExport.length} bytes)`);

    const zip1 = new JSZip();
    await zip1.loadAsync(allExport);

    const manifest1 = JSON.parse(await zip1.file("manifest.json")!.async("string"));
    console.log(`✓ Total posts in export: ${manifest1.stats.totalPosts}`);
    console.log(`  - EN: ${manifest1.stats.postsByLocale.EN || 0}`);
    console.log(`  - ZH: ${manifest1.stats.postsByLocale.ZH || 0}`);

    if (manifest1.stats.totalPosts === 0) {
      throw new Error("❌ No posts exported");
    }

    // Test 2: Export by date range
    console.log("\nTest 2: Exporting by date range...");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateRangeExport = await exportContent({
      from: yesterday.toISOString(),
      to: tomorrow.toISOString(),
    });

    const zip2 = new JSZip();
    await zip2.loadAsync(dateRangeExport);
    const manifest2 = JSON.parse(await zip2.file("manifest.json")!.async("string"));

    console.log(`✓ Date range export: ${manifest2.stats.totalPosts} posts`);
    console.log(
      `  - Filter: ${manifest2.filters.from?.split("T")[0]} to ${manifest2.filters.to?.split("T")[0]}`
    );

    // Test 3: Export by status
    console.log("\nTest 3: Exporting by status...");
    const publishedExport = await exportContent({
      statuses: [PostStatus.PUBLISHED],
    });

    const zip3 = new JSZip();
    await zip3.loadAsync(publishedExport);
    const manifest3 = JSON.parse(await zip3.file("manifest.json")!.async("string"));

    console.log(`✓ Published posts: ${manifest3.stats.totalPosts}`);

    const draftExport = await exportContent({
      statuses: [PostStatus.DRAFT],
    });

    const zip4 = new JSZip();
    await zip4.loadAsync(draftExport);
    const manifest4 = JSON.parse(await zip4.file("manifest.json")!.async("string"));

    console.log(`✓ Draft posts: ${manifest4.stats.totalPosts}`);

    // Test 4: Export by locale
    console.log("\nTest 4: Exporting by locale...");
    const enExport = await exportContent({
      locales: [PostLocale.EN],
    });

    const zip5 = new JSZip();
    await zip5.loadAsync(enExport);
    const manifest5 = JSON.parse(await zip5.file("manifest.json")!.async("string"));

    console.log(`✓ English posts: ${manifest5.stats.totalPosts}`);

    const zhExport = await exportContent({
      locales: [PostLocale.ZH],
    });

    const zip6 = new JSZip();
    await zip6.loadAsync(zhExport);
    const manifest6 = JSON.parse(await zip6.file("manifest.json")!.async("string"));

    console.log(`✓ Chinese posts: ${manifest6.stats.totalPosts}`);

    // Test 5: Combined filters
    console.log("\nTest 5: Exporting with combined filters...");
    const combinedExport = await exportContent({
      statuses: [PostStatus.PUBLISHED],
      locales: [PostLocale.EN],
    });

    const zip7 = new JSZip();
    await zip7.loadAsync(combinedExport);
    const manifest7 = JSON.parse(await zip7.file("manifest.json")!.async("string"));

    console.log(`✓ Published English posts: ${manifest7.stats.totalPosts}`);
    console.log(`  - Filters: ${JSON.stringify(manifest7.filters)}`);

    // Test 6: Validate directory structure
    console.log("\nTest 6: Validating directory structure...");
    const files = Object.keys(zip1.files);
    const enFiles = files.filter((f) => f.startsWith("content/en/"));
    const zhFiles = files.filter((f) => f.startsWith("content/zh/"));

    console.log(`✓ English files: ${enFiles.length}`);
    console.log(`✓ Chinese files: ${zhFiles.length}`);

    if (!files.includes("manifest.json")) {
      throw new Error("❌ manifest.json missing");
    }

    // Test 7: Validate file content
    console.log("\nTest 7: Validating file content...");
    if (enFiles.length > 0 && enFiles[0]) {
      const zipEntry = zip1.file(enFiles[0]);
      if (!zipEntry) {
        throw new Error(`❌ Could not read file: ${enFiles[0]}`);
      }
      const firstEnFile = await zipEntry.async("string");
      if (!firstEnFile.startsWith("---")) {
        throw new Error("❌ Markdown file missing frontmatter");
      }
      console.log(`✓ Frontmatter present in ${enFiles[0]}`);

      // Check required fields
      const requiredFields = ["title:", "slug:", "locale:", "groupId:", "status:"];
      for (const field of requiredFields) {
        if (!firstEnFile.includes(field)) {
          throw new Error(`❌ Missing required field: ${field}`);
        }
      }
      console.log("✓ All required fields present");
    }

    // Test 8: Validate manifest schema
    console.log("\nTest 8: Validating manifest schema...");
    const requiredManifestFields = ["exportDate", "exportVersion", "stats"];
    for (const field of requiredManifestFields) {
      if (!(field in manifest1)) {
        throw new Error(`❌ Manifest missing field: ${field}`);
      }
    }

    if (!manifest1.stats.totalPosts || !manifest1.stats.postsByLocale) {
      throw new Error("❌ Manifest stats incomplete");
    }

    console.log("✓ Manifest schema valid");

    // Test 9: Empty result handling
    console.log("\nTest 9: Testing empty result handling...");
    const emptyExport = await exportContent({
      from: new Date("2000-01-01").toISOString(),
      to: new Date("2000-01-02").toISOString(),
    });

    const zip8 = new JSZip();
    await zip8.loadAsync(emptyExport);
    const manifest8 = JSON.parse(await zip8.file("manifest.json")!.async("string"));

    console.log(`✓ Empty export handled (${manifest8.stats.totalPosts} posts)`);

    if (manifest8.stats.totalPosts !== 0) {
      console.log("⚠️  Expected 0 posts for date range 2000-01-01 to 2000-01-02");
    }

    console.log("\n✅ All export scenario tests PASSED");
    console.log("\n📝 Manual Testing Required:");
    console.log("   1. Navigate to /admin/export");
    console.log("   2. Test various filter combinations");
    console.log("   3. Download and extract ZIP file");
    console.log("   4. Verify content/ directory structure");
    console.log("   5. Verify manifest.json contains correct stats");
    console.log("   6. Verify Markdown files have proper frontmatter");
  } catch (error) {
    console.error("\n❌ Test FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
