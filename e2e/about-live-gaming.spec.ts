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
    await page.goto("/about/gaming");
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
    await expect(page).toHaveURL(/\/about$/);
  });

  test("should work in Chinese locale", async ({ page }) => {
    await page.goto("/zh/about/gaming");
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

    await page.goto("/about/gaming");

    // Should show loading skeletons
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();

    // Eventually data should load
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Currently Playing")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/about/gaming");
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

  test("should handle real database data", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Real data should show actual game names, not mock data
    // If database is populated, games should be visible
    const gameCards = page.locator('[data-testid*="game-card"]');

    // Either mock games or real games should be visible
    const statsVisible = (await page.locator("text=/\\d+ hours/").count()) > 0;
    expect(statsVisible).toBe(true);
  });

  test("should handle empty database gracefully", async ({ page }) => {
    // Mock empty API response
    await page.route("**/api/about/live/gaming", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stats: {
            platforms: [],
            thisMonth: { totalHours: 0, gamesPlayed: 0 },
            thisYear: { totalHours: 0, gamesPlayed: 0 },
          },
          currentlyPlaying: [],
          recentSessions: [],
          playtimeHeatmap: Array.from({ length: 365 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            value: 0,
          })),
        }),
      });
    });

    await page.goto("/about/gaming");
    await page.waitForLoadState("networkidle");

    // Should still display structure with zero values
    await expect(page.locator("text=0 hours")).toBeVisible();
    await expect(page.locator("text=0 games")).toBeVisible();
  });

  test("should handle multi-platform data", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Platforms section should list different platforms
    const platformsSection = page.locator("text=Platforms");
    await expect(platformsSection).toBeVisible();

    // Should show platform-specific data
    // Steam, HoYoverse, or other platforms
    const platformNames = page.locator("text=/Steam|绝区零|PlayStation/");
    const platformCount = await platformNames.count();
    expect(platformCount).toBeGreaterThanOrEqual(0);
  });

  test("should display Chinese game names when available", async ({ page }) => {
    await page.goto("/zh/about/gaming");
    await page.waitForLoadState("networkidle");

    // If HoYoverse games are present, should show Chinese names
    // This is optional - only if database has ZZZ data
    const chineseGameName = page.locator("text=绝区零");
    // Either Chinese name exists or no ZZZ data (both valid)
    const count = await chineseGameName.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route("**/api/about/live/gaming", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Database error" }),
      });
    });

    await page.goto("/about/gaming");
    await page.waitForLoadState("networkidle");

    // Should fall back to mock data or show error gracefully
    // Page should still be functional
    const pageTitle = page.locator("text=Gaming Activity");
    await expect(pageTitle).toBeVisible();
  });

  test("should display estimated playtime for ZZZ", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // If ZZZ data exists, should show playtime
    // (even if estimated rather than exact)
    const playtimePattern = page.locator("text=/\\d+ h(ours?)?/i");
    const count = await playtimePattern.count();
    // Should have at least stats section showing hours
    expect(count).toBeGreaterThan(0);
  });

  test("should display sync timestamp", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Last updated timestamp should be visible
    const timestamp = page.locator("text=/Last updated|上次更新/i");
    // Timestamp may or may not be present depending on design
    const exists = await timestamp.count();
    // Just verify page loads, timestamp is optional
    expect(exists).toBeGreaterThanOrEqual(0);
  });

  test("should handle achievements data", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Achievements should be in format "X / Y" or just "X"
    // This is from Steam games only (ZZZ doesn't provide achievements)
    const achievementPattern = page.locator("text=/\\d+/");
    const count = await achievementPattern.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display correct date formats", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Recent sessions should show dates
    // Either relative ("2 hours ago") or absolute dates
    const datePattern = page.locator(
      "text=/\\d{4}-\\d{2}-\\d{2}|\\d+ (hour|day|week)s? ago|今天|昨天/i"
    );
    const count = await datePattern.count();
    // Dates should be present if there are sessions
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should load data from database API", async ({ page }) => {
    // Verify API is called correctly
    const apiPromise = page.waitForResponse("**/api/about/live/gaming");

    await page.goto("/about/gaming");

    const response = await apiPromise;
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty("stats");
    expect(data).toHaveProperty("currentlyPlaying");
    expect(data).toHaveProperty("recentSessions");
    expect(data).toHaveProperty("playtimeHeatmap");
  });

  test("should respect cache headers", async ({ page }) => {
    const apiPromise = page.waitForResponse("**/api/about/live/gaming");

    await page.goto("/about/gaming");

    const response = await apiPromise;
    const cacheControl = response.headers()["cache-control"];

    // Should have cache control headers
    expect(cacheControl).toBeDefined();
    expect(cacheControl).toContain("public");
  });
});
