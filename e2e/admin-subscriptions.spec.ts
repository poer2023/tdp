import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "./utils/auth";

test.describe("Admin Subscriptions Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "admin");
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test.describe("Subscriptions List Page", () => {
    test("should access subscriptions page at /admin/subscriptions", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      expect(page.url()).toContain("/admin/subscriptions");
      expect(await page.title()).toContain("Admin");
    });

    test("should display subscription overview with stats", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      // Should show monthly and annual spend cards
      await expect(page.getByText(/monthly spend|月度支出/i)).toBeVisible();
      await expect(page.getByText(/annual spend|年度支出/i)).toBeVisible();
    });

    test("should display add subscription button", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const addButton = page.getByRole("link", { name: /add subscription|添加订阅/i });
      await expect(addButton).toBeVisible();
      expect(await addButton.getAttribute("href")).toBe("/admin/subscriptions/new");
    });

    test("should display subscription cards when subscriptions exist", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      // Check if subscription list section exists
      const listSection = page.getByText(/subscription list|订阅列表/i);
      await expect(listSection).toBeVisible();
    });

    test("should filter subscriptions by billing cycle", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const filterSelect = page
        .locator("select")
        .filter({ hasText: /all|monthly|annual/i })
        .first();
      await filterSelect.selectOption("MONTHLY");

      await page.waitForTimeout(500);

      // Verify filter is applied
      expect(await filterSelect.inputValue()).toBe("MONTHLY");
    });

    test("should toggle between monthly and annual view", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const monthlyButton = page.getByRole("button", { name: /monthly view|月度视图/i });
      const annualButton = page.getByRole("button", { name: /annual view|年度视图/i });

      await expect(monthlyButton).toBeVisible();
      await expect(annualButton).toBeVisible();

      await annualButton.click();
      await page.waitForTimeout(300);

      // Annual button should be active
      await expect(annualButton).toHaveClass(/bg-blue-600/);
    });

    test("should export subscriptions to markdown", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const downloadPromise = page.waitForEvent("download");
      const exportButton = page.getByRole("button", { name: /download|下载|export|导出/i });

      if ((await exportButton.count()) > 0) {
        await exportButton.click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/subscriptions-\d{4}-\d{2}-\d{2}\.md/);
      }
    });
  });

  test.describe("Subscription Card Interactions", () => {
    test("should expand and collapse subscription card", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      // Find first subscription card (if any exist)
      const firstCard = page.locator('[class*="Card"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForTimeout(300);

        // Expanded content should be visible
        await expect(page.getByText(/original amount|原始金额/i).first()).toBeVisible();

        // Click again to collapse
        await firstCard.click();
        await page.waitForTimeout(300);
      }
    });

    test("should navigate to edit page when edit button is clicked", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator('[class*="Card"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForTimeout(300);

        const editLink = page.getByRole("link", { name: /edit subscription|编辑订阅/i }).first();
        await editLink.click();

        await page.waitForLoadState("networkidle");

        // Should navigate to edit page
        expect(page.url()).toMatch(/\/admin\/subscriptions\/[a-zA-Z0-9-]+/);
        await expect(page.getByText(/edit subscription|编辑订阅/i)).toBeVisible();
      }
    });

    test("should show delete confirmation dialog", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator('[class*="Card"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForTimeout(300);

        page.once("dialog", (dialog) => {
          expect(dialog.type()).toBe("confirm");
          expect(dialog.message()).toMatch(/delete|删除/i);
          dialog.dismiss();
        });

        const deleteButton = page
          .getByRole("button", { name: /delete subscription|删除订阅/i })
          .first();
        await deleteButton.click();
      }
    });
  });

  test.describe("Add New Subscription", () => {
    test("should navigate to new subscription page", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const addButton = page.getByRole("link", { name: /add subscription|添加订阅/i });
      await addButton.click();

      await page.waitForLoadState("networkidle");

      expect(page.url()).toContain("/admin/subscriptions/new");
      await expect(page.getByText(/add subscription|添加订阅/i)).toBeVisible();
    });

    test("should display breadcrumb navigation on new page", async ({ page }) => {
      await page.goto("/admin/subscriptions/new");
      await page.waitForLoadState("networkidle");

      // Check breadcrumbs
      await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
      await expect(page.getByRole("link", { name: /subscriptions/i })).toBeVisible();
      await expect(page.getByText("New")).toBeVisible();
    });

    test("should successfully create a new subscription", async ({ page }) => {
      await page.goto("/admin/subscriptions/new");
      await page.waitForLoadState("networkidle");

      const testName = `Test Subscription ${Date.now()}`;

      // Fill form
      await page.getByPlaceholder(/netflix|github|adobe/i).fill(testName);
      await page.getByPlaceholder("0.00").fill("19.99");
      await page.locator('input[type="date"]').first().fill("2024-01-01");

      // Submit form
      await page.getByRole("button", { name: /save changes|保存更改/i }).click();

      await page.waitForLoadState("networkidle");

      // Should redirect back to list page
      expect(page.url()).toContain("/admin/subscriptions");
      expect(page.url()).not.toContain("/new");

      // New subscription should be visible
      await expect(page.getByText(testName)).toBeVisible();
    });

    test("should show validation error for missing required fields", async ({ page }) => {
      await page.goto("/admin/subscriptions/new");
      await page.waitForLoadState("networkidle");

      // Try to submit without filling required fields
      await page.getByRole("button", { name: /save changes|保存更改/i }).click();

      await page.waitForTimeout(500);

      // Should show error message
      await expect(page.getByText(/please complete|请完成|required|必填/i)).toBeVisible();

      // Should still be on the new page
      expect(page.url()).toContain("/admin/subscriptions/new");
    });

    test("should allow cancellation and return to list", async ({ page }) => {
      await page.goto("/admin/subscriptions/new");
      await page.waitForLoadState("networkidle");

      // Fill some data
      await page.getByPlaceholder(/netflix|github|adobe/i).fill("Test");

      // Click cancel
      await page.getByRole("button", { name: /cancel|取消/i }).click();

      await page.waitForLoadState("networkidle");

      // Should navigate back to list
      expect(page.url()).toContain("/admin/subscriptions");
      expect(page.url()).not.toContain("/new");
    });

    test("should fill all form fields including optional ones", async ({ page }) => {
      await page.goto("/admin/subscriptions/new");
      await page.waitForLoadState("networkidle");

      const testName = `Full Test ${Date.now()}`;

      // Fill all fields
      await page.getByPlaceholder(/netflix|github|adobe/i).fill(testName);

      // Select billing cycle
      await page
        .locator("select")
        .filter({ hasText: /monthly|annual/i })
        .first()
        .selectOption("ANNUAL");

      // Select currency
      await page
        .locator("select")
        .filter({ hasText: /cny|usd|eur/i })
        .first()
        .selectOption("EUR");

      await page.getByPlaceholder("0.00").fill("99.99");

      // Fill dates
      const dateInputs = page.locator('input[type="date"]');
      await dateInputs.nth(0).fill("2024-01-01");
      await dateInputs.nth(1).fill("2024-12-31");

      // Fill notes
      await page
        .getByPlaceholder(/remarks|备注/i)
        .fill("This is a test subscription with all fields filled");

      // Submit
      await page.getByRole("button", { name: /save changes|保存更改/i }).click();

      await page.waitForLoadState("networkidle");

      expect(page.url()).toContain("/admin/subscriptions");
      await expect(page.getByText(testName)).toBeVisible();
    });
  });

  test.describe("Edit Existing Subscription", () => {
    test("should navigate to edit page with pre-filled form", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator('[class*="Card"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        // Get subscription name for verification
        const subscriptionName = await firstCard.locator("h3").first().textContent();

        await firstCard.click();
        await page.waitForTimeout(300);

        const editLink = page.getByRole("link", { name: /edit subscription|编辑订阅/i }).first();
        await editLink.click();

        await page.waitForLoadState("networkidle");

        // Should be on edit page
        expect(page.url()).toMatch(/\/admin\/subscriptions\/[a-zA-Z0-9-]+/);

        // Form should be pre-filled with existing data
        const nameInput = page.getByPlaceholderText(/netflix|github|adobe/i);
        expect(await nameInput.inputValue()).toBe(subscriptionName);
      }
    });

    test("should display breadcrumb navigation on edit page", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator('[class*="Card"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForTimeout(300);

        const editLink = page.getByRole("link", { name: /edit subscription|编辑订阅/i }).first();
        await editLink.click();

        await page.waitForLoadState("networkidle");

        // Check breadcrumbs
        await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
        await expect(page.getByRole("link", { name: /subscriptions/i })).toBeVisible();
        await expect(page.getByText("Edit")).toBeVisible();
      }
    });

    test("should successfully update subscription details", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator('[class*="Card"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForTimeout(300);

        const editLink = page.getByRole("link", { name: /edit subscription|编辑订阅/i }).first();
        await editLink.click();

        await page.waitForLoadState("networkidle");

        const updatedName = `Updated ${Date.now()}`;

        // Update name
        const nameInput = page.getByPlaceholderText(/netflix|github|adobe/i);
        await nameInput.fill(updatedName);

        // Submit
        await page.getByRole("button", { name: /save changes|保存更改/i }).click();

        await page.waitForLoadState("networkidle");

        // Should redirect back to list
        expect(page.url()).toContain("/admin/subscriptions");
        expect(page.url()).not.toMatch(/\/admin\/subscriptions\/[a-zA-Z0-9-]+/);

        // Updated subscription should be visible
        await expect(page.getByText(updatedName)).toBeVisible();
      }
    });

    test("should allow cancellation without saving changes", async ({ page }) => {
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator('[class*="Card"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        const originalName = await firstCard.locator("h3").first().textContent();

        await firstCard.click();
        await page.waitForTimeout(300);

        const editLink = page.getByRole("link", { name: /edit subscription|编辑订阅/i }).first();
        await editLink.click();

        await page.waitForLoadState("networkidle");

        // Modify name but don't save
        const nameInput = page.getByPlaceholderText(/netflix|github|adobe/i);
        await nameInput.fill("This should not be saved");

        // Click cancel
        await page.getByRole("button", { name: /cancel|取消/i }).click();

        await page.waitForLoadState("networkidle");

        // Should be back on list page
        expect(page.url()).toContain("/admin/subscriptions");

        // Original name should still be visible
        await expect(page.getByText(originalName || "")).toBeVisible();
      }
    });
  });

  test.describe("Complete Workflow", () => {
    test("should complete full CRUD workflow", async ({ page }) => {
      const testName = `E2E Test ${Date.now()}`;

      // CREATE: Navigate to new page and create subscription
      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      await page.getByRole("link", { name: /add subscription|添加订阅/i }).click();
      await page.waitForLoadState("networkidle");

      await page.getByPlaceholder(/netflix|github|adobe/i).fill(testName);
      await page.getByPlaceholder("0.00").fill("29.99");
      await page.locator('input[type="date"]').first().fill("2024-01-01");

      await page.getByRole("button", { name: /save changes|保存更改/i }).click();
      await page.waitForLoadState("networkidle");

      // READ: Verify subscription appears in list
      await expect(page.getByText(testName)).toBeVisible();

      // UPDATE: Edit the subscription
      const testCard = page.locator('[class*="Card"]', { hasText: testName });
      await testCard.click();
      await page.waitForTimeout(300);

      await page
        .getByRole("link", { name: /edit subscription|编辑订阅/i })
        .first()
        .click();
      await page.waitForLoadState("networkidle");

      const updatedName = `${testName} - Updated`;
      await page.getByPlaceholderText(/netflix|github|adobe/i).fill(updatedName);
      await page.getByRole("button", { name: /save changes|保存更改/i }).click();
      await page.waitForLoadState("networkidle");

      await expect(page.getByText(updatedName)).toBeVisible();

      // DELETE: Remove the subscription
      const updatedCard = page.locator('[class*="Card"]', { hasText: updatedName });
      await updatedCard.click();
      await page.waitForTimeout(300);

      page.once("dialog", (dialog) => {
        dialog.accept();
      });

      await page
        .getByRole("button", { name: /delete subscription|删除订阅/i })
        .first()
        .click();
      await page.waitForTimeout(1000);

      // Subscription should be removed from list
      await expect(page.getByText(updatedName)).not.toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("should be responsive on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto("/admin/subscriptions");
      await page.waitForLoadState("networkidle");

      // Page should be accessible on mobile
      await expect(page.getByText(/subscription|订阅/i)).toBeVisible();

      const addButton = page.getByRole("link", { name: /add subscription|添加订阅/i });
      await expect(addButton).toBeVisible();
    });

    test("should handle form on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/admin/subscriptions/new");
      await page.waitForLoadState("networkidle");

      // Form should be usable on mobile
      const nameInput = page.getByPlaceholder(/netflix|github|adobe/i);
      await expect(nameInput).toBeVisible();
      await nameInput.fill("Mobile Test");

      const submitButton = page.getByRole("button", { name: /save changes|保存更改/i });
      await expect(submitButton).toBeVisible();
    });
  });
});
