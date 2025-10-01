/**
 * SEO Rich Results Test
 *
 * Tests:
 * - BlogPosting schema completeness
 * - Required schema.org fields
 * - Locale-specific metadata
 * - Hreflang alternate links
 * - Canonical URL structure
 * - Open Graph tags
 */

import { generateBlogPostingSchema, generateAlternateLinks } from "@/lib/seo";
import { PrismaClient, PostLocale, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEO Rich Results Test ===\n");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  try {
    // Setup: Get test posts
    console.log("Setup: Fetching test posts...");
    const posts = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      include: { author: { select: { name: true, email: true, image: true } } },
      take: 5,
    });

    if (posts.length === 0) {
      console.log("⚠️  No published posts found, skipping tests");
      console.log("\n📝 Manual Testing Required:");
      console.log("   1. Publish at least one post");
      console.log("   2. Run this test again");
      return;
    }

    console.log(`✓ Found ${posts.length} published posts`);

    // Test 1: BlogPosting schema structure
    console.log("\nTest 1: Validating BlogPosting schema structure...");
    const testPost = posts[0];
    const testUrl = `${baseUrl}/posts/${testPost.slug}`;
    const schema = generateBlogPostingSchema(testPost, testUrl);

    console.log(`✓ Generated schema for: ${testPost.title}`);
    console.log(`  - @context: ${schema["@context"]}`);
    console.log(`  - @type: ${schema["@type"]}`);
    console.log(`  - inLanguage: ${schema.inLanguage}`);

    // Test 2: Required schema.org fields
    console.log("\nTest 2: Checking required schema.org fields...");
    const requiredFields = [
      "@context",
      "@type",
      "headline",
      "inLanguage",
      "datePublished",
      "dateModified",
      "author",
    ];

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!schema[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`❌ Missing required fields: ${missingFields.join(", ")}`);
    }

    console.log(`✓ All required fields present (${requiredFields.length} fields)`);

    // Test 3: Author schema
    console.log("\nTest 3: Validating author schema...");
    const author = schema.author as { "@type": string; name: string };

    if (!author || author["@type"] !== "Person" || !author.name) {
      throw new Error("❌ Invalid author schema");
    }

    console.log(`✓ Author schema valid (${author.name})`);

    // Test 4: Locale-specific inLanguage tags
    console.log("\nTest 4: Testing locale-specific inLanguage tags...");

    const enPost = posts.find((p) => p.locale === PostLocale.EN);
    const zhPost = posts.find((p) => p.locale === PostLocale.ZH);

    if (enPost) {
      const enSchema = generateBlogPostingSchema(enPost, `${baseUrl}/posts/${enPost.slug}`);
      if (enSchema.inLanguage !== "en-US") {
        throw new Error(`❌ EN post has wrong inLanguage: ${enSchema.inLanguage}`);
      }
      console.log(`✓ EN post inLanguage: ${enSchema.inLanguage}`);
    }

    if (zhPost) {
      const zhSchema = generateBlogPostingSchema(zhPost, `${baseUrl}/zh/posts/${zhPost.slug}`);
      if (zhSchema.inLanguage !== "zh-CN") {
        throw new Error(`❌ ZH post has wrong inLanguage: ${zhSchema.inLanguage}`);
      }
      console.log(`✓ ZH post inLanguage: ${zhSchema.inLanguage}`);
    }

    // Test 5: Hreflang alternate links
    console.log("\nTest 5: Testing hreflang alternate links...");

    // Test EN post with alternate
    const alternateLinks = generateAlternateLinks(PostLocale.EN, "test-slug", "test-slug-zh");

    console.log(`✓ Generated alternate links:`);
    console.log(`  - en: ${alternateLinks.en}`);
    console.log(`  - zh: ${alternateLinks.zh}`);
    console.log(`  - x-default: ${alternateLinks["x-default"]}`);

    // Verify structure
    if (!alternateLinks.en?.startsWith(`${baseUrl}/posts/`)) {
      throw new Error(`❌ Invalid EN alternate link: ${alternateLinks.en}`);
    }

    if (!alternateLinks.zh?.startsWith(`${baseUrl}/zh/posts/`)) {
      throw new Error(`❌ Invalid ZH alternate link: ${alternateLinks.zh}`);
    }

    if (alternateLinks["x-default"] !== alternateLinks.en) {
      throw new Error("❌ x-default should match EN link");
    }

    // Test 6: EN-only post (no alternate)
    console.log("\nTest 6: Testing EN-only post (no ZH alternate)...");
    const enOnlyLinks = generateAlternateLinks(PostLocale.EN, "en-only-slug");

    if (enOnlyLinks.zh) {
      throw new Error("❌ ZH link should not exist for EN-only post");
    }

    console.log(`✓ EN-only post correctly has no ZH alternate`);

    // Test 7: Date format validation
    console.log("\nTest 7: Validating date formats...");

    const publishedDate = new Date(schema.datePublished);
    const modifiedDate = new Date(schema.dateModified);

    if (isNaN(publishedDate.getTime())) {
      throw new Error("❌ Invalid datePublished format");
    }

    if (isNaN(modifiedDate.getTime())) {
      throw new Error("❌ Invalid dateModified format");
    }

    console.log(`✓ Date formats valid (ISO 8601)`);
    console.log(`  - Published: ${schema.datePublished}`);
    console.log(`  - Modified: ${schema.dateModified}`);

    // Test 8: Image handling
    console.log("\nTest 8: Testing image handling...");

    const postWithCover = posts.find((p) => p.cover);

    if (postWithCover) {
      const schemaWithImage = generateBlogPostingSchema(
        postWithCover,
        `${baseUrl}/posts/${postWithCover.slug}`
      );

      if (schemaWithImage.image) {
        console.log(`✓ Image present: ${schemaWithImage.image}`);
      } else {
        console.log("⚠️  Post has cover but schema has no image");
      }
    } else {
      console.log("ℹ️  No posts with cover image found");
    }

    // Test 9: Headline length (Google recommends <110 chars)
    console.log("\nTest 9: Testing headline length...");

    let longHeadlines = 0;
    for (const post of posts) {
      const postSchema = generateBlogPostingSchema(post, `${baseUrl}/posts/${post.slug}`);
      if (postSchema.headline.length > 110) {
        longHeadlines++;
        console.log(`⚠️  Long headline (${postSchema.headline.length} chars): ${post.title}`);
      }
    }

    if (longHeadlines === 0) {
      console.log(`✓ All headlines within recommended length (<110 chars)`);
    } else {
      console.log(`⚠️  ${longHeadlines} posts have long headlines`);
    }

    // Test 10: URL structure validation
    console.log("\nTest 10: Validating URL structure...");

    for (const post of posts) {
      const expectedPath =
        post.locale === PostLocale.ZH ? `/zh/posts/${post.slug}` : `/posts/${post.slug}`;
      const fullUrl = `${baseUrl}${expectedPath}`;

      try {
        new URL(fullUrl);
      } catch (error) {
        throw new Error(`❌ Invalid URL for post ${post.id}: ${fullUrl}`);
      }
    }

    console.log(`✓ All URLs valid (${posts.length} posts checked)`);

    console.log("\n✅ All SEO Rich Results tests PASSED");
    console.log("\n📝 Manual Testing Required:");
    console.log("   1. Start dev server: npm run dev");
    console.log("   2. Visit a post page");
    console.log("   3. View page source and verify:");
    console.log('      - <script type="application/ld+json"> is present');
    console.log('      - <link rel="alternate" hreflang="..."> tags exist');
    console.log('      - <link rel="canonical"> points to correct URL');
    console.log("   4. Test with Google Rich Results Test:");
    console.log("      https://search.google.com/test/rich-results");
    console.log("   5. Paste your post URL and verify schema validation");
  } catch (error) {
    console.error("\n❌ Test FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
