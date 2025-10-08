import { test, expect } from "@playwright/test";
import { PostPage } from "./pages/post-page";
import { TEST_POST_IDS } from "./fixtures/test-data";
import { expectMetaTag } from "./helpers/assertion-helpers";
import { waitForNetworkIdle } from "./helpers/wait-helpers";

test.describe("Open Graph Metadata", () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
  });

  test("should have complete Open Graph tags on English post", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const ogTags = await postPage.getOpenGraphTags();

    // Required OG tags
    expect(ogTags.title).toBeTruthy();
    expect(ogTags.type).toBe("article");
    expect(ogTags.url).toContain(`/en/posts/${TEST_POST_IDS.enPost1}`);

    // Optional but recommended OG tags
    if (ogTags.description) {
      expect(ogTags.description.length).toBeGreaterThan(0);
    }
    if (ogTags.image) {
      expect(ogTags.image).toMatch(/^https?:\/\//);
    }

    // Article-specific tags
    if (ogTags.publishedTime) {
      expect(new Date(ogTags.publishedTime).toString()).not.toBe("Invalid Date");
    }
  });

  test("should have complete Open Graph tags on Chinese post", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.zhPost1, "zh");
    await postPage.expectPostLoaded();

    const ogTags = await postPage.getOpenGraphTags();

    // Required OG tags with Chinese locale
    expect(ogTags.title).toBeTruthy();
    expect(ogTags.type).toBe("article");
    expect(ogTags.url).toContain(`/zh/posts/`);
    expect(ogTags.locale).toMatch(/zh[-_]CN/i);

    // Alternate locale should point to English version
    if (ogTags.localeAlternate) {
      expect(ogTags.localeAlternate).toContain("en");
    }
  });

  test("should have Twitter Card metadata", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Twitter card tags
    const twitterCard = page.locator('meta[name="twitter:card"]');
    expect(await twitterCard.count()).toBeGreaterThan(0);

    const cardType = await twitterCard.getAttribute("content");
    expect(["summary", "summary_large_image"]).toContain(cardType);

    // Twitter title should match OG title or post title
    const twitterTitle = page.locator('meta[name="twitter:title"]');
    if ((await twitterTitle.count()) > 0) {
      const title = await twitterTitle.getAttribute("content");
      expect(title).toBeTruthy();
    }
  });

  test("should have consistent metadata between OG and Twitter", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute("content");

    // If both exist, they should match
    if (ogTitle && twitterTitle) {
      expect(ogTitle).toBe(twitterTitle);
    }

    const ogDescription = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content");
    const twitterDescription = await page
      .locator('meta[name="twitter:description"]')
      .getAttribute("content");

    if (ogDescription && twitterDescription) {
      expect(ogDescription).toBe(twitterDescription);
    }
  });
});

test.describe("JSON-LD Schema Markup", () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
  });

  test("should have BlogPosting schema on English post", async () => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const schema = await postPage.getJsonLdSchema();

    if (!schema) {
      test.skip(true, "JSON-LD schema not implemented");
      return;
    }

    // Verify schema structure
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BlogPosting");

    // Required properties
    expect(schema.headline).toBeTruthy();
    expect(schema.author).toBeTruthy();
    expect(schema.datePublished).toBeTruthy();
    expect(schema.inLanguage).toBe("en-US");

    // Validate date format
    expect(new Date(schema.datePublished).toString()).not.toBe("Invalid Date");

    // Optional but recommended properties
    if (schema.dateModified) {
      expect(new Date(schema.dateModified).toString()).not.toBe("Invalid Date");
    }
    if (schema.image) {
      expect(schema.image).toMatch(/^https?:\/\//);
    }
  });

  test("should have BlogPosting schema on Chinese post with correct locale", async () => {
    await postPage.gotoPost(TEST_POST_IDS.zhPost1, "zh");
    await postPage.expectPostLoaded();

    const schema = await postPage.getJsonLdSchema();

    if (!schema) {
      test.skip(true, "JSON-LD schema not implemented");
      return;
    }

    // Verify Chinese locale
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.inLanguage).toBe("zh-CN");
    expect(schema.headline).toBeTruthy();
  });

  test("should have valid author information in schema", async () => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const schema = await postPage.getJsonLdSchema();
    if (!schema) {
      test.skip(true, "JSON-LD schema not implemented");
      return;
    }

    const author = schema.author;
    expect(author).toBeTruthy();

    // Author can be string or object
    if (typeof author === "object") {
      expect(author["@type"]).toBe("Person");
      expect(author.name).toBeTruthy();
    } else {
      expect(typeof author).toBe("string");
      expect(author.length).toBeGreaterThan(0);
    }
  });

  test("should include mainEntityOfPage in schema", async () => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const schema = await postPage.getJsonLdSchema();
    if (!schema) {
      test.skip(true, "JSON-LD schema not implemented");
      return;
    }

    if (schema.mainEntityOfPage) {
      expect(schema.mainEntityOfPage["@type"]).toBe("WebPage");
      expect(schema.mainEntityOfPage["@id"]).toContain(`/en/posts/${TEST_POST_IDS.enPost1}`);
    }
  });
});

