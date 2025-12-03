/**
 * Posts List Page Object
 *
 * Encapsulates interactions with the posts listing page.
 */

import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base-page";
import { PostPage } from "./post-page";

export class PostsListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to posts list
   */
  async gotoPostsList(locale?: "en" | "zh") {
    const path = locale === "zh" ? "/zh/posts" : "/posts";
    await this.goto(path);
  }

  /**
   * Selectors
   */
  get postLinks(): Locator {
    const prefix = this.url.includes("/zh/") ? "/zh/posts/" : "/posts/";
    return this.page.locator(`a[href^="${prefix}"]`);
  }

  get firstPost(): Locator {
    return this.postLinks.first();
  }

  /**
   * Get total number of posts on page
   */
  async getPostCount(): Promise<number> {
    return await this.postLinks.count();
  }

  /**
   * Navigate to a specific post by index
   */
  async clickPost(index: number = 0): Promise<PostPage> {
    await this.postLinks.nth(index).click();
    await this.waitForLoad();
    return new PostPage(this.page);
  }

  /**
   * Navigate to first post
   */
  async clickFirstPost(): Promise<PostPage> {
    return this.clickPost(0);
  }

  /**
   * Get post slug by index
   */
  async getPostSlug(index: number): Promise<string | null> {
    const href = await this.postLinks.nth(index).getAttribute("href");
    if (!href) return null;

    const match = href.match(/\/posts\/([^/]+)$/);
    return match ? match[1] : null;
  }
}
