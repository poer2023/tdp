import { test, expect } from "@playwright/test";

/**
 * E2E Test: Finance Detail Page
 *
 * Validates the finance overview page with privacy focus:
 * - Privacy notice is prominently displayed
 * - NO real financial amounts visible
 * - Only normalized and relative data shown
 * - Monthly trends and categories display
 * - Navigation and internationalization
 */

test.describe("Finance Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about/finance");
  });

  test("should display privacy notice prominently", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Privacy notice should be visible at top
    await expect(page.locator("text=/All financial data is anonymized/")).toBeVisible();

    // Shield icon should be visible
    const shieldIcon = page.locator("svg").first();
    await expect(shieldIcon).toBeVisible();
  });

  test("should display finance overview", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Page title
    await expect(page.locator("text=Finance Overview")).toBeVisible();

    // Main sections should be visible
    await expect(page.locator("text=Monthly Spending Trend")).toBeVisible();
    await expect(page.locator("text=Spending Categories")).toBeVisible();
    await expect(page.locator("text=Active Subscriptions")).toBeVisible();
  });

  test("should display monthly spending trend", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Monthly Spending Trend section
    await expect(page.locator("text=Monthly Spending Trend")).toBeVisible();

    // Month labels should be visible
    await expect(page.locator("text=/Jan|Feb|Mar|Apr/")).toBeVisible();

    // Trend chart should be visible
    const chart = page.locator("canvas, svg").first();
    await expect(chart).toBeVisible();
  });

  test("should display spending categories", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Spending Categories section
    await expect(page.locator("text=Spending Categories")).toBeVisible();

    // Category names should be visible
    await expect(page.locator("text=/Housing|Food|Transportation|Entertainment/")).toBeVisible();

    // Percentages should be visible
    await expect(page.locator("text=/%/")).toBeVisible();
  });

  test("should NOT display real financial amounts", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Get all text content from the page
    const pageText = await page.textContent("body");

    // Should NOT contain real money patterns:
    // - $123 format
    expect(pageText).not.toMatch(/\$\d+\b/);

    // - 123.45 decimal amounts
    expect(pageText).not.toMatch(/\d+\.\d{2}\b/);

    // - 1,234 comma-separated amounts
    expect(pageText).not.toMatch(/\d{1,3},\d{3}/);

    // Should ONLY show percentages and relative information
    expect(pageText).toContain("%");
  });

  test("should display only category percentages", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Categories should show percentages only
    await expect(page.locator("text=Spending Categories")).toBeVisible();

    // Get all percentage values
    const percentages = await page.locator("text=/%/").allTextContents();

    // All percentages should be between 0-100%
    percentages.forEach((pct) => {
      const value = parseInt(pct);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  test("should display active subscriptions", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Active Subscriptions section
    await expect(page.locator("text=Active Subscriptions")).toBeVisible();

    // Subscription names should be visible
    await expect(page.locator("text=/Netflix|Spotify|GitHub|AWS/")).toBeVisible();
  });

  test("should display obscured subscription amounts", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Subscription amounts should be obscured as "$", "$$", "$$$"
    const obscuredAmounts = page.locator("text=/^\\$+$/");
    await expect(obscuredAmounts.first()).toBeVisible();

    // Get all obscured amounts
    const amounts = await obscuredAmounts.allTextContents();

    // All amounts should be ONLY dollar signs, NO numbers
    amounts.forEach((amount) => {
      expect(amount).toMatch(/^\$+$/);
      expect(amount).not.toMatch(/\d/);
    });
  });

  test("should display renewal dates", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Renewal dates should be visible
    await expect(page.locator("text=/Jan|Feb|Mar|Apr/")).toBeVisible();
  });

  test("should display insights", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Insights section
    await expect(page.locator("text=Insights")).toBeVisible();

    // Insights should contain relative information only
    const insights = await page.locator("text=Insights").locator("..").textContent();

    // Should NOT contain real amounts
    expect(insights).not.toMatch(/\$\d+/);
    expect(insights).not.toMatch(/\d+\.\d{2}/);

    // Should contain relative terms
    expect(insights).toMatch(/increased|decreased|within|above|below|%/);
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
    await page.goto("/zh/about/finance");
    await page.waitForLoadState("networkidle");

    // Chinese text should be visible
    await expect(page.locator("text=财务概览")).toBeVisible();
    await expect(page.locator("text=月度支出趋势")).toBeVisible();
    await expect(page.locator("text=支出分类")).toBeVisible();
    await expect(page.locator("text=活跃订阅")).toBeVisible();

    // Privacy notice in Chinese
    await expect(page.locator("text=/所有财务数据均已匿名化/")).toBeVisible();
  });

  test("should display category distribution chart", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Category distribution should have visual representation
    await expect(page.locator("text=Spending Categories")).toBeVisible();

    // Multiple categories should be listed
    const categories = page.locator("text=/Housing|Food|Transportation|Entertainment/");
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should handle loading state", async ({ page }) => {
    // Intercept API to delay response
    await page.route("**/api/about/finance", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/about/finance");

    // Should show loading skeletons
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();

    // Eventually data should load
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Monthly Spending Trend")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/about/finance");
    await page.waitForLoadState("networkidle");

    // Content should be visible and stacked
    await expect(page.locator("text=Finance Overview")).toBeVisible();
    await expect(page.locator("text=Monthly Spending Trend")).toBeVisible();

    // Privacy notice should still be prominent
    await expect(page.locator("text=/All financial data is anonymized/")).toBeVisible();
  });

  test("should display normalized monthly trend values", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Monthly trend should be displayed
    await expect(page.locator("text=Monthly Spending Trend")).toBeVisible();

    // Chart should show normalized data (no actual amounts)
    const pageText = await page.textContent("body");

    // Should NOT show actual dollar amounts in chart
    expect(pageText).not.toMatch(/\$\d{2,}/);
  });

  test("should never expose account numbers or balances", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check page content
    const content = await page.content();

    // Should NOT contain account-related attributes
    expect(content).not.toContain("account-number");
    expect(content).not.toContain("balance");
    expect(content).not.toContain("total-amount");

    // Should NOT contain actual money values
    expect(content).not.toMatch(/\$\d+\.\d{2}/);
  });

  test("should have clear privacy messaging", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Privacy notice should be clear and prominent
    const privacyNotice = page.locator("text=/All financial data is anonymized/");
    await expect(privacyNotice).toBeVisible();

    // Notice should be at the top of content
    const boundingBox = await privacyNotice.boundingBox();
    expect(boundingBox?.y).toBeLessThan(400); // Should be near top
  });

  test("should display only relative insights", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Insights should be present
    await expect(page.locator("text=Insights")).toBeVisible();

    // Get all insight text
    const insightText = await page.locator("text=Insights").locator("..").textContent();

    // Insights should contain relative terms only
    const hasRelativeTerms =
      /increased|decreased|higher|lower|above|below|within|compared to|%/.test(insightText || "");
    expect(hasRelativeTerms).toBe(true);

    // Should NOT contain absolute amounts
    expect(insightText).not.toMatch(/\$\d+/);
  });

  test("should display subscription count", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Subscription count should be visible
    await expect(page.locator("text=Active Subscriptions")).toBeVisible();

    // Individual subscriptions should be listed
    const subscriptions = page.locator("text=/Netflix|Spotify|GitHub|Apple|Amazon/");
    const count = await subscriptions.count();
    expect(count).toBeGreaterThan(0);
  });
});
