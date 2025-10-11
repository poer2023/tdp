import { test, expect } from "@playwright/test";
import { loginAsUser } from "./utils/auth";

test.describe("Admin Gallery UI (smoke)", () => {
  test("bulk upload panel lists selected files without submission", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/admin/gallery");

    // Bulk upload panel visible
    await expect(page.getByText("批量上传")).toBeVisible();

    // Set files on hidden input
    const panel = page.getByTestId("bulk-upload-panel");
    const fileInput = panel.locator('input[name="files"]');
    await fileInput.setInputFiles(["e2e/fixtures/gallery/d2983206585b4d9e8676bb2ee32d3182.jpg"]);

    // The list should render the file name
    await expect(page.getByText(/d2983206585b4d9e8676bb2ee32d3182\.jpg/)).toBeVisible();
  });

  test("selection mode + open bulk edit drawer (no submit)", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/admin/gallery");

    // Check if any gallery items exist
    const galleryItems = page.locator("figure");
    const itemCount = await galleryItems.count();

    if (itemCount === 0) {
      console.log("No gallery items found, skipping selection mode test");
      return;
    }

    // Enter selection mode - button only appears when items exist
    const selectionModeButton = page.getByRole("button", { name: "进入选择模式" });
    await expect(selectionModeButton).toBeVisible();
    await selectionModeButton.click();

    // First checkbox appears
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.check();

    // Open drawer
    const editBtn = page.getByRole("button", { name: /批量编辑/ });
    await expect(editBtn).toBeEnabled();
    await editBtn.click();
    await expect(page.getByRole("heading", { name: "批量编辑" })).toBeVisible();

    // Fill a field but do not submit
    await page.locator('input[name="title.set"]').fill("批量测试");
  });
});
