import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to posts page", async ({ page }) => {
    await page.goto("/");

    // Click on "查看全部文章" link
    await page.getByText("查看全部文章").click();

    await expect(page).toHaveURL("/posts");
    await expect(page.getByText("文章列表")).toBeVisible();
  });

  test("should navigate to gallery page", async ({ page }) => {
    await page.goto("/");

    // Click on "查看相册" link
    await page.getByText("查看相册").click();

    await expect(page).toHaveURL("/gallery");
    await expect(page.getByText("相册")).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Try to access admin page (should redirect to login)
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login/);
  });
});
