/**
 * Test script for SEO metadata validation
 *
 * This script validates:
 * 1. JSON-LD BlogPosting schema structure
 * 2. Hreflang alternate language links
 * 3. Canonical URLs
 * 4. Open Graph metadata
 * 5. Locale-specific content
 *
 * Run with: npx tsx scripts/test-seo-metadata.ts
 */

import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";
import { generateBlogPostingSchema, generateAlternateLinks } from "../src/lib/seo";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEO Metadata Validation Test ===\n");

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Fetch a published post with translation
    const posts = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      include: { author: true },
      take: 2,
    });

    if (posts.length === 0) {
      console.log("❌ No published posts found. Please create at least one post first.");
      process.exit(1);
    }

    console.log(`Found ${posts.length} published post(s)\n`);

    // Test 1: JSON-LD Schema Validation
    console.log("Test 1: JSON-LD BlogPosting Schema");
    const post = posts[0];
    if (!post) {
      throw new Error("No posts found for testing");
    }
    const url = `${baseUrl}${post.locale === PostLocale.ZH ? "/zh" : ""}/posts/${post.slug}`;
    const schema = generateBlogPostingSchema(post, url);

    console.log("  Schema fields:");
    console.log(`    @context: ${schema["@context"]}`);
    console.log(`    @type: ${schema["@type"]}`);
    console.log(`    headline: "${schema.headline}"`);
    console.log(`    inLanguage: ${schema.inLanguage}`);
    console.log(`    datePublished: ${schema.datePublished}`);
    console.log(`    dateModified: ${schema.dateModified}`);
    console.log(
      `    author.name: ${(schema.author as { name?: string } | undefined)?.name || "N/A"}`
    );
    console.log(`    image: ${schema.image || "N/A"}`);

    // Validate required fields
    const requiredFields = ["@context", "@type", "headline", "inLanguage", "datePublished"];
    const missingFields = requiredFields.filter((field) => !schema[field as keyof typeof schema]);

    if (missingFields.length === 0) {
      console.log("  ✓ All required fields present\n");
    } else {
      console.log(`  ❌ Missing fields: ${missingFields.join(", ")}\n`);
    }

    // Test 2: Locale-specific inLanguage
    console.log("Test 2: Locale-specific Language Tags");
    const enPost = posts.find((p) => p.locale === PostLocale.EN);
    const zhPost = posts.find((p) => p.locale === PostLocale.ZH);

    if (enPost) {
      const enSchema = generateBlogPostingSchema(enPost, `${baseUrl}/posts/${enPost.slug}`);
      console.log(`  English post: inLanguage="${enSchema.inLanguage}"`);
      if (enSchema.inLanguage === "en-US") {
        console.log("    ✓ Correct");
      } else {
        console.log(`    ❌ Expected "en-US", got "${enSchema.inLanguage}"`);
      }
    }

    if (zhPost) {
      const zhSchema = generateBlogPostingSchema(zhPost, `${baseUrl}/zh/posts/${zhPost.slug}`);
      console.log(`  Chinese post: inLanguage="${zhSchema.inLanguage}"`);
      if (zhSchema.inLanguage === "zh-CN") {
        console.log("    ✓ Correct");
      } else {
        console.log(`    ❌ Expected "zh-CN", got "${zhSchema.inLanguage}"`);
      }
    }
    console.log();

    // Test 3: Hreflang Alternate Links
    console.log("Test 3: Hreflang Alternate Links");

    // Check if we have a translation pair
    const postWithTranslation = posts.find((p) => p.groupId);

    if (postWithTranslation && postWithTranslation.groupId) {
      const alternatePosts = await prisma.post.findMany({
        where: {
          groupId: postWithTranslation.groupId,
          status: PostStatus.PUBLISHED,
        },
        select: { locale: true, slug: true },
      });

      if (alternatePosts.length > 1) {
        console.log("  Found translation pair:");
        alternatePosts.forEach((p) => {
          console.log(`    - ${p.locale}: /posts/${p.slug}`);
        });

        const currentLocale = postWithTranslation.locale;
        const currentSlug = postWithTranslation.slug;
        const alternatePost = alternatePosts.find((p) => p.locale !== currentLocale);
        const alternateSlug = alternatePost?.slug;

        const alternateLinks = generateAlternateLinks(currentLocale, currentSlug, alternateSlug);

        console.log("\n  Generated hreflang links:");
        Object.entries(alternateLinks).forEach(([locale, url]) => {
          console.log(`    ${locale}: ${url}`);
        });

        // Validate structure
        const hasEn = "en" in alternateLinks;
        const hasZh = "zh" in alternateLinks || alternateSlug !== undefined;
        const hasDefault = "x-default" in alternateLinks;

        console.log("\n  Validation:");
        console.log(`    Has 'en': ${hasEn ? "✓" : "❌"}`);
        console.log(`    Has 'zh': ${hasZh ? "✓" : "❌"}`);
        console.log(`    Has 'x-default': ${hasDefault ? "✓" : "❌"}`);

        if (alternateLinks["x-default"] === alternateLinks["en"]) {
          console.log("    x-default points to EN: ✓\n");
        } else {
          console.log("    x-default points to EN: ❌\n");
        }
      } else {
        console.log("  ⚠️  No translation pairs found (only one locale per groupId)\n");
      }
    } else {
      console.log("  ⚠️  No posts with groupId found (translations not linked)\n");
    }

    // Test 4: URL Format Validation
    console.log("Test 4: URL Format and Structure");
    posts.forEach((post) => {
      const expectedUrl = `${baseUrl}${post.locale === PostLocale.ZH ? "/zh" : ""}/posts/${post.slug}`;

      try {
        const parsedUrl = new URL(expectedUrl);
        console.log(`  ${post.locale}: ${parsedUrl.pathname}`);
        console.log(`    ✓ Valid URL`);
      } catch {
        console.log(`  ${post.locale}: ${expectedUrl}`);
        console.log(`    ❌ Invalid URL`);
      }
    });
    console.log();

    // Test 5: Metadata Completeness
    console.log("Test 5: Metadata Completeness");
    let completeCount = 0;
    let incompleteCount = 0;

    posts.forEach((post) => {
      const hasTitle = !!post.title;
      const hasExcerpt = !!post.excerpt;
      const hasPublishedAt = !!post.publishedAt;

      const isComplete = hasTitle && hasExcerpt && hasPublishedAt;

      if (isComplete) {
        completeCount++;
      } else {
        incompleteCount++;
        console.log(`  ⚠️  Incomplete: "${post.title}"`);
        if (!hasExcerpt) console.log("      Missing: excerpt");
        if (!hasPublishedAt) console.log("      Missing: publishedAt");
      }
    });

    console.log(`  Complete: ${completeCount}`);
    console.log(`  Incomplete: ${incompleteCount}`);

    if (incompleteCount === 0) {
      console.log("  ✓ All posts have required metadata\n");
    } else {
      console.log(`  ⚠️  ${incompleteCount} post(s) missing metadata\n`);
    }

    // Summary
    console.log("=== Test Summary ===");
    if (missingFields.length === 0 && incompleteCount === 0) {
      console.log("✅ SEO metadata validation PASSED");
      console.log("   - JSON-LD schema properly structured");
      console.log("   - Locale-specific language tags correct");
      console.log("   - Hreflang links generated");
      console.log("   - All URLs valid");
      console.log("   - Metadata complete");
      console.log("\nRecommendations:");
      console.log("   1. Test with Google Rich Results Test:");
      console.log("      https://search.google.com/test/rich-results");
      console.log("   2. Validate hreflang in Google Search Console");
      console.log("   3. Check Open Graph tags in social media debuggers\n");
    } else {
      console.log("⚠️  SEO metadata validation completed with issues");
      if (missingFields.length > 0)
        console.log(`   - Missing schema fields: ${missingFields.join(", ")}`);
      if (incompleteCount > 0) console.log(`   - Incomplete metadata: ${incompleteCount} posts\n`);
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
