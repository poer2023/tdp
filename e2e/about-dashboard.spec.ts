import { test, expect } from "@playwright/test";

/**
 * E2E Test: Life Log Dashboard
 *
 * This test validates the Life Log dashboard:
 * - Page loads successfully
 * - Key sections render
 * - Internationalization (en/zh) works
 * - Responsive behavior on mobile/tablet
 */
test.describe("Life Log Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
  });

  test("should render Life Log dashboard", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Life Log/ })).toBeVisible();
    await expect(page.getByText(/Quantifying the hobbies/)).toBeVisible();
  });

  test("should render key sections", async ({ page }) => {
    await expect(page.getByText("Shutter Count")).toBeVisible();
    await expect(page.getByText("Weekly Routine")).toBeVisible();
    await expect(page.getByText("Daily Steps")).toBeVisible();
  });

  test("should work in Chinese locale", async ({ page }) => {
    await page.goto("/zh/about");
    await expect(page.getByRole("heading", { name: /生活记录/ })).toBeVisible();
    await expect(page.getByText("快门次数")).toBeVisible();
    await expect(page.getByText("每周日程")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /Life Log/ })).toBeVisible();
  });

  test("should be responsive on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /Life Log/ })).toBeVisible();
  });

  test("should render icons", async ({ page }) => {
    const icons = page.locator("svg:visible");
    await expect(icons.first()).toBeVisible();
  });
});
