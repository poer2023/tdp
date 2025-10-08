/**
 * Base Page Object
 *
 * Provides common functionality for all page objects.
 * Follows Page Object Model pattern for better maintainability.
 */

import { Page, Locator } from "@playwright/test";
import { waitForNetworkIdle } from "../helpers/wait-helpers";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path);
    await waitForNetworkIdle(this.page);
  }

  /**
   * Get current URL
   */
  get url(): string {
    return this.page.url();
  }

  /**
   * Common selectors for all pages
   */
  get header(): Locator {
    return this.page.locator("header");
  }

  get mainContent(): Locator {
    return this.page.locator("main");
  }

  get footer(): Locator {
    return this.page.locator("footer");
  }

  /**
   * Navigation helpers
   */
  get signInButton(): Locator {
    return this.page
      .getByRole("button", { name: /sign in|登录/i })
      .or(this.page.getByRole("link", { name: /sign in|登录/i }));
  }

  get userMenu(): Locator {
    return this.page
      .getByLabel("User menu")
      .or(this.page.locator("button").filter({ hasText: /test user|admin/i }));
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return (await this.userMenu.count()) > 0;
  }

  /**
   * Get page heading
   */
  get heading(): Locator {
    return this.page.locator("h1").first();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState("domcontentloaded");
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {
      // Some pages keep background requests alive (e.g., Next.js polling). Ignore timeouts here.
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
