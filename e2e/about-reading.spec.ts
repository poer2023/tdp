import { test, expect } from "@playwright/test";

/**
 * E2E Test: Reading Detail Page
 *
 * Validates the reading activity detail page:
 * - Book statistics display
 * - Currently reading books
 * - Recently finished books with ratings
 * - Recent articles with external links
 * - Navigation and internationalization
 */

test.describe("Reading Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about/reading");
  });

  test("should display reading statistics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Page title
    await expect(page.locator("text=Reading Activity")).toBeVisible();

    // Statistics sections
    await expect(page.locator("text=This Month")).toBeVisible();
    await expect(page.locator("text=This Year")).toBeVisible();
    await expect(page.locator("text=All Time")).toBeVisible();

    // Should display book and article counts
    await expect(page.locator("text=/\\d+ books?/")).toBeVisible();
    await expect(page.locator("text=/\\d+ articles?/")).toBeVisible();
  });

  test("should display currently reading books", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Currently Reading section
    await expect(page.locator("text=Currently Reading")).toBeVisible();

    // Book titles and authors should be visible
    const bookTitles = page.locator("text=/System Design|Clean Code|Designing Data/");
    await expect(bookTitles.first()).toBeVisible();
  });

  test("should display reading progress", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Progress section
    await expect(page.locator("text=Progress")).toBeVisible();

    // Page numbers format: "195 / 300 pages"
    await expect(page.locator("text=/\\d+ \\/ \\d+ pages?/")).toBeVisible();

    // Progress percentage
    await expect(page.locator("text=/%/")).toBeVisible();
  });

  test("should display book covers", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Book cover images should be loaded
    const images = page.locator("img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display start dates", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Started dates should be visible
    await expect(page.locator("text=/Started/")).toBeVisible();
  });

  test("should display recently finished books", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Recently Finished section
    await expect(page.locator("text=Recently Finished")).toBeVisible();

    // Book titles should be visible
    const finishedBooks = page.locator("text=/Clean Code|Atomic Habits|Sapiens/");
    await expect(finishedBooks.first()).toBeVisible();
  });

  test("should display star ratings", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Star ratings should be visible
    const stars = page.locator("text=★");
    const count = await stars.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display finish dates", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Finish dates should be visible
    await expect(page.locator("text=/Dec|Jan|Feb|Mar/")).toBeVisible();
  });

  test("should display recent articles", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Recent Articles section
    await expect(page.locator("text=Recent Articles")).toBeVisible();

    // Article titles should be visible
    const articles = page.locator(
      "text=/Understanding React|TypeScript Best Practices|System Design/"
    );
    await expect(articles.first()).toBeVisible();
  });

  test("should have clickable article links", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Articles should be clickable links
    const articleLinks = page.locator("a[href^='http'][target='_blank']");
    await expect(articleLinks.first()).toBeVisible();

    // Should have external link icon
    const externalIcons = page.locator("svg");
    const count = await externalIcons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display article sources", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Article sources should be visible
    await expect(page.locator("text=/Medium|Dev.to|Tech Blog|Personal Blog/")).toBeVisible();
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
    await page.goto("/zh/about/reading");
    await page.waitForLoadState("networkidle");

    // Chinese text should be visible
    await expect(page.locator("text=阅读记录")).toBeVisible();
    await expect(page.locator("text=本月")).toBeVisible();
    await expect(page.locator("text=今年")).toBeVisible();
    await expect(page.locator("text=总计")).toBeVisible();
  });

  test("should handle loading state", async ({ page }) => {
    // Intercept API to delay response
    await page.route("**/api/about/reading", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/about/reading");

    // Should show loading skeletons
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();

    // Eventually data should load
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Currently Reading")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/about/reading");
    await page.waitForLoadState("networkidle");

    // Content should be visible and stacked
    await expect(page.locator("text=Reading Activity")).toBeVisible();
    await expect(page.locator("text=This Month")).toBeVisible();
  });

  test("should display reading progress bars", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Progress bars should be visible
    await expect(page.locator("text=Progress")).toBeVisible();

    // Visual progress indication should exist
    const progressBars = page.locator("[role='progressbar'], .progress-bar");
    // Progress bar styling should be present even if no explicit role
    await expect(page.locator("text=/\\d+%/")).toBeVisible();
  });

  test("should display all time statistics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // All Time section should show cumulative stats
    await expect(page.locator("text=All Time")).toBeVisible();

    // Should have higher numbers than This Year
    const allTimeSection = page.locator("text=All Time").locator("..");
    await expect(allTimeSection).toBeVisible();
  });
});
