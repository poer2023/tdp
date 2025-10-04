import { test, expect } from "@playwright/test";
import { waitForNetworkIdle } from "./helpers/wait-helpers";

test.describe("Home Page", () => {
  test("should display hero section", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Check hero section elements - support both EN and ZH after i18n
    const h1 = page.getByRole("heading", { level: 1 });
    const h1Text = await h1.textContent();

    expect(
      h1Text?.includes("清新简约的个人博客") || h1Text?.includes("Clean & Minimalist Personal Blog")
    ).toBe(true);

    // Check navigation elements exist (language-independent)
    const buttons = page.locator("a[href*='#posts'], a[href*='#gallery']");
    expect(await buttons.count()).toBeGreaterThanOrEqual(2);

    // Check sections - match either language
    const sections = await page.locator("h2").allTextContents();
    const hasPostsSection = sections.some(
      (text) => text.includes("最新文章") || text.includes("Latest Posts")
    );
    const hasGallerySection = sections.some(
      (text) => text.includes("灵感相册") || text.includes("Photo Gallery")
    );

    expect(hasPostsSection).toBe(true);
    expect(hasGallerySection).toBe(true);
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title).toBeTruthy();

    // Check if page loads without console errors
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    await page.waitForLoadState("networkidle");
    expect(logs.length).toBe(0);
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const h1Mobile = page.getByRole("heading", { level: 1 });
    const h1MobileText = await h1Mobile.textContent();
    expect(
      h1MobileText?.includes("清新简约的个人博客") ||
        h1MobileText?.includes("Clean & Minimalist Personal Blog")
    ).toBe(true);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    const h1Desktop = page.getByRole("heading", { level: 1 });
    const h1DesktopText = await h1Desktop.textContent();
    expect(
      h1DesktopText?.includes("清新简约的个人博客") ||
        h1DesktopText?.includes("Clean & Minimalist Personal Blog")
    ).toBe(true);
  });
});
