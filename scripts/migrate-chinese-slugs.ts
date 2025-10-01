#!/usr/bin/env tsx
/**
 * Migrate Chinese slugs to pinyin
 *
 * Usage: tsx scripts/migrate-chinese-slugs.ts [--dry-run]
 */

import { PrismaClient, PostLocale } from "@prisma/client";
import { pinyin } from "pinyin-pro";

const prisma = new PrismaClient();

/**
 * Check if slug contains Chinese characters
 */
function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Convert Chinese text to pinyin slug
 * - Tone-less
 * - Lowercase
 * - ASCII only
 * - Hyphen-separated
 */
function toPinyinSlug(text: string): string {
  const pinyinText = pinyin(text, {
    toneType: "none", // No tone marks
    separator: "-",
  });

  return pinyinText
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace non-ASCII with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug by adding suffix if duplicate exists
 */
async function generateUniqueSlug(
  baseSlug: string,
  locale: PostLocale,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        locale,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log(`🚀 Starting Chinese slug migration ${isDryRun ? "(DRY RUN)" : ""}`);
  console.log("=".repeat(60));

  // Find all posts with Chinese characters in slug
  const allPosts = await prisma.post.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      locale: true,
    },
  });

  const postsToMigrate = allPosts.filter((post) => hasChinese(post.slug));

  console.log(`📊 Total posts: ${allPosts.length}`);
  console.log(`🔍 Posts with Chinese slugs: ${postsToMigrate.length}\n`);

  if (postsToMigrate.length === 0) {
    console.log("✅ No posts need migration");
    return;
  }

  let migratedCount = 0;
  const migrations: Array<{
    id: string;
    oldSlug: string;
    newSlug: string;
    title: string;
    locale: PostLocale;
  }> = [];

  for (const post of postsToMigrate) {
    const oldSlug = post.slug;

    // Generate pinyin slug from title or existing slug
    const baseSlug = toPinyinSlug(post.title || post.slug);
    const newSlug = await generateUniqueSlug(baseSlug, post.locale, post.id);

    console.log(`📝 Post: ${post.title}`);
    console.log(`   Locale: ${post.locale}`);
    console.log(`   Old slug: ${oldSlug}`);
    console.log(`   New slug: ${newSlug}`);

    migrations.push({
      id: post.id,
      oldSlug,
      newSlug,
      title: post.title,
      locale: post.locale,
    });

    if (!isDryRun) {
      // Update post slug
      await prisma.post.update({
        where: { id: post.id },
        data: { slug: newSlug },
      });

      // Create alias for old slug
      await prisma.postAlias.create({
        data: {
          locale: post.locale,
          oldSlug,
          postId: post.id,
        },
      });

      migratedCount++;
      console.log(`   Status: ✅ MIGRATED + ALIAS CREATED\n`);
    } else {
      console.log(`   Status: WOULD MIGRATE + CREATE ALIAS\n`);
    }
  }

  console.log("=".repeat(60));

  if (isDryRun) {
    console.log(`🔍 DRY RUN COMPLETE`);
    console.log(`   Would migrate ${migrations.length} posts`);
    console.log(`\nRun without --dry-run to apply changes`);
  } else {
    console.log(`✅ MIGRATION COMPLETE`);
    console.log(`   Migrated ${migratedCount} posts`);
    console.log(`   Created ${migratedCount} aliases for 301 redirects`);

    // Verify aliases
    const aliasCount = await prisma.postAlias.count();
    console.log(`\n📊 Total aliases in database: ${aliasCount}`);
  }

  if (migrations.length > 0) {
    console.log(`\n📋 Migration Summary:`);
    migrations.forEach((m) => {
      console.log(`   ${m.locale} | ${m.oldSlug} → ${m.newSlug}`);
    });
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
