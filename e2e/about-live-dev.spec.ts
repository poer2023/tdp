import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const waitForDevData = async (page: Page) => {
  await page
    .getByRole("heading", { name: /Statistics|统计概览/ })
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
};

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
    await page.goto("/about/dev");
  });

  test("should display dev statistics", async ({ page }) => {
    await waitForDevData(page);

    // Page title
    await expect(page.getByRole("heading", { name: /Development Activity/ })).toBeVisible();

    // Statistics sections
    await expect(page.getByRole("heading", { name: /This Week/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /This Month/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /This Year/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Current Streak/ })).toBeVisible();

    const statsSection = page.getByRole("heading", { name: /Statistics/ }).locator("..");
    await expect(statsSection.getByText(/\b\d+\b/).first()).toBeVisible();
    await expect(statsSection.getByText(/repos?/i).first()).toBeVisible();
    await expect(statsSection.getByText(/PRs?/i).first()).toBeVisible();
  });

  test("should display current streak", async ({ page }) => {
    await waitForDevData(page);

    // Current Streak section
    const streakCard = page.getByRole("heading", { name: /Current Streak/ }).locator("..");
    await expect(streakCard.getByText(/\b\d+\b/).first()).toBeVisible();
    await expect(streakCard.getByText(/days?/i)).toBeVisible();
  });

  test("should display GitHub contribution heatmap", async ({ page }) => {
    await waitForDevData(page);

    // Contribution heatmap section
    const heatmapSection = page
      .getByRole("heading", { name: /Contribution Heatmap/ })
      .locator("..");
    await expect(heatmapSection).toBeVisible();

    // Heatmap should render (cells with title attribute)
    const heatmapCells = heatmapSection.locator("div[title*=':']");
    await expect(heatmapCells.first()).toBeVisible();
  });

  test("should display active repositories", async ({ page }) => {
    await waitForDevData(page);

    // Active Repositories section
    await expect(page.getByRole("heading", { name: /Active Repositories/ })).toBeVisible();

    // Repository names should be visible
    const repoCards = page.locator("text=/awesome-project|tdp|next-blog|portfolio/");
    await expect(repoCards.first()).toBeVisible();
  });

  test("should display programming languages", async ({ page }) => {
    await waitForDevData(page);

    // Languages section
    const languagesSection = page
      .getByRole("heading", { name: /Programming Languages/ })
      .locator("..");
    await expect(languagesSection).toBeVisible();

    const languageLabels = ["TypeScript", "Python", "Markdown", "Other"];
    for (const label of languageLabels) {
      await expect(
        languagesSection
          .locator("span.font-medium")
          .filter({ hasText: new RegExp(label, "i") })
          .first()
      ).toBeVisible();
    }

    // Language percentages should be visible
    await expect(languagesSection.locator("text=/%/").first()).toBeVisible();

    // Language hours should be visible
    await expect(languagesSection.locator("text=/\\d+\\.?\\d*h/").first()).toBeVisible();
  });

  test("should display last commit information", async ({ page }) => {
    await waitForDevData(page);

    const repoSection = page.getByRole("heading", { name: /Active Repositories/ }).locator("..");

    // Commit messages should be visible in repository cards
    const commitMessage = repoSection.locator("text=/feat:|fix:|chore:|docs:/i");
    await expect(commitMessage.first()).toBeVisible();

    // Commit dates should be visible
    await expect(repoSection.getByText(/\d+\s+Commits?\s+This Month/i).first()).toBeVisible();
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await waitForDevData(page);

    // Back to Dashboard link
    const backLink = page.getByRole("link", { name: /Back to Dashboard/ });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test("should work in Chinese locale", async ({ page }) => {
    await page.goto("/zh/about/dev");
    await waitForDevData(page);

    // Chinese text should be visible
    await expect(page.getByRole("heading", { name: /开发活动/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /本周/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /本月/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /今年/ })).toBeVisible();
  });

  test("should display language bar charts", async ({ page }) => {
    await waitForDevData(page);

    // Language percentages create visual bars
    const languagesSection = page
      .getByRole("heading", { name: /Programming Languages/ })
      .locator("..");
    await expect(languagesSection).toBeVisible();

    const bars = languagesSection.locator("div.h-2 div");
    await expect(bars.first()).toBeVisible();
    await expect(bars).toHaveCount(4);
  });

  test("should handle loading state", async ({ page }) => {
    // Intercept API to delay response
    await page.route("**/api/about/live/dev", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/about/dev");

    // Should show loading skeletons
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();

    // Eventually data should load
    await waitForDevData(page);
    await expect(page.getByRole("heading", { name: /Active Repositories/ })).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/about/dev");
    await waitForDevData(page);

    // Content should be visible and stacked
    await expect(page.getByRole("heading", { name: /Development Activity/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /This Week/ })).toBeVisible();
  });

  test("should display repository languages", async ({ page }) => {
    await waitForDevData(page);

    // Repository cards should show language badges
    await expect(page.getByRole("heading", { name: /Active Repositories/ })).toBeVisible();

    // Language badges in repository cards
    const languageBadges = page.locator("text=/TypeScript|Python|JavaScript|Go/");
    await expect(languageBadges.first()).toBeVisible();
  });

  test("should display month statistics with PRs", async ({ page }) => {
    await waitForDevData(page);

    // This Month section should show PRs
    const monthCard = page.getByRole("heading", { name: /This Month/ }).locator("..");
    await expect(monthCard.getByText(/PRs?/i)).toBeVisible();
  });

  test("should display year statistics with stars", async ({ page }) => {
    await waitForDevData(page);

    // This Year section should show stars (value rendered as number)
    const thisYearCard = page.getByRole("heading", { name: /This Year/ }).locator("..");
    await expect(thisYearCard.getByText(/\b\d+\b/).first()).toBeVisible();
    await expect(thisYearCard.getByText(/repos?/i)).toBeVisible();
  });
});
