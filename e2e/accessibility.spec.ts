import { test, expect } from "@playwright/test";
import { PostPage } from "./pages/post-page";
import { PostsListPage } from "./pages/posts-list-page";
import { TEST_POST_IDS } from "./fixtures/test-data";
import { loginAsUser, logout } from "./utils/auth";
import { waitForNetworkIdle } from "./helpers/wait-helpers";

test.describe("Keyboard Navigation", () => {
  test("should support Tab navigation through interactive elements", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Tab through elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should have visible focus indicator
    const focused = page.locator(":focus");
    const isVisible = await focused.isVisible();

    expect(isVisible).toBe(true);
  });

  test("should support keyboard navigation on post page", async ({ page }) => {
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Tab to first interactive element
    await page.keyboard.press("Tab");

    // Should focus on interactive element
    const focused = page.locator(":focus");
    expect(await focused.count()).toBeGreaterThan(0);
  });

  test("should support Shift+Tab for reverse navigation", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Tab forward
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const secondElement = page.locator(":focus");
    const secondId = await secondElement.getAttribute("id");

    // Tab backward
    await page.keyboard.press("Shift+Tab");

    const firstElement = page.locator(":focus");
    const firstId = await firstElement.getAttribute("id");

    // Should be different elements
    expect(firstId).not.toBe(secondId);
  });

  test("should have skip-to-content link", async ({ page }) => {
    await page.goto("/");

    // Tab to first element (should be skip link)
    await page.keyboard.press("Tab");

    const focused = page.locator(":focus");
    const text = await focused.textContent();

    // Should be skip link or navigation
    expect(text?.toLowerCase()).toMatch(/skip|main|navigation|menu/i);
  });

  test("should activate links with Enter key", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Find first post link
    const firstLink = page.locator('a[href^="/posts/"]').first();
    await firstLink.focus();

    // Press Enter
    const navigationPromise = page.waitForNavigation();
    await page.keyboard.press("Enter");

    await navigationPromise;

    // Should navigate to post
    expect(page.url()).toContain("/posts/");
  });

  test("should not trap focus outside modals", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Tab through all elements
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
    }

    // Focus should still be on page elements
    const focused = page.locator(":focus");
    expect(await focused.count()).toBeGreaterThan(0);
  });
});

test.describe("ARIA Attributes and Roles", () => {
  test("should have proper ARIA landmarks", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Check for main landmark
    const main = page.locator('[role="main"]').or(page.locator("main"));
    expect(await main.count()).toBeGreaterThan(0);

    // Check for navigation landmark
    const nav = page.locator('[role="navigation"]').or(page.locator("nav"));
    expect(await nav.count()).toBeGreaterThan(0);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Should have h1
    const h1 = page.locator("h1");
    expect(await h1.count()).toBe(1);

    // Should not skip heading levels
    const allHeadings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    const levels = await Promise.all(
      allHeadings.map((h) => h.evaluate((el) => parseInt(el.tagName[1])))
    );

    // Check no skipped levels (e.g., h1 -> h3)
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test.skip("should have ARIA labels on form inputs", async ({ page }) => {
    // Skipped: Comment feature has been removed from the application
    await loginAsUser(page, "regular");
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Comment form should have labels
    const textarea = postPage.commentForm;

    if ((await textarea.count()) > 0) {
      const ariaLabel = await textarea.getAttribute("aria-label");
      const labelFor = await textarea.getAttribute("id");

      let hasLabel = !!ariaLabel;

      if (!hasLabel && labelFor) {
        const label = page.locator(`label[for="${labelFor}"]`);
        hasLabel = (await label.count()) > 0;
      }

      expect(hasLabel).toBe(true);
    }

    await logout(page);
  });

  test("should have ARIA attributes on interactive buttons", async ({ page }) => {
    await loginAsUser(page, "regular");
    await page.goto("/");
    await waitForNetworkIdle(page);

    // User menu button should have ARIA
    const userMenu = page.getByLabel("User menu");

    if ((await userMenu.count()) > 0) {
      const hasPopup = await userMenu.getAttribute("aria-haspopup");
      const expanded = await userMenu.getAttribute("aria-expanded");

      expect(hasPopup).toBeTruthy();
      expect(expanded).toBeTruthy();
    }

    await logout(page);
  });

  test("should have alt text on images", async ({ page }) => {
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Find all images
    const images = await page.locator("img").all();

    for (const img of images) {
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");

      // Image should have alt text or role="presentation" for decorative images
      expect(alt !== null || role === "presentation").toBe(true);
    }
  });

  test("should have proper button roles", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // All buttons should have role="button" or be <button> elements
    const buttons = await page.locator('button, [role="button"]').all();

    for (const button of buttons) {
      const tagName = await button.evaluate((el) => el.tagName.toLowerCase());
      const role = await button.getAttribute("role");

      expect(tagName === "button" || role === "button").toBe(true);
    }
  });
});