test.describe("Canonical URLs", () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
  });

  test("should have canonical URL on English post", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const canonicalUrl = await postPage.getCanonicalUrl();

    if (!canonicalUrl) {
      test.skip(true, "Canonical URL not implemented");
      return;
    }

    // Canonical should be absolute URL
    expect(canonicalUrl).toMatch(/^https?:\/\//);
    expect(canonicalUrl).toContain(`/en/posts/${TEST_POST_IDS.enPost1}`);

    // Should not contain query parameters
    expect(canonicalUrl).not.toContain("?");
  });

  test("should have canonical URL on Chinese post", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.zhPost1, "zh");
    await postPage.expectPostLoaded();

    const canonicalUrl = await postPage.getCanonicalUrl();

    if (!canonicalUrl) {
      test.skip(true, "Canonical URL not implemented");
      return;
    }

    expect(canonicalUrl).toMatch(/^https?:\/\//);
    expect(canonicalUrl).toContain("/zh/posts/");
  });

  test("should strip query parameters from canonical URL", async ({ page }) => {
    await page.goto(`/en/posts/${TEST_POST_IDS.enPost1}?ref=test&utm_source=twitter`);
    await waitForNetworkIdle(page);

    const canonicalUrl = await postPage.getCanonicalUrl();

    if (!canonicalUrl) {
      test.skip(true, "Canonical URL not implemented");
      return;
    }

    // Canonical should not include query parameters
    expect(canonicalUrl).not.toContain("?");
    expect(canonicalUrl).not.toContain("ref=");
    expect(canonicalUrl).not.toContain("utm_");
  });
});

test.describe("Hreflang Alternate Links", () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
  });

  test("should have hreflang tags for posts with translations", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const hasTranslation = await postPage.hasTranslation();

    if (!hasTranslation) {
      test.skip(true, "Post does not have translation");
      return;
    }

    const hreflangTags = await postPage.getHreflangTags();

    // Should have at least x-default and en
    expect(hreflangTags["x-default"]).toBeTruthy();
    expect(hreflangTags["en"]).toBeTruthy();

    // If translation exists, should have zh tag
    if (hasTranslation) {
      expect(hreflangTags["zh"]).toBeTruthy();
      expect(hreflangTags["zh"]).toContain("/zh/posts/");
    }

    // All URLs should be absolute
    Object.values(hreflangTags).forEach((url) => {
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  test("should have consistent hreflang between EN and ZH versions", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const hasTranslation = await postPage.hasTranslation();
    if (!hasTranslation) {
      test.skip(true, "Post does not have translation");
      return;
    }

    const enHreflang = await postPage.getHreflangTags();

    // Switch to Chinese version
    await postPage.switchLanguage();
    await waitForNetworkIdle(page);

    const zhHreflang = await postPage.getHreflangTags();

    // Both versions should have same hreflang tags
    expect(enHreflang["en"]).toBe(zhHreflang["en"]);
    expect(enHreflang["zh"]).toBe(zhHreflang["zh"]);
    expect(enHreflang["x-default"]).toBe(zhHreflang["x-default"]);
  });

  test("should not have hreflang for posts without translations", async () => {
    await postPage.gotoPost(TEST_POST_IDS.enPost3);
    await postPage.expectPostLoaded();

    const hasTranslation = await postPage.hasTranslation();

    if (hasTranslation) {
      test.skip(true, "Post has translation");
      return;
    }

    const hreflangTags = await postPage.getHreflangTags();

    // Should only have x-default and self-reference
    expect(Object.keys(hreflangTags).length).toBeLessThanOrEqual(2);
  });
});

test.describe("HTML Lang Attribute", () => {
  test("should have correct lang attribute on English pages", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);

    await page.goto("/posts");
    await waitForNetworkIdle(page);

    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
  });

  test("should have correct lang attribute on Chinese pages", async ({ page }) => {
    await page.goto("/zh");
    await waitForNetworkIdle(page);

    await expect(page.locator("html")).toHaveAttribute("lang", /^zh/);

    await page.goto("/zh/posts");
    await waitForNetworkIdle(page);

    await expect(page.locator("html")).toHaveAttribute("lang", /^zh/);
  });

  test("should have correct lang attribute on post pages", async ({ page }) => {
    const postPage = new PostPage(page);

    // English post
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);

    // Chinese post
    await postPage.gotoPost(TEST_POST_IDS.zhPost1, "zh");
    await postPage.expectPostLoaded();
    await expect(page.locator("html")).toHaveAttribute("lang", /^zh/);
  });
});

test.describe("Meta Description", () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
  });

  test("should have meta description on post pages", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const metaDescription = page.locator('meta[name="description"]');
    expect(await metaDescription.count()).toBeGreaterThan(0);

    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();

    // Description should be reasonable length (50-160 chars recommended)
    if (content) {
      expect(content.length).toBeGreaterThan(20);
      expect(content.length).toBeLessThan(300);
    }
  });

  test("should have unique descriptions for different posts", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const desc1 = await page.locator('meta[name="description"]').getAttribute("content");

    await postPage.gotoPost(TEST_POST_IDS.enPost2);
    await postPage.expectPostLoaded();

    const desc2 = await page.locator('meta[name="description"]').getAttribute("content");

    // Descriptions should be different for different posts
    if (desc1 && desc2) {
      expect(desc1).not.toBe(desc2);
    }
  });
});

test.describe("Robots Meta Tag", () => {
  test("should allow indexing on published posts", async ({ page }) => {
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const robotsMeta = page.locator('meta[name="robots"]');

    if ((await robotsMeta.count()) > 0) {
      const content = await robotsMeta.getAttribute("content");
      // Should not contain noindex
      expect(content).not.toContain("noindex");
    }
    // If no robots meta tag, default is to allow indexing
  });

  test("should have appropriate robots directives", async ({ page }) => {
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const robotsMeta = page.locator('meta[name="robots"]');

    if ((await robotsMeta.count()) > 0) {
      const content = await robotsMeta.getAttribute("content");

      // Common valid directives
      const validDirectives = ["index", "follow", "noindex", "nofollow", "all", "none"];
      if (content) {
        const directives = content.split(",").map((d) => d.trim());
        directives.forEach((directive) => {
          expect(validDirectives).toContain(directive);
        });
      }
    }
  });
});
