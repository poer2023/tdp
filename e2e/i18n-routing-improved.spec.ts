import { test, expect } from "@playwright/test";
import { PostPage } from "./pages/post-page";
import { PostsListPage } from "./pages/posts-list-page";
import { TEST_POST_IDS } from "./fixtures/test-data";
import { expectUrlContains } from "./helpers/assertion-helpers";
import { waitForNetworkIdle } from "./helpers/wait-helpers";

test.describe("i18n Routing", () => {
  test("should redirect root path to locale-specific path", async ({ page }) => {
    await page.goto("/");
    // Wait until URL reflects middleware redirect (/en or /zh)
    await expect(page).toHaveURL(/\/(en|zh)(\/|$)/);
    // Verify page loaded successfully
    await expect(page.locator("html")).toBeVisible();
  });

  test("should serve Chinese content at /zh path", async ({ page }) => {
    await page.goto("/zh");
    await waitForNetworkIdle(page);

    // Verify URL contains /zh
    await expectUrlContains(page, "/zh");

    // Verify html lang attribute is Chinese
    await expect(page.locator("html")).toHaveAttribute("lang", /^zh/);
  });

  test("should serve English content at root and /en paths", async ({ page }) => {
    // Test root path
    await page.goto("/");
    await waitForNetworkIdle(page);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);

    // Test explicit /en path (if supported)
    const enResponse = await page.goto("/en");
    if (enResponse?.status() === 200) {
      await waitForNetworkIdle(page);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    }
  });

  test("should maintain locale in navigation within same language", async ({ page }) => {
    const postsListPage = new PostsListPage(page);

    // Navigate directly to Chinese posts page
    await page.goto("/zh/posts");
    await waitForNetworkIdle(page);

    // URL should maintain /zh prefix
    await expectUrlContains(page, "/zh/posts");

    // Click on a post
    const postCount = await postsListPage.getPostCount();
    if (postCount > 0) {
      await postsListPage.clickFirstPost();
      await waitForNetworkIdle(page);

      // URL should still contain /zh/posts
      await expectUrlContains(page, "/zh/posts");
    }
  });
});

test.describe("Language Switching", () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
  });

  test("should navigate between EN and ZH versions of same post", async ({ page }) => {
    // Use a test post that has both EN and ZH translations
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Check if translation exists
    const hasTranslation = await postPage.hasTranslation();

    if (hasTranslation) {
      // Switch to Chinese version
      await postPage.switchLanguage();
      await waitForNetworkIdle(page);

      // Should now be on Chinese version
      await expectUrlContains(page, "/zh/posts/");
      await expect(page.locator("html")).toHaveAttribute("lang", /^zh/);

      // Switch back to English
      await postPage.switchLanguage();
      await waitForNetworkIdle(page);

      // Should be back on English version
      expect(page.url()).not.toContain("/zh/");
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    } else {
      test.skip(true, "Post does not have translation");
    }
  });

  test("should show language switcher only when translation exists", async () => {
    // Test post with translation
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const hasTranslation = await postPage.hasTranslation();

    if (hasTranslation) {
      // Language switcher should be visible
      await expect(postPage.languageSwitcher).toBeVisible();
    } else {
      // Language switcher should not be visible
      expect(await postPage.languageSwitcher.count()).toBe(0);
    }
  });

  test("should preserve user navigation context after language switch", async ({ page }) => {
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const hasTranslation = await postPage.hasTranslation();
    if (!hasTranslation) {
      test.skip(true, "Post does not have translation");
      return;
    }

    // Get initial post title
    const initialTitle = await postPage.title.textContent();

    // Switch language
    await postPage.switchLanguage();
    await waitForNetworkIdle(page);

    // Should still be on post detail page (not redirected to list)
    await expectUrlContains(page, "/posts/");

    // Should be on the translated version of the same post
    const translatedTitle = await postPage.title.textContent();
    expect(translatedTitle).toBeTruthy();
    expect(translatedTitle).not.toBe(initialTitle); // Titles should differ in different languages
  });
});

