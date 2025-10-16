import { test, expect } from "@playwright/test";

/**
 * E2E Test: Social Detail Page
 *
 * Validates the social activity detail page with privacy focus:
 * - Privacy notice is prominently displayed
 * - NO personal information visible
 * - Only anonymized data shown
 * - Platform statistics display
 * - Navigation and internationalization
 */

test.describe("Social Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/about/live/social");
  });

  test("should display privacy notice prominently", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Privacy notice should be visible at top
    await expect(page.locator("text=/All interactions are fully anonymized/")).toBeVisible();

    // Shield icon should be visible
    const shieldIcon = page.locator("svg").first();
    await expect(shieldIcon).toBeVisible();
  });

  test("should display social statistics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Page title
    await expect(page.locator("text=Social Activity")).toBeVisible();

    // Statistics sections
    await expect(page.locator("text=This Week")).toBeVisible();
    await expect(page.locator("text=This Month")).toBeVisible();

    // Should display conversation and call counts
    await expect(page.locator("text=/\\d+ conversations?/")).toBeVisible();
    await expect(page.locator("text=/\\d+ calls?/")).toBeVisible();
  });

  test("should display active people and groups", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Active People section
    await expect(page.locator("text=Active People")).toBeVisible();
    await expect(page.locator("text=/\\d+ people/")).toBeVisible();

    // Active Groups section
    await expect(page.locator("text=Active Groups")).toBeVisible();
    await expect(page.locator("text=/\\d+ groups?/")).toBeVisible();
  });

  test("should display platform distribution", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Platform Distribution section
    await expect(page.locator("text=Platform Distribution")).toBeVisible();

    // Platform names should be visible
    await expect(page.locator("text=/WeChat|Telegram|Discord|Email/")).toBeVisible();

    // Platform counts should be visible
    await expect(page.locator("text=/\\d+/")).toBeVisible();
  });

  test("should display recent activity", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Recent Activity section
    await expect(page.locator("text=Recent Activity")).toBeVisible();

    // Activity types should be visible
    await expect(page.locator("text=/chat|call|group/i")).toBeVisible();
  });

  test("should NOT display any personal information", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Get all text content from the page
    const pageText = await page.textContent("body");

    // Should NOT contain:
    // - Email patterns
    expect(pageText).not.toMatch(/@\w+\.\w+/);

    // - Phone number patterns
    expect(pageText).not.toMatch(/\d{3}-\d{3}-\d{4}/);
    expect(pageText).not.toMatch(/\+\d{10,}/);

    // - Personal name fields
    expect(pageText?.toLowerCase()).not.toContain("realname");
    expect(pageText?.toLowerCase()).not.toContain("fullname");
    expect(pageText?.toLowerCase()).not.toContain("actualname");

    // Should ONLY contain anonymized IDs
    await expect(page.locator("text=/user_[a-z0-9]+/")).toBeVisible();
  });

  test("should display only anonymized user IDs", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Anonymized IDs should follow pattern: user_xxxxx
    await expect(page.locator("text=/user_[a-z0-9]+/")).toBeVisible();

    // Get all visible user IDs
    const userIds = await page.locator("text=/user_[a-z0-9]+/").allTextContents();

    // All IDs should match the anonymized pattern
    userIds.forEach((id) => {
      expect(id).toMatch(/^user_[a-z0-9]+$/);
    });
  });

  test("should display call durations", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Call durations should be visible
    await expect(page.locator("text=/\\d+ min/")).toBeVisible();
  });

  test("should display timestamps", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Relative or absolute timestamps should be visible
    await expect(page.locator("text=/ago|hours?|minutes?|Jan|Feb|Mar/")).toBeVisible();
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
    await page.goto("/zh/about/live/social");
    await page.waitForLoadState("networkidle");

    // Chinese text should be visible
    await expect(page.locator("text=社交活动")).toBeVisible();
    await expect(page.locator("text=本周")).toBeVisible();
    await expect(page.locator("text=本月")).toBeVisible();

    // Privacy notice in Chinese
    await expect(page.locator("text=/所有互动数据均已完全匿名化/")).toBeVisible();
  });

  test("should display platform statistics chart", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Platform distribution should have visual representation
    await expect(page.locator("text=Platform Distribution")).toBeVisible();

    // Multiple platforms should be listed
    const platforms = page.locator("text=/WeChat|Telegram|Discord/");
    const count = await platforms.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should handle loading state", async ({ page }) => {
    // Intercept API to delay response
    await page.route("**/api/about/live/social", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto("/en/about/live/social");

    // Should show loading skeletons
    const skeletons = page.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible();

    // Eventually data should load
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Recent Activity")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/about/live/social");
    await page.waitForLoadState("networkidle");

    // Content should be visible and stacked
    await expect(page.locator("text=Social Activity")).toBeVisible();
    await expect(page.locator("text=This Week")).toBeVisible();

    // Privacy notice should still be prominent
    await expect(page.locator("text=/All interactions are fully anonymized/")).toBeVisible();
  });

  test("should never expose username or email", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check page content
    const content = await page.content();

    // Should NOT contain username attribute
    expect(content).not.toContain("username=");
    expect(content).not.toContain("data-username");

    // Should NOT contain email attribute
    expect(content).not.toContain("email=");
    expect(content).not.toContain("data-email");
    expect(content).not.toContain("@");
  });

  test("should display privacy-safe interaction types", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Interaction types are safe to display
    await expect(page.locator("text=/chat|call|group/i")).toBeVisible();

    // Platform names are safe to display
    await expect(page.locator("text=/WeChat|Telegram|Discord/")).toBeVisible();

    // Timestamps are safe to display
    await expect(page.locator("text=/ago|Jan|Feb/")).toBeVisible();
  });

  test("should have clear privacy messaging", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Privacy notice should be clear and prominent
    const privacyNotice = page.locator("text=/All interactions are fully anonymized/");
    await expect(privacyNotice).toBeVisible();

    // Notice should be at the top of content
    const boundingBox = await privacyNotice.boundingBox();
    expect(boundingBox?.y).toBeLessThan(400); // Should be near top
  });
});
