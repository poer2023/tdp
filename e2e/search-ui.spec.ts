import { test, expect } from "@playwright/test";

test.describe("Header search UI", () => {
  test("expands smoothly and shows dropdown (EN)", async ({ page, browserName }) => {
    await page.goto("/");

    // Navigation header screenshot before
    const navHeader = page.getByRole("banner");
    await navHeader.screenshot({ path: `test-results/search-header-before-${browserName}-en.png` });

    // Click search icon
    const button = page.getByRole("button", { name: /search/i });
    await expect(button).toBeVisible();
    await button.click();

    // Input should appear with transition
    const input = page.getByPlaceholder(/search posts|搜索文章/i);
    await expect(input).toBeVisible();
    // Wait for input to be ready for interaction
    await expect(input).toBeFocused({ timeout: 500 });
    await navHeader.screenshot({ path: `test-results/search-header-open-${browserName}-en.png` });

    await input.fill("nextjs");

    // Dropdown appears when there's input text
    const dropdown = page.getByTestId("search-dropdown");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    const box = await dropdown.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
    }
  });

  test("works in ZH locale without layout shift", async ({ page, browserName }) => {
    await page.goto("/zh");

    // Navigation header baseline
    const navHeader = page.getByRole("banner");
    await navHeader.screenshot({ path: `test-results/search-header-before-${browserName}-zh.png` });

    const button = page.getByRole("button", { name: /search/i });
    await button.click();
    const input = page.getByPlaceholder(/搜索文章|search posts/i);
    await expect(input).toBeVisible();
    await expect(input).toBeFocused({ timeout: 500 });

    // Ensure the header height is stable (no layout push)
    const h1 = await navHeader.boundingBox();
    await navHeader.screenshot({ path: `test-results/search-header-open-${browserName}-zh.png` });

    // Type query to render results pane
    await input.fill("测试");

    // Dropdown appears when there's input text
    const dd2 = page.getByTestId("search-dropdown");
    await expect(dd2).toBeVisible({ timeout: 5000 });
    const box2 = await dd2.boundingBox();
    const viewport2 = page.viewportSize();
    if (box2 && viewport2) {
      expect(box2.x).toBeGreaterThanOrEqual(0);
      expect(box2.x + box2.width).toBeLessThanOrEqual(viewport2.width + 0.5);
      expect(box2.y).toBeGreaterThanOrEqual(0);
      expect(box2.y + box2.height).toBeLessThanOrEqual(viewport2.height + 0.5);
    }

    // Verify header box didn't change significantly (<= 2px tolerance)
    const h2 = await navHeader.boundingBox();
    expect(h1 && h2).toBeTruthy();
    if (h1 && h2) {
      expect(Math.abs(h1.height - h2.height)).toBeLessThanOrEqual(2);
    }
  });
});
