import { test, expect } from "@playwright/test";

/**
 * E2E Test: About Live Dashboard
 *
 * This test validates the complete user journey for the live dashboard:
 * - Page loads successfully
 * - All 7 module cards are visible and interactive
 * - Navigation between modules works
 * - Responsive design adapts to different screen sizes
 * - Internationalization (en/zh) works correctly
 */

test.describe("About Live Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about/live");
  });

  test("should display dashboard with all module cards", async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByRole("heading", { name: /Live Activity Dashboard/ })).toBeVisible();

    // Should display at least 5 module cards (dev, gaming, reading, social, finance)
    const cards = page.locator("a[href*='/about/live/']");
    await expect(cards).toHaveCount(7, { timeout: 10000 });
  });

  test("should navigate to gaming detail page", async ({ page }) => {
    // Click on gaming module card
    await page.locator("a[href$='/about/live/gaming']").first().click();

    // Should navigate to gaming detail page
    await expect(page).toHaveURL(/\/about\/live\/gaming$/);
    await expect(page.getByRole("heading", { name: /Gaming Activity/ })).toBeVisible();
  });

  test("should navigate to dev detail page", async ({ page }) => {
    // Click on dev module card
    await page.locator("a[href$='/about/live/dev']").first().click();

    // Should navigate to dev detail page
    await expect(page).toHaveURL(/\/about\/live\/dev$/);
    await expect(page.getByRole("heading", { name: /Development Activity/ })).toBeVisible();
  });

  test("should navigate to reading detail page", async ({ page }) => {
    // Click on reading module card
    await page.locator("a[href$='/about/live/reading']").first().click();

    // Should navigate to reading detail page
    await expect(page).toHaveURL(/\/about\/live\/reading$/);
    await expect(page.getByRole("heading", { name: /Reading Activity/ })).toBeVisible();
  });

  test("should navigate to social detail page", async ({ page }) => {
    // Click on social module card
    await page.locator("a[href$='/about/live/social']").first().click();

    // Should navigate to social detail page
    await expect(page).toHaveURL(/\/about\/live\/social$/);
    await expect(page.getByRole("heading", { name: /Social Activity/ })).toBeVisible();
  });

  test("should navigate to finance detail page", async ({ page }) => {
    // Click on finance module card
    await page.locator("a[href$='/about/live/finance']").first().click();

    // Should navigate to finance detail page
    await expect(page).toHaveURL(/\/about\/live\/finance$/);
    await expect(page.getByRole("heading", { name: /Finance Overview/ })).toBeVisible();
  });

  test("should display loading state before data loads", async ({ page }) => {
    // Intercept API call to delay response
    await page.route("**/api/about/highlights", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/about/live");

    // Should display skeleton loading state
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();
  });

  test("should work in Chinese locale", async ({ page }) => {
    await page.goto("/zh/about/live");

    // Should display Chinese text
    await expect(page.getByRole("heading", { name: /实时动态仪表盘/ })).toBeVisible();

    // Module cards should still be clickable
    await page.locator("a[href$='/zh/about/live/gaming']").first().click();
    await expect(page).toHaveURL(/\/zh\/about\/live\/gaming$/);
    await expect(page.getByRole("heading", { name: /游戏活动/ })).toBeVisible();
  });

  test("should display module icons", async ({ page }) => {
    await page.waitForSelector("a[href*='/about/live/']", { state: "visible", timeout: 10000 });

    // Icons should be visible (SVG elements)
    const icons = page.locator("svg:visible");
    await expect(icons.first()).toBeVisible();
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(5);
  });

  test("should display module subtitles and values", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Wait for data to load
    await page.waitForSelector("a[href*='/about/live/']", {
      state: "visible",
      timeout: 10000,
    });

    // Module cards should have subtitles and values
    const cards = page.locator("a[href*='/about/live/']");
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    // Should contain text content
    const textContent = await firstCard.textContent();
    expect(textContent).toBeTruthy();
    expect(textContent!.length).toBeGreaterThan(10);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/about/live");

    // Dashboard should still be visible and functional
    await expect(page.getByRole("heading", { name: /Live Activity Dashboard/ })).toBeVisible();

    // Cards should stack vertically on mobile
    const cards = page.locator("a[href*='/about/live/']");
    await expect(cards.first()).toBeVisible();
  });

  test("should be responsive on tablet", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/about/live");

    // Dashboard should display properly
    await expect(page.getByRole("heading", { name: /Live Activity Dashboard/ })).toBeVisible();

    // Cards should be in grid layout
    const cards = page.locator("a[href*='/about/live/']");
    await expect(cards.first()).toBeVisible();
  });

  test("should navigate back to about page", async ({ page }) => {
    // Should have a back button or breadcrumb
    const backLink = page.locator("a[href*='/about']").first();
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Intercept API call to return error
    await page.route("**/api/about/highlights", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.goto("/about/live");

    // Page should still render without crashing
    await expect(page.getByRole("heading", { name: /Live Activity Dashboard/ })).toBeVisible();
    await expect(page.getByText(/Unable to load live activity data right now/i)).toBeVisible();

    // Should not display module cards (but shouldn't crash)
    const cards = page.locator("a[href*='/about/live/']");
    await expect(cards).toHaveCount(0);
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/about/live");
    const cards = page.locator("a[href*='/about/live/']");
    await cards.first().waitFor({ state: "visible", timeout: 10000 });

    // Focus first card and ensure keyboard users can activate it
    await cards.first().focus();
    await expect(cards.first()).toBeFocused();

    // Enter key should navigate
    await page.keyboard.press("Enter");

    // Should navigate to detail page
    await page.waitForURL(/\/about\/live\/.+/);
  });

  test("should display all Phase 4 modules", async ({ page }) => {
    const phaseFourCards = [
      "a[href$='/about/live/reading']",
      "a[href$='/about/live/social']",
      "a[href$='/about/live/finance']",
    ];

    for (const selector of phaseFourCards) {
      await expect(page.locator(selector)).toBeVisible();
    }
  });

  test("should have accessible module cards", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // All cards should be links with href
    const cards = page.locator("a[href*='/about/live/']");
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const href = await card.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toContain("/about/live/");
    }
  });
});