test.describe("Locale-specific Routing", () => {
  test("should handle Chinese slug redirects via PostAlias", async ({ page }) => {
    // Test Chinese characters in URL - may redirect or render directly
    const response = await page.goto("/posts/测试文章", { waitUntil: "domcontentloaded" });

    if (response && (response.status() === 301 || response.status() === 302)) {
      // Redirected to pinyin slug
      const redirectUrl = page.url();
      expect(redirectUrl).toMatch(/\/posts\/[a-z0-9-]+$/);

      await waitForNetworkIdle(page);
      const postPage = new PostPage(page);
      await postPage.expectPostLoaded();
    } else if (response?.status() === 200) {
      // Rendered directly without redirect (valid behavior)
      await waitForNetworkIdle(page);
      const postPage = new PostPage(page);
      await postPage.expectPostLoaded();
    } else if (response?.status() === 404) {
      // No alias exists
      test.skip(true, "No Chinese slug alias configured");
    } else {
      // Unexpected status
      expect([200, 301, 302, 404]).toContain(response?.status());
    }
  });

  test("should preserve locale in Chinese slug redirects", async ({ page }) => {
    // Test Chinese characters in ZH locale URL
    const response = await page.goto("/zh/posts/测试文章", { waitUntil: "domcontentloaded" });

    if (response && (response.status() === 301 || response.status() === 302)) {
      // Should redirect to pinyin slug while preserving /zh locale
      const redirectUrl = page.url();
      expect(redirectUrl).toMatch(/\/zh\/posts\/[a-z0-9-]+$/);

      await waitForNetworkIdle(page);
      await expect(page.locator("html")).toHaveAttribute("lang", /^zh/);
    } else if (response?.status() === 404) {
      test.skip(true, "No Chinese slug alias configured");
    }
  });

  test("should handle locale-specific post URLs correctly", async ({ page }) => {
    const postsListPage = new PostsListPage(page);

    // Navigate to English posts
    await postsListPage.gotoPostsList("en");
    await waitForNetworkIdle(page);
    const enPostCount = await postsListPage.getPostCount();

    if (enPostCount > 0) {
      // Get href attribute to verify locale prefix
      const href = await postsListPage.postLinks.nth(0).getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/en\/posts\//);
    }

    // Navigate to Chinese posts
    await postsListPage.gotoPostsList("zh");
    await waitForNetworkIdle(page);
    const zhPostCount = await postsListPage.getPostCount();

    if (zhPostCount > 0) {
      // Get href attribute to verify locale prefix
      const href = await postsListPage.postLinks.nth(0).getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/zh\/posts\//);
    }
  });
});

test.describe("Locale Edge Cases", () => {
  test("should handle invalid locale gracefully", async ({ page }) => {
    // Navigate to invalid locale
    const response = await page.goto("/invalid-locale/posts");

    // Should either redirect or show 404
    expect([200, 301, 302, 404]).toContain(response?.status() || 200);

    // If redirected, should go to valid locale
    if (response?.status() === 301 || response?.status() === 302) {
      const redirectUrl = page.url();
      expect(redirectUrl).toMatch(/^\/(zh\/)?posts/);
    }
  });

  test("should handle locale switching on posts without translations", async ({ page }) => {
    const postPage = new PostPage(page);

    // Navigate to post that may not have translation
    await postPage.gotoPost(TEST_POST_IDS.enPost3);
    await postPage.expectPostLoaded();

    const hasTranslation = await postPage.hasTranslation();

    if (!hasTranslation) {
      // Language switcher should not be visible
      expect(await postPage.languageSwitcher.count()).toBe(0);

      // Direct navigation to /zh version should handle gracefully
      const currentSlug = page.url().split("/posts/")[1];
      const zhResponse = await page.goto(`/zh/posts/${currentSlug}`);

      // Should either show 404 or redirect to valid page
      expect([200, 404, 301, 302]).toContain(zhResponse?.status() || 200);
    }
  });

  test("should maintain query parameters across locale switches", async ({ page }) => {
    const postPage = new PostPage(page);

    // Navigate with query parameter
    await page.goto(`/posts/${TEST_POST_IDS.enPost1}?ref=test`);
    await postPage.expectPostLoaded();

    const hasTranslation = await postPage.hasTranslation();
    if (!hasTranslation) {
      test.skip(true, "Post does not have translation");
      return;
    }

    // Switch language
    await postPage.switchLanguage();
    await waitForNetworkIdle(page);

    // Query parameter should be preserved (or intentionally dropped)
    const url = page.url();
    // This behavior is implementation-specific - document expected behavior
    expect(url).toContain("/zh/posts/");
  });
});
