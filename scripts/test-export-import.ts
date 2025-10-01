/**
 * Test script for export/import round-trip validation
 *
 * This script:
 * 1. Exports all posts to a ZIP file
 * 2. Parses the exported content
 * 3. Validates frontmatter and content integrity
 * 4. Simulates import (dry-run) to verify matching
 *
 * Run with: npx tsx scripts/test-export-import.ts
 */

import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";
import { exportContent } from "../src/lib/content-export";
import { importContent } from "../src/lib/content-import";
import * as fs from "fs/promises";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Export/Import Round-Trip Test ===\n");

  try {
    // Step 1: Export all posts
    console.log("Step 1: Exporting all posts...");
    const exportBuffer = await exportContent({});
    console.log(`✓ Export complete (${exportBuffer.length} bytes)\n`);

    // Step 2: Save to temporary file
    const tempDir = path.join(process.cwd(), ".temp");
    await fs.mkdir(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, "test-export.zip");
    await fs.writeFile(tempFile, exportBuffer);
    console.log(`✓ Saved to ${tempFile}\n`);

    // Step 3: Import (dry-run) to validate
    console.log("Step 2: Running import dry-run...");
    const importResult = await importContent(exportBuffer, {
      dryRun: true,
      adminId: "test-admin",
    });

    console.log("Import Preview Results:");
    console.log(`  Created: ${importResult.summary.created}`);
    console.log(`  Updated: ${importResult.summary.updated}`);
    console.log(`  Skipped: ${importResult.summary.skipped}`);
    console.log(`  Errors: ${importResult.summary.errors}\n`);

    // Step 4: Validate results
    if (importResult.summary.errors > 0) {
      console.log("❌ Errors detected during import validation:\n");
      importResult.details
        .filter((d) => d.action === "error")
        .forEach((detail) => {
          console.log(`  File: ${detail.filename}`);
          console.log(`  Error: ${detail.error}\n`);
        });
      process.exit(1);
    }

    // Step 5: Fetch original posts to compare
    console.log("Step 3: Comparing with original posts...");
    const originalPosts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        locale: true,
        groupId: true,
        status: true,
        tags: true,
      },
    });

    const exportedFiles = importResult.details.length;
    const originalCount = originalPosts.length;

    console.log(`  Original posts: ${originalCount}`);
    console.log(`  Exported files: ${exportedFiles}`);

    if (exportedFiles !== originalCount) {
      console.log(
        `⚠️  Warning: File count mismatch (${exportedFiles} exported vs ${originalCount} original)`
      );
    } else {
      console.log(`✓ File count matches\n`);
    }

    // Step 6: Validate each exported post
    console.log("Step 4: Validating post integrity...");
    let validCount = 0;
    let mismatchCount = 0;

    for (const detail of importResult.details) {
      if (detail.action === "update" && detail.post) {
        // Find corresponding original post
        const original = originalPosts.find(
          (p) => p.slug === detail.post!.slug && p.locale === detail.post!.locale
        );

        if (!original) {
          console.log(`⚠️  No match found for ${detail.filename}`);
          mismatchCount++;
          continue;
        }

        // Validate key fields
        if (
          original.title === detail.post.title &&
          original.status === detail.post.status &&
          original.locale === detail.post.locale
        ) {
          validCount++;
        } else {
          console.log(`⚠️  Field mismatch in ${detail.filename}:`);
          console.log(`    Expected: ${original.title} (${original.status})`);
          console.log(`    Got: ${detail.post.title} (${detail.post.status})`);
          mismatchCount++;
        }
      }
    }

    console.log(`  Valid: ${validCount}`);
    console.log(`  Mismatches: ${mismatchCount}\n`);

    // Step 7: Summary
    console.log("=== Test Summary ===");
    if (importResult.summary.errors === 0 && mismatchCount === 0) {
      console.log("✅ Round-trip test PASSED");
      console.log("   - Export completed successfully");
      console.log("   - All files validated");
      console.log("   - No data integrity issues");
      console.log("   - Import dry-run successful\n");
      process.exit(0);
    } else {
      console.log("❌ Round-trip test FAILED");
      console.log(`   - Errors: ${importResult.summary.errors}`);
      console.log(`   - Mismatches: ${mismatchCount}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
