import { test, expect } from "@playwright/test";

/**
 * E2E Test: Gaming Detail Page
 *
 * Validates the gaming activity detail page:
 * - Statistics display correctly
 * - Currently playing games are visible
 * - Playtime heatmap renders
 * - Navigation works
 * - Internationalization
 */

test.describe("Gaming Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/about/live/gaming");
  });

  test("should display gaming statistics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Page title
    await expect(page.locator("text=Gaming Activity")).toBeVisible();

    // Statistics should be visible
    await expect(page.locator("text=This Month")).toBeVisible();
    await expect(page.locator("text=This Year")).toBeVisible();

    // Should display hours and games played
    await expect(page.locator("text=/\\d+ hours/")).toBeVisible();
    await expect(page.locator("text=/\\d+ games/")).toBeVisible();
  });

  test("should display currently playing games", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Currently Playing section
    await expect(page.locator("text=Currently Playing")).toBeVisible();

    // Game cards should be visible
    const gameCards = page.locator("text=/Elden Ring|Baldur's Gate|Cyberpunk/");
    await expect(gameCards.first()).toBeVisible();
  });

  test("should display game progress bars", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Progress percentages should be visible
    const progressText = page.locator("text=/%/");
    const count = await progressText.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display playtime heatmap", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Heatmap section
    await expect(page.locator("text=Playtime This Year")).toBeVisible();

    // Heatmap should render (canvas or SVG)
    const heatmap = page.locator("canvas, svg").first();
    await expect(heatmap).toBeVisible();
  });

  test("should display recent sessions", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Recent Sessions section
    await expect(page.locator("text=Recent Sessions")).toBeVisible();

    // Session duration should be visible
    await expect(page.locator("text=/\\d+ min/")).toBeVisible();
  });

  test("should display platform statistics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Platforms section
    await expect(page.locator("text=Platforms")).toBeVisible();

    // Platform names should be visible
    await expect(page.locator("text=/Steam|PlayStation|Xbox|Nintendo/")).toBeVisible();
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Back to Dashboard link
    const backLink = page.locator("text=Back to Dashboard");
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL(/\/about\/live$/);
  });

  test("should work in Chinese locale", async ({ page }) => {
    await page.goto("/zh/about/live/gaming");
    await page.waitForLoadState("networkidle");

    // Chinese text should be visible
    await expect(page.locator("text=游戏活动")).toBeVisible();
    await expect(page.locator("text=本月")).toBeVisible();
    await expect(page.locator("text=今年")).toBeVisible();
  });

  test("should display achievements", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Achievements format: "45 / 60"
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).toBeVisible();
  });

  test("should handle loading state", async ({ page }) => {
    // Intercept API to delay response
    await page.route("**/api/about/live/gaming", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/en/about/live/gaming");

    // Should show loading skeletons
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();

    // Eventually data should load
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Currently Playing")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/about/live/gaming");
    await page.waitForLoadState("networkidle");

    // Content should be visible and stacked
    await expect(page.locator("text=Gaming Activity")).toBeVisible();
    await expect(page.locator("text=This Month")).toBeVisible();
  });

  test("should display game covers", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Game cover images should be loaded
    const images = page.locator("img[alt*='']");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });
});