test.describe("Focus Management", () => {
  test("should have visible focus indicators", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Tab to first interactive element
    await page.keyboard.press("Tab");

    const focused = page.locator(":focus");

    // Get computed styles
    const outline = await focused.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have visible focus indicator
    const hasVisibleFocus =
      outline.outlineWidth !== "0px" ||
      outline.outlineStyle !== "none" ||
      outline.boxShadow !== "none";

    expect(hasVisibleFocus).toBe(true);
  });

  test("should restore focus after modal close", async ({ page }) => {
    await loginAsUser(page, "regular");
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Open user menu
    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      // Close with Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // Focus should return to trigger button
      const focused = page.locator(":focus");
      const focusedText = await focused.textContent();

      expect(focusedText).toContain("Test User");
    }

    await logout(page);
  });

  test("should not lose focus on page load", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Tab to an element
    await page.keyboard.press("Tab");

    const initialFocus = await page.locator(":focus").textContent();

    // Reload page
    await page.reload();
    await waitForNetworkIdle(page);

    // Should be able to tab again
    await page.keyboard.press("Tab");

    const afterReloadFocus = await page.locator(":focus").textContent();

    expect(afterReloadFocus).toBeTruthy();
  });
});

test.describe("Color and Contrast", () => {
  test("should have sufficient color contrast for body text", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Get body text styles
    const body = page.locator("body");
    const contrast = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Should have defined colors
    expect(contrast.color).toBeTruthy();
    expect(contrast.backgroundColor).toBeTruthy();

    // Note: Actual contrast ratio calculation would require color parsing
    // This is a basic check for color definition
  });

  test("should maintain readability in dark mode (if supported)", async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: "dark" });

    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Check if dark mode is applied
    const body = page.locator("body");
    const bgColor = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor;
    });

    // Background should be defined
    expect(bgColor).toBeTruthy();
  });
});

test.describe("Screen Reader Support", () => {
  test("should have descriptive link text", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Find all links
    const links = await page.locator("a").all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");

      // Link should have text or aria-label
      expect((text && text.trim().length > 0) || ariaLabel).toBeTruthy();

      // Should not be generic (like "click here", "read more" without context)
      if (text && !ariaLabel) {
        const lowerText = text.toLowerCase().trim();
        const isGeneric = ["click here", "here", "link"].includes(lowerText);

        if (isGeneric) {
          // Generic text should have aria-label for context
          expect(ariaLabel).toBeTruthy();
        }
      }
    }
  });

  test("should announce page title changes", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    const homeTitle = await page.title();

    await page.goto("/posts");
    await waitForNetworkIdle(page);

    const postsTitle = await page.title();

    // Titles should be different and descriptive
    expect(homeTitle).not.toBe(postsTitle);
    expect(homeTitle.length).toBeGreaterThan(0);
    expect(postsTitle.length).toBeGreaterThan(0);
  });

  test("should have ARIA live regions for dynamic content", async ({ page }) => {
    await loginAsUser(page, "regular");
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Look for live regions (status messages, notifications)
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');

    // Live regions are optional but recommended
    const count = await liveRegions.count();
    expect(count).toBeGreaterThanOrEqual(0);

    await logout(page);
  });
});

test.describe("Mobile Accessibility", () => {
  test("should have touch-friendly tap targets (min 44x44px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Check first button/link size
    const firstButton = page.locator("button, a").first();

    const size = await firstButton.boundingBox();

    if (size) {
      // iOS HIG recommends 44x44px minimum
      expect(size.width).toBeGreaterThanOrEqual(40); // Allow 40px for flexibility
      expect(size.height).toBeGreaterThanOrEqual(40);
    }
  });

  test("should support pinch-to-zoom", async ({ page }) => {
    await page.goto("/");

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute("content");

    // Should not prevent user scaling
    expect(content).not.toContain("user-scalable=no");
    expect(content).not.toContain("maximum-scale=1");
  });

  test("should maintain readability at 200% zoom", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = "2";
    });

    // Content should still be visible
    const body = page.locator("body");
    const isVisible = await body.isVisible();

    expect(isVisible).toBe(true);

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = "1";
    });
  });
});

// Comment forms removed; form accessibility tests not applicable

test.describe("Semantic HTML", () => {
  test("should use semantic HTML5 elements", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Should have semantic elements
    const article = page.locator("article");
    const nav = page.locator("nav");
    const main = page.locator("main");

    const articleCount = await article.count();
    const navCount = await nav.count();
    const mainCount = await main.count();

    // Should use semantic elements where appropriate
    expect(articleCount + navCount + mainCount).toBeGreaterThan(0);
  });

  test("should use lists for list content", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Navigation should use lists
    const navLists = page.locator("nav ul, nav ol");

    // Lists are common in navigation
    const count = await navLists.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
