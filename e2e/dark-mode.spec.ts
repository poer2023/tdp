import { test, expect } from "@playwright/test";
import { waitForNetworkIdle } from "./helpers/wait-helpers";

async function enableDarkBeforeNavigation(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("theme", "dark");
    } catch {}
  });
}

async function ensureHealthy(page) {
  // If Next error overlay appears, reload once
  const isError = await page
    .locator("#__next_error__")
    .isVisible()
    .catch(() => false);
  if (isError) {
    await page.reload({ waitUntil: "networkidle" });
  }
}

test.describe("Dark mode", () => {
  test("applies across key pages and matches snapshots", async ({ page, browserName }) => {
    await enableDarkBeforeNavigation(page);

    // Consistent viewport for stable screenshots
    await page.setViewportSize({ width: 1280, height: 900 });

    const paths = ["/en", "/en/posts", "/en/gallery"];
    for (const p of paths) {
      await page.goto(p);
      await waitForNetworkIdle(page);
      await ensureHealthy(page);
      // Ensure dark class is applied
      await expect(page.locator("html")).toHaveClass(/dark/);

      // Check key colors (background ~ iOS dark, text is light)
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const color = await page.evaluate(() => getComputedStyle(document.body).color);
      // Accept either base iOS dark (28,28,30) or elevated (44,44,46)
      // Also accept hex format or rgba with same RGB values
      expect(bg).toMatch(/rgb\(\s*(28|44),\s*\1,\s*(30|46)\s*\)|rgba\(\s*28,\s*28,\s*30|#1c1c1e/i);
      // Text should be light (not dark gray like rgb(17,17,17))
      expect(color).toMatch(/rgb\(\s*2\d{2},|#f[0-9a-f]/i); // Light colors start with 2xx RGB or high hex values

      // Take viewport screenshot instead of full page to avoid dynamic content issues
      await expect(page).toHaveScreenshot({
        fullPage: false, // Only capture viewport to avoid dynamic content height issues
        animations: "disabled",
        mask: [page.locator("video, canvas")],
        maxDiffPixelRatio: 0.02, // 2% tolerance for rendering variations
      });
    }
  });

  test("toggle button switches theme at runtime", async ({ page }) => {
    await enableDarkBeforeNavigation(page);
    await page.goto("/en");
    await waitForNetworkIdle(page);
    await ensureHealthy(page);

    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeVisible();

    // Compare background colors before/after to assert theme switch
    const readBg = async () =>
      await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const before = await readBg();
    await toggle.click(); // switch theme
    await page.waitForTimeout(150);
    const after = await readBg();
    expect(after).not.toBe(before);

    // Toggle back and ensure it returns
    await toggle.click();
    await page.waitForTimeout(150);
    const again = await readBg();
    expect(again).toBe(before);
  });
});
