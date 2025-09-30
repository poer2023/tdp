import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to posts page", async ({ page }) => {
    await page.goto("/");

    // Click on "查看全部文章" link
    await page.getByRole("link", { name: /查看全部文章/ }).click();

    await expect(page).toHaveURL("/posts");
    // The posts page header is "全部文章"
    await expect(page.getByRole("heading", { level: 1, name: "全部文章" })).toBeVisible();
  });

  test("should navigate to gallery page", async ({ page }) => {
    await page.goto("/");

    // Click on "查看相册" link
    await page.getByRole("link", { name: /查看相册/ }).click();

    await expect(page).toHaveURL("/gallery");
    // Avoid ambiguous text matches; assert on the H1 heading.
    await expect(page.getByRole("heading", { level: 1, name: "灵感相册" })).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Try to access admin page (should redirect to login)
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login/);
  });
});
