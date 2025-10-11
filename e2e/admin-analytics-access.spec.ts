import { test, expect } from "@playwright/test";
import { loginAsUser } from "./utils/auth";

test.describe("Admin Analytics Access", () => {
  test("Analytics navigation item should be visible and navigate correctly", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/admin");

    // Find the Analytics navigation item in the sidebar
    const analyticsNavItem = page.getByRole("link", { name: /Analytics|访问统计/ });
    await expect(analyticsNavItem).toBeVisible();

    // Click the Analytics navigation item
    await analyticsNavItem.click();

    // Should navigate to Analytics page
    await expect(page).toHaveURL(/\/admin\/analytics/);

    // Page should have the Analytics heading (matches both languages)
    const heading = page.getByRole("heading", { level: 1 });
    const headingText = await heading.textContent();
    expect(headingText?.includes("Analytics") || headingText?.includes("访问统计")).toBe(true);
  });

  test("Analytics quick action card should be visible on dashboard and navigate correctly", async ({
    page,
  }) => {
    await loginAsUser(page, "admin");
    await page.goto("/admin");

    // Find the Analytics quick action card (by icon and title)
    const analyticsCard = page
      .locator("div")
      .filter({ has: page.locator("svg") }) // Has an icon
      .filter({ hasText: /Analytics|访问统计/ }); // Has the title text

    await expect(analyticsCard).toBeVisible();

    // Find the "View Analytics" / "查看统计" button within the card
    const viewButton = analyticsCard.getByRole("link", { name: /View Analytics|查看统计/ });
    await expect(viewButton).toBeVisible();

    // Click the button
    await viewButton.click();

    // Should navigate to Analytics page
    await expect(page).toHaveURL(/\/admin\/analytics/);

    // Page should have the Analytics heading (matches both languages)
    const heading = page.getByRole("heading", { level: 1 });
    const headingText = await heading.textContent();
    expect(headingText?.includes("Analytics") || headingText?.includes("访问统计")).toBe(true);
  });

  test("Analytics page should display metric cards with i18n support", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/admin/analytics");

    // Check for metric cards (at least the key ones)
    // These should be visible in either language
    const metricCards = page.locator("div.rounded-3xl").filter({ has: page.locator("p.text-3xl") });
    const cardCount = await metricCards.count();

    // Should have 4 metric cards: Today's Visits, Weekly Visits, Total Visitors, Average Visits
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Check that at least one card has the i18n text
    const firstCardText = await metricCards.first().textContent();
    expect(
      firstCardText?.includes("Today") ||
        firstCardText?.includes("今日") ||
        firstCardText?.includes("Weekly") ||
        firstCardText?.includes("本周") ||
        firstCardText?.includes("Total") ||
        firstCardText?.includes("总访客") ||
        firstCardText?.includes("Average") ||
        firstCardText?.includes("平均")
    ).toBe(true);
  });

  test("Analytics navigation should be highlighted when on analytics page", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/admin/analytics");

    // The Analytics nav item should have the active state
    // In admin-nav.tsx, active items have bg-zinc-100 dark:bg-zinc-900/60
    const analyticsNavItem = page.getByRole("link", { name: /Analytics|访问统计/ }).locator("..");

    // Check that the parent element has the active background class
    const classes = await analyticsNavItem.getAttribute("class");
    expect(classes).toContain("bg-zinc-100");
  });
});
