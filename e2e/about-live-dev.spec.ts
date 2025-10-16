import { test, expect } from "@playwright/test";

/**
 * E2E Test: Development Detail Page
 *
 * Validates the development activity detail page:
 * - GitHub statistics display
 * - Contribution heatmap renders
 * - Active repositories shown
 * - Programming languages display
 * - Navigation and internationalization
 */

test.describe("Development Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/about/live/dev");
  });

  test("should display dev statistics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Page title
    await expect(page.locator("text=Development Activity")).toBeVisible();

    // Statistics sections
    await expect(page.locator("text=This Week")).toBeVisible();
    await expect(page.locator("text=This Month")).toBeVisible();
    await expect(page.locator("text=This Year")).toBeVisible();

    // Should display commits, repos, PRs, stars
    await expect(page.locator("text=/\\d+ commits?/")).toBeVisible();
    await expect(page.locator("text=/\\d+ repos?/")).toBeVisible();
  });

  test("should display current streak", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Current Streak section
    await expect(page.locator("text=Current Streak")).toBeVisible();
    await expect(page.locator("text=/\\d+ days?/")).toBeVisible();
  });

  test("should display GitHub contribution heatmap", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Contribution heatmap section
    await expect(page.locator("text=GitHub Contributions")).toBeVisible();

    // Heatmap should render
    const heatmap = page.locator("canvas, svg").first();
    await expect(heatmap).toBeVisible();
  });

  test("should display active repositories", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Active Repositories section
    await expect(page.locator("text=Active Repositories")).toBeVisible();

    // Repository names should be visible
    const repoCards = page.locator("text=/awesome-project|tdp|next-blog|portfolio/");
    await expect(repoCards.first()).toBeVisible();
  });

  test("should display programming languages", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Languages section
    await expect(page.locator("text=Languages")).toBeVisible();

    // Language names should be visible
    await expect(page.locator("text=/TypeScript|Python|Go|JavaScript/")).toBeVisible();

    // Language percentages should be visible
    await expect(page.locator("text=/%/")).toBeVisible();

    // Language hours should be visible
    await expect(page.locator("text=/\\d+ hours/")).toBeVisible();
  });

  test("should display last commit information", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Commit messages should be visible in repository cards
    const commitMessage = page.locator("text=/feat:|fix:|chore:|docs:/");
    await expect(commitMessage.first()).toBeVisible();

    // Commit dates should be visible
    await expect(page.locator("text=/\\d+ commits? this month/")).toBeVisible();
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
    await page.goto("/zh/about/live/dev");
    await page.waitForLoadState("networkidle");

    // Chinese text should be visible
    await expect(page.locator("text=开发活动")).toBeVisible();
    await expect(page.locator("text=本周")).toBeVisible();
    await expect(page.locator("text=本月")).toBeVisible();
    await expect(page.locator("text=今年")).toBeVisible();
  });

  test("should display language bar charts", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Language percentages create visual bars
    await expect(page.locator("text=Languages")).toBeVisible();

    // Multiple language entries should be visible
    const languageEntries = page.locator("text=/TypeScript|Python|Go|JavaScript/");
    const count = await languageEntries.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should handle loading state", async ({ page }) => {
    // Intercept API to delay response
    await page.route("**/api/about/live/dev", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/en/about/live/dev");

    // Should show loading skeletons
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();

    // Eventually data should load
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Active Repositories")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/about/live/dev");
    await page.waitForLoadState("networkidle");

    // Content should be visible and stacked
    await expect(page.locator("text=Development Activity")).toBeVisible();
    await expect(page.locator("text=This Week")).toBeVisible();
  });

  test("should display repository languages", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Repository cards should show language badges
    await expect(page.locator("text=Active Repositories")).toBeVisible();

    // Language badges in repository cards
    const languageBadges = page.locator("text=/TypeScript|Python|JavaScript|Go/");
    await expect(languageBadges.first()).toBeVisible();
  });

  test("should display month statistics with PRs", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // This Month section should show PRs
    await expect(page.locator("text=/\\d+ PRs?/")).toBeVisible();
  });

  test("should display year statistics with stars", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // This Year section should show stars
    await expect(page.locator("text=/\\d+ stars?/")).toBeVisible();
  });
});
