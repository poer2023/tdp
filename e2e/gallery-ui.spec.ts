import { test, expect } from "@playwright/test";

test.describe("Gallery UI", () => {
  test("masonry layout with navbar and whitespace", async ({ page, browserName }) => {
    await page.goto("/zh/gallery");

    // Global header (banner) should exist
    await expect(page.getByRole("banner")).toBeVisible();

    // Take screenshot of the grid area
    const container = page.locator("main");
    await container.screenshot({ path: `test-results/gallery-masonry-${browserName}.png` });

    // First item should be clickable and lead to viewer
    const firstItem = page.locator("figure a").first();
    await firstItem.click();

    // Viewer chrome
    await expect(page.getByRole("link", { name: /返回相册|Back to Gallery/ })).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: `test-results/gallery-viewer-${browserName}.png`,
    });
  });
});
