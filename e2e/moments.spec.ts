import { test, expect } from "@playwright/test";
import { loginAsUser } from "./utils/auth";

const oneImage = "e2e/fixtures/gallery/d2983206585b4d9e8676bb2ee32d3182.jpg";

async function openComposer(page) {
  await page.goto("/m?compose=1");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // Wait for dialog animation
  await expect(page.getByText("新建瞬间")).toBeVisible({ timeout: 10000 });
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
    await page.waitForTimeout(1000); // Wait for dialog animation
    await expect(page.getByText("新建瞬间")).toBeVisible({ timeout: 10000 });

    // Close
    await page.getByRole("button", { name: /关闭|close/i }).click();
    await page.waitForTimeout(500); // Wait for dialog close animation

    // Query open
    await page.goto("/m?compose=1");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // Wait for dialog animation
    await expect(page.getByText("新建瞬间")).toBeVisible({ timeout: 10000 });
  });

  test("admin sees delete icon; regular does not", async ({ page }) => {
    // Create a moment as admin so previewUrl is generated
    await loginAsUser(page, "admin");
    await publishMoment(page, 1);
    // Admin should see delete icon
    await expect(page.locator('button[aria-label="删除"]').first()).toBeVisible();

    // Regular user should not
    await loginAsUser(page, "regular");
    await page.goto("/m");
    await expect(page.locator('button[aria-label="删除"]').first()).toHaveCount(0);
  });

  test("+N overlay opens detail with lightbox", async ({ page }) => {
    await loginAsUser(page, "admin");
    await publishMoment(page, 5);
    // Click +N overlay (e.g., +1)
    const plusOverlay = page.locator('a:has-text("+")').first();
    await expect(plusOverlay).toBeVisible();
    await plusOverlay.click();
    await expect(page).toHaveURL(/\/m\//);
    // Lightbox backdrop should be visible
    await expect(page.locator("div.fixed.inset-0")).toBeVisible();
  });

  test("list uses webp previews", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/m");
    // pick first card image
    const img = page.locator("img").first();
    const src = await img.getAttribute("src");
    expect(src).toBeTruthy();
    if (src) expect(src.endsWith(".webp") || src.includes(".webp")).toBeTruthy();
  });
});
