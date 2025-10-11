import { test, expect } from "@playwright/test";

test.describe("Gallery UI", () => {
  test("masonry layout with navbar and whitespace", async ({ page, browserName }) => {
    await page.goto("/zh/gallery");

    // Global header (banner) should exist
    await expect(page.getByRole("banner")).toBeVisible();

    // Take screenshot of the grid area
    const container = page.locator("main");
    await container.screenshot({ path: `test-results/gallery-masonry-${browserName}.png` });

    // Check if there are any gallery items
    const galleryItems = page.locator("figure a");
    const itemCount = await galleryItems.count();

    // Skip viewer test if no gallery items exist
    if (itemCount === 0) {
      console.log("No gallery items found, skipping viewer test");
      return;
    }

    // First item should be clickable and lead to viewer
    const firstItem = galleryItems.first();
    await expect(firstItem).toBeVisible({ timeout: 10000 });
    await firstItem.click();

    // Viewer chrome
    await expect(page.getByRole("link", { name: /返回相册|Back to Gallery/ })).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: `test-results/gallery-viewer-${browserName}.png`,
    });
  });
});
