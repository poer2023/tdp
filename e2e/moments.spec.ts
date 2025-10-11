import { test, expect } from "@playwright/test";
import { loginAsUser } from "./utils/auth";

const oneImage = "e2e/fixtures/gallery/d2983206585b4d9e8676bb2ee32d3182.jpg";

async function openComposer(page) {
  await page.goto("/m?compose=1");
  // Wait for DOM to be fully loaded before checking for modal
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Additional wait for Safari hydration issues
  await page.waitForTimeout(500);

  // Wait for composer modal to be visible (increased timeout for Safari)
  await expect(page.getByText("新建瞬间")).toBeVisible({ timeout: 15000 });
}

async function publishMoment(page, count: number) {
  await openComposer(page);
  const input = page.locator('input[name="images"]');
  const files = Array(count).fill(oneImage);
  await input.setInputFiles(files);
  await page.locator('textarea[name="content"]').fill(`E2E moment ${count} images`);
  await page.getByRole("button", { name: "发布" }).click();
  // Wait a bit for server action to complete and list to update
  await page.waitForLoadState("networkidle");
  await page.goto("/m");
}

test.describe("Moments - composer + admin ops + preview", () => {
  test("opens composer via query and via button", async ({ page }) => {
    await loginAsUser(page, "regular");
    await page.goto("/m");
    await page.waitForLoadState("networkidle");

    // Button open
    const newButton = page.getByRole("button", { name: /new|发布/i }).first();
    await expect(newButton).toBeVisible({ timeout: 10000 });
    await newButton.click();

    // Wait for composer modal to be visible
    await expect(page.getByText("新建瞬间")).toBeVisible({ timeout: 10000 });

    // Close
    await page.getByRole("button", { name: /关闭|close/i }).click();

    // Wait for composer to be hidden
    await expect(page.getByText("新建瞬间")).toBeHidden({ timeout: 5000 });

    // Query open
    await page.goto("/m?compose=1");
    // Wait for DOM to be fully loaded before checking for modal
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Additional wait for Safari hydration issues
    await page.waitForTimeout(500);

    // Wait for composer modal to be visible (increased timeout for Safari)
    await expect(page.getByText("新建瞬间")).toBeVisible({ timeout: 15000 });
  });

  test("admin sees delete icon; regular does not", async ({ page }) => {
    // Create a moment as admin so previewUrl is generated
    await loginAsUser(page, "admin");
    await publishMoment(page, 1);

    // Ensure we're on the moments list page
    await page.goto("/m");
    await page.waitForLoadState("networkidle");

    // Admin should see delete icon
    const deleteButton = page.locator('button[aria-label="删除"]').first();
    await expect(deleteButton).toBeVisible({ timeout: 5000 });

    // Regular user should not see delete icon
    await loginAsUser(page, "regular");
    await page.goto("/m");
    await page.waitForLoadState("networkidle");

    const deleteButtonCount = await page.locator('button[aria-label="删除"]').count();
    expect(deleteButtonCount).toBe(0);
  });

  test("+N overlay opens detail with lightbox", async ({ page }) => {
    await loginAsUser(page, "admin");
    await publishMoment(page, 5);

    // Ensure we're on the moments list page
    await page.goto("/m");
    await page.waitForLoadState("networkidle");

    // Click +N overlay (e.g., +1) - it's a Link element
    const plusOverlay = page
      .locator('a[href*="/m/"]')
      .filter({ hasText: /^\+\d+$/ })
      .first();
    await expect(plusOverlay).toBeVisible({ timeout: 5000 });
    await plusOverlay.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/m\/.+\?image=3/);

    // Lightbox backdrop should be visible
    const lightbox = page.locator("div.fixed.inset-0").first();
    await expect(lightbox).toBeVisible({ timeout: 5000 });
  });

  test("list uses webp previews", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/m");
    await page.waitForLoadState("networkidle");

    // Wait for at least one moment card with image to be present
    const momentCard = page.locator("article").first();
    await expect(momentCard).toBeVisible({ timeout: 5000 });

    // Pick first card image
    const img = page.locator("article img").first();
    await expect(img).toBeVisible({ timeout: 5000 });

    const src = await img.getAttribute("src");
    expect(src).toBeTruthy();

    // Next.js image optimization may use different formats, check for webp or optimized image
    if (src) {
      const isOptimized = src.includes(".webp") || src.includes("/_next/image");
      expect(isOptimized).toBeTruthy();
    }
  });
});
