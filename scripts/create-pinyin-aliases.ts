#!/usr/bin/env tsx
/**
 * Create pinyin aliases for Chinese post slugs
 *
 * This script:
 * 1. Finds all posts with Chinese characters in slug
 * 2. Generates pinyin slugs using same logic as middleware
 * 3. Creates PostAlias entries for seamless slug lookup
 *
 * Usage: npx tsx scripts/create-pinyin-aliases.ts
 */

import prisma from "../src/lib/prisma";
import { pinyin } from "pinyin-pro";
import { PostLocale } from "@prisma/client";

async function createPinyinAliases() {
  console.log("🔍 Finding posts with Chinese slugs...\n");

  // Find all posts
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      slug: true,
      locale: true,
      title: true,
    },
  });

  const chineseSlugPosts = posts.filter((post) => /[\u4e00-\u9fa5]/.test(post.slug));

  console.log(`Found ${chineseSlugPosts.length} posts with Chinese characters in slug:\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of chineseSlugPosts) {
    console.log(`📝 ${post.title}`);
    console.log(`   Original slug: ${post.slug}`);

    try {
      // Generate pinyin slug using same logic as middleware
      let pinyinSlug = post.slug;
      try {
        pinyinSlug =
          (pinyin(post.slug, { toneType: "none", type: "string", v: true }) as string) || post.slug;
      } catch {
        pinyinSlug = post.slug;
      }

      // Normalize slug (same as middleware)
      const normalized = pinyinSlug
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      console.log(`   Pinyin slug:   ${normalized}`);

      // Check if alias already exists
      const existing = await prisma.postAlias.findUnique({
        where: {
          locale_oldSlug: {
            locale: post.locale,
            oldSlug: normalized,
          },
        },
      });

      if (existing) {
        console.log(`   ⏭️  Alias already exists, skipping\n`);
        skipped++;
        continue;
      }

      // Create alias
      await prisma.postAlias.create({
        data: {
          locale: post.locale,
          oldSlug: normalized,
          postId: post.id,
        },
      });

      console.log(`   ✅ Created alias: ${normalized} → ${post.slug}\n`);
      created++;
    } catch (error) {
      console.log(`   ❌ Error: ${error}\n`);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log(`   ✅ Created:  ${created} aliases`);
  console.log(`   ⏭️  Skipped:  ${skipped} (already exist)`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log("=".repeat(60) + "\n");

  await prisma.$disconnect();
}

// Run the script
createPinyinAliases().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
