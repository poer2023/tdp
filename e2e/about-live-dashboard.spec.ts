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
    await page.goto("/en/about/live");
  });

  test("should display dashboard with all module cards", async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator("text=Live Dashboard")).toBeVisible();

    // Should display at least 5 module cards (dev, gaming, reading, social, finance)
    const cards = page.locator("a[href*='/about/live/']");
    await expect(cards).toHaveCount(7, { timeout: 10000 });
  });

  test("should navigate to gaming detail page", async ({ page }) => {
    // Click on gaming module card
    await page.click("text=Gaming");

    // Should navigate to gaming detail page
    await expect(page).toHaveURL(/\/about\/live\/gaming$/);
    await expect(page.locator("text=Gaming Activity")).toBeVisible();
  });

  test("should navigate to dev detail page", async ({ page }) => {
    // Click on dev module card
    await page.click("text=Development");

    // Should navigate to dev detail page
    await expect(page).toHaveURL(/\/about\/live\/dev$/);
    await expect(page.locator("text=Development Activity")).toBeVisible();
  });

  test("should navigate to reading detail page", async ({ page }) => {
    // Click on reading module card
    await page.click("text=Reading");

    // Should navigate to reading detail page
    await expect(page).toHaveURL(/\/about\/live\/reading$/);
    await expect(page.locator("text=Reading Activity")).toBeVisible();
  });

  test("should navigate to social detail page", async ({ page }) => {
    // Click on social module card
    await page.click("text=Social");

    // Should navigate to social detail page
    await expect(page).toHaveURL(/\/about\/live\/social$/);
    await expect(page.locator("text=Social Activity")).toBeVisible();
  });

  test("should navigate to finance detail page", async ({ page }) => {
    // Click on finance module card
    await page.click("text=Finance");

    // Should navigate to finance detail page
    await expect(page).toHaveURL(/\/about\/live\/finance$/);
    await expect(page.locator("text=Finance Overview")).toBeVisible();
  });

  test("should display loading state before data loads", async ({ page }) => {
    // Intercept API call to delay response
    await page.route("**/api/about/highlights", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/en/about/live");

    // Should display skeleton loading state
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();
  });

  test("should work in Chinese locale", async ({ page }) => {
    await page.goto("/zh/about/live");

    // Should display Chinese text
    await expect(page.locator("text=实时仪表盘")).toBeVisible();

    // Module cards should still be clickable
    await page.click("text=游戏");
    await expect(page).toHaveURL(/\/zh\/about\/live\/gaming$/);
    await expect(page.locator("text=游戏活动")).toBeVisible();
  });

  test("should display module icons", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Icons should be visible (SVG elements)
    const icons = page.locator("svg");
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
    await page.goto("/en/about/live");

    // Dashboard should still be visible and functional
    await expect(page.locator("text=Live Dashboard")).toBeVisible();

    // Cards should stack vertically on mobile
    const cards = page.locator("a[href*='/about/live/']");
    await expect(cards.first()).toBeVisible();
  });

  test("should be responsive on tablet", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/about/live");

    // Dashboard should display properly
    await expect(page.locator("text=Live Dashboard")).toBeVisible();

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

    await page.goto("/en/about/live");

    // Page should still render without crashing
    await expect(page.locator("text=Live Dashboard")).toBeVisible();

    // Should not display module cards (but shouldn't crash)
    const cards = page.locator("a[href*='/about/live/']");
    await expect(cards).toHaveCount(0);
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/en/about/live");
    await page.waitForLoadState("networkidle");

    // Tab through module cards
    await page.keyboard.press("Tab");

    // First focusable element should be highlighted
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Enter key should navigate
    await page.keyboard.press("Enter");

    // Should navigate to detail page
    await page.waitForURL(/\/about\/live\/.+/);
  });

  test("should display all Phase 4 modules", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Phase 4 modules: reading, social, finance
    await expect(page.locator("text=Reading")).toBeVisible();
    await expect(page.locator("text=Social")).toBeVisible();
    await expect(page.locator("text=Finance")).toBeVisible();
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
