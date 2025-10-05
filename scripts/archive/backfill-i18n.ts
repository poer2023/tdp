#!/usr/bin/env tsx
/**
 * Backfill script to add locale and groupId to existing posts
 *
 * Usage: tsx scripts/backfill-i18n.ts [--dry-run]
 */

import { PrismaClient, PostLocale } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

/**
 * Detect if text contains Chinese characters
 */
function detectChinese(text: string): boolean {
  // Unicode range for CJK Unified Ideographs
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text);
}

/**
 * Detect locale based on post content
 * Priority: title > excerpt > content
 */
function detectLocale(title: string, content: string, excerpt: string): PostLocale {
  // First check title - if title has Chinese, it's likely Chinese
  const titleChineseMatches = title.match(/[\u4e00-\u9fa5]/g);
  const titleChineseCount = titleChineseMatches ? titleChineseMatches.length : 0;
  const titleChineseRatio = title.length > 0 ? titleChineseCount / title.length : 0;

  // If title is >50% Chinese, consider it Chinese
  if (titleChineseRatio > 0.5) {
    return PostLocale.ZH;
  }

  // Check excerpt
  const excerptChineseMatches = excerpt.match(/[\u4e00-\u9fa5]/g);
  const excerptChineseCount = excerptChineseMatches ? excerptChineseMatches.length : 0;
  const excerptChineseRatio = excerpt.length > 0 ? excerptChineseCount / excerpt.length : 0;

  if (excerptChineseRatio > 0.5) {
    return PostLocale.ZH;
  }

  // Finally check combined text (title + excerpt + first 500 chars of content)
  const combinedText = `${title} ${excerpt} ${content.substring(0, 500)}`;
  const chineseMatches = combinedText.match(/[\u4e00-\u9fa5]/g);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;
  const totalChars = combinedText.length;
  const chineseRatio = totalChars > 0 ? chineseCount / totalChars : 0;

  return chineseRatio > 0.2 ? PostLocale.ZH : PostLocale.EN;
}

/**
 * Generate a unique groupId
 */
function generateGroupId(): string {
  return `grp_${randomBytes(12).toString("hex")}`;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log(`🚀 Starting i18n backfill script ${isDryRun ? "(DRY RUN)" : ""}`);
  console.log("=".repeat(60));

  // Fetch all posts that need migration (groupId is null means they need processing)
  const posts = await prisma.post.findMany({
    where: {
      groupId: null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      locale: true,
      groupId: true,
    },
  });

  console.log(`📊 Found ${posts.length} posts to process\n`);

  if (posts.length === 0) {
    console.log("✅ No posts need migration");
    return;
  }

  let updatedCount = 0;
  const updates = [];

  for (const post of posts) {
    const currentLocale = post.locale || PostLocale.EN;
    const detectedLocale = detectLocale(post.title, post.content, post.excerpt);
    const newGroupId = post.groupId || generateGroupId();

    console.log(`📝 Post: ${post.title}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Current locale: ${currentLocale}`);
    console.log(`   Detected locale: ${detectedLocale}`);
    console.log(`   GroupId: ${newGroupId.substring(0, 16)}...`);

    updates.push({
      id: post.id,
      locale: detectedLocale,
      groupId: newGroupId,
    });

    if (!isDryRun) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          locale: detectedLocale,
          groupId: newGroupId,
        },
      });
      updatedCount++;
    }

    console.log(`   Status: ${isDryRun ? "WOULD UPDATE" : "✅ UPDATED"}\n`);
  }

  console.log("=".repeat(60));

  if (isDryRun) {
    console.log(`🔍 DRY RUN COMPLETE`);
    console.log(`   Would update ${updates.length} posts`);
    console.log(`\nRun without --dry-run to apply changes`);
  } else {
    console.log(`✅ MIGRATION COMPLETE`);
    console.log(`   Updated ${updatedCount} posts`);

    // Verify results
    const zhCount = await prisma.post.count({ where: { locale: PostLocale.ZH } });
    const enCount = await prisma.post.count({ where: { locale: PostLocale.EN } });

    console.log(`\n📊 Final Statistics:`);
    console.log(`   Chinese posts: ${zhCount}`);
    console.log(`   English posts: ${enCount}`);
    console.log(`   Total: ${zhCount + enCount}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
