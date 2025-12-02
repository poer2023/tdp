/**
 * Post Page Object
 *
 * Encapsulates all interactions with blog post pages.
 * Provides methods for testing post viewing and likes.
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";
import { waitForNetworkIdle, waitForApiResponse } from "../helpers/wait-helpers";
import { expectVisibleText } from "../helpers/assertion-helpers";

export class PostPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to a specific post
   */
  async gotoPost(slug: string, locale?: "en" | "zh") {
    const path = locale === "zh" ? `/zh/posts/${slug}` : `/en/posts/${slug}`;
    await this.goto(path);
  }

  /**
   * Post content selectors
   */
  get postTitle(): Locator {
    return this.page.locator("h1").first();
  }

  // Backward-compatible alias used by some tests
  get title(): Locator {
    return this.postTitle;
  }

  get postContent(): Locator {
    return this.page.locator("article, [class*='post-content'], [class*='prose']").first();
  }

  get postMeta(): Locator {
    return this.page.locator("[class*='meta'], [class*='post-info']").first();
  }

  /**
   * Language switcher selectors
   */
  get languageSwitcher(): Locator {
    return this.page.locator(".language-switcher");
  }

  get switchToEnglishLink(): Locator {
    return this.page.locator('a[href^="/en/posts/"]').filter({ hasText: /english/i });
  }

  get switchToChineseLink(): Locator {
    return this.page.locator('a[href^="/zh/posts/"]').filter({ hasText: /中文/i });
  }

  /**
   * Check if translation is available
   */
  async hasTranslation(): Promise<boolean> {
    return (await this.languageSwitcher.count()) > 0;
  }

  /**
   * Switch to alternate language
   */
  async switchLanguage() {
    const { waitForNetworkIdle } = await import("../helpers/wait-helpers");

    // Wait for language switcher to be visible
    await this.languageSwitcher.waitFor({ state: "visible", timeout: 5000 });

    const currentUrl = this.page.url();
    let expectedUrlPattern: RegExp;

    if (this.url.includes("/zh/")) {
      // Currently on Chinese, switch to English
      expectedUrlPattern = /\/(en\/)?posts\//; // Either /en/posts/ or /posts/
      const link = this.page.locator(".language-switcher a").filter({ hasText: /english/i });
      await link.waitFor({ state: "visible", timeout: 3000 });

      // Wait for navigation after clicking
      await Promise.all([
        this.page.waitForURL(expectedUrlPattern, { timeout: 5000 }),
        link.click(),
      ]);
    } else {
      // Currently on English, switch to Chinese
      expectedUrlPattern = /\/zh\/posts\//;
      const link = this.page.locator(".language-switcher a").filter({ hasText: /中文/i });
      await link.waitFor({ state: "visible", timeout: 3000 });

      // Wait for navigation after clicking
      await Promise.all([
        this.page.waitForURL(expectedUrlPattern, { timeout: 5000 }),
        link.click(),
      ]);
    }

    await waitForNetworkIdle(this.page);
  }

  /**
   * Like feature selectors and methods
   */
  get likeButton(): Locator {
    // Use data-testid instead of text-based selector since button only shows count initially
    return this.page.locator('button[data-testid="like-button"]');
  }

  async getLikeCount(): Promise<number> {
    const buttonText = await this.likeButton.textContent();
    const match = buttonText?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  async clickLike() {
    const initialCount = await this.getLikeCount();

    // Wait for like API response
    const responsePromise = waitForApiResponse(this.page, /\/api\/posts\/.*\/like/);

    await this.likeButton.click();

    await responsePromise;
    await waitForNetworkIdle(this.page);

    return initialCount;
  }

  async isLikeButtonDisabled(): Promise<boolean> {
    return await this.likeButton.isDisabled();
  }

  // Comments removed: selectors and actions no longer applicable

  /**
   * SEO metadata methods
   */
  async getOpenGraphTags() {
    const title = await this.page.locator('meta[property="og:title"]').getAttribute("content");
    const description = await this.page
      .locator('meta[property="og:description"]')
      .getAttribute("content");
    const type = await this.page.locator('meta[property="og:type"]').getAttribute("content");
    const url = await this.page.locator('meta[property="og:url"]').getAttribute("content");
    const image = await this.page.locator('meta[property="og:image"]').getAttribute("content");
    const locale = await this.page.locator('meta[property="og:locale"]').getAttribute("content");
    // og:locale:alternate is optional - Next.js doesn't generate it by default
    const localeAlternateEl = this.page.locator('meta[property="og:locale:alternate"]').first();
    const localeAlternate =
      (await localeAlternateEl.count()) > 0
        ? await localeAlternateEl.getAttribute("content")
        : null;
    // article:published_time is optional - may not be set
    const publishedTimeEl = this.page.locator('meta[property="article:published_time"]');
    const publishedTime =
      (await publishedTimeEl.count()) > 0 ? await publishedTimeEl.getAttribute("content") : null;

    return { title, description, type, url, image, locale, localeAlternate, publishedTime };
  }

  async getJsonLdSchema() {
    const jsonLdScript = this.page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScript.count();

    if (count === 0) {
      return null;
    }

    const content = await jsonLdScript.first().textContent();
    return content ? JSON.parse(content) : null;
  }

  async getCanonicalUrl(): Promise<string | null> {
    return await this.page.locator('link[rel="canonical"]').getAttribute("href");
  }

  async getHreflangTags() {
    const hreflangLinks = this.page.locator('link[rel="alternate"][hreflang]');
    const count = await hreflangLinks.count();

    const tags: Record<string, string> = {};

    for (let i = 0; i < count; i++) {
      const link = hreflangLinks.nth(i);
      const hreflang = await link.getAttribute("hreflang");
      const href = await link.getAttribute("href");

      if (hreflang && href) {
        tags[hreflang] = href;
      }
    }

    return tags;
  }

  async getHtmlLang(): Promise<string | null> {
    return await this.page.locator("html").getAttribute("lang");
  }

  /**
   * Assertion helpers specific to post pages
   */
  async expectPostLoaded() {
    await expect(this.postTitle).toBeVisible();
    await expect(this.postContent).toBeVisible();
  }

  async expectLikeFeaturePresent() {
    await expect(this.likeButton).toBeVisible();
    const count = await this.getLikeCount();
    expect(count).toBeGreaterThanOrEqual(0);
  }

  async expectCommentSectionPresent() {
    await expect(this.commentsHeading).toBeVisible();
  }

  async expectAuthenticatedCommentForm() {
    await expect(this.commentForm).toBeVisible();
    await expect(this.commentTextarea).toBeVisible();
    await expect(this.submitCommentButton).toBeVisible();
  }

  async expectUnauthenticatedCommentPrompt() {
    await expect(this.signInToCommentPrompt).toBeVisible();
  }
}
