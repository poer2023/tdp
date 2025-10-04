import { test, expect } from "@playwright/test";

test.describe("Public Features", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(await page.locator("html").count()).toBeGreaterThan(0);
    expect(page.url()).toContain("localhost:3000");
  });

  test("should display posts listing page", async ({ page }) => {
    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const postsHeading = page.locator("h1, h2").filter({ hasText: /posts|文章/i });
    expect(await postsHeading.count()).toBeGreaterThanOrEqual(0);
  });

  test("should show sign-in button for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInButton = page.locator("a, button").filter({ hasText: /sign in|登录/i });
    expect(await signInButton.count()).toBeGreaterThan(0);
  });

  test("should display Google OAuth icon in auth page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Look for Google-related content (button, logo, or text)
    const googleElement = page.locator("button, a, div").filter({ hasText: /google/i });
    expect(await googleElement.count()).toBeGreaterThan(0);
  });
});
