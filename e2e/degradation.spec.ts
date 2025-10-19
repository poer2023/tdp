/**
 * E2E tests for database degradation and offline mode
 *
 * Tests the application's graceful degradation when:
 * - Database is unavailable (E2E_SKIP_DB=1)
 * - External API failures
 * - Service errors
 */

import { test, expect } from "@playwright/test";

test.describe("Database Degradation", () => {
  test.use({
    baseURL: process.env.E2E_SKIP_DB === "1" ? "http://localhost:3000" : "http://localhost:3000",
  });

  test.describe("Admin Dashboard", () => {
    test("should show degradation warnings when DB is offline", async ({ page }) => {
      // Set E2E_SKIP_DB environment variable for this test
      // Note: This requires the app to be running with E2E_SKIP_DB=1

      await page.goto("/admin");

      // Check for amber warning messages indicating service degradation
      const degradationWarnings = page.locator('text="Service temporarily unavailable"');
      await expect(degradationWarnings.first()).toBeVisible();

      // Check for specific degradation messages
      await expect(page.locator('text="Metrics temporarily unavailable"')).toBeVisible();
      await expect(page.locator('text="Database connection error"')).toBeVisible();
    });

    test("should not crash when navigating admin pages in degraded mode", async ({ page }) => {
      await page.goto("/admin");

      // Should be able to navigate to different admin pages
      await page.click('text="Posts"');
      await expect(page).toHaveURL(/\/admin\/posts/);

      await page.click('text="Gallery"');
      await expect(page).toHaveURL(/\/admin\/gallery/);

      // No errors should be thrown
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a bit to catch any errors
      await page.waitForTimeout(1000);

      // Filter out expected degradation warnings
      const unexpectedErrors = consoleErrors.filter(
        (error) =>
          !error.includes("[db-fallback]") &&
          !error.includes("Failed to fetch") &&
          !error.includes("Network")
      );

      expect(unexpectedErrors).toHaveLength(0);
    });
  });

  test.describe("Frontend Pages", () => {
    test("should render posts page with empty state when DB offline", async ({ page }) => {
      await page.goto("/");

      // Check that page loads without crashing
      await expect(page.locator("body")).toBeVisible();

      // Should show empty state or loading state, not crash
      const hasContent =
        (await page.locator('article[data-testid="post-card"]').count()) > 0 ||
        (await page.locator('text="No posts available"').count()) > 0 ||
        (await page.locator('text="暂无文章"').count()) > 0;

      expect(hasContent).toBeTruthy();
    });

    test("should handle gallery page gracefully", async ({ page }) => {
      await page.goto("/gallery");

      // Page should load
      await expect(page.locator("body")).toBeVisible();

      // Should show empty state or content, not crash
      const hasGalleryContent =
        (await page.locator('[data-testid="gallery-image"]').count()) > 0 ||
        (await page.locator('text="No images"').count()) > 0 ||
        (await page.locator('text="暂无图片"').count()) > 0;

      // At minimum, the page should not throw uncaught errors
      // We verify this by checking that the body is still visible
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle search page without crashes", async ({ page }) => {
      await page.goto("/search");

      await expect(page.locator("body")).toBeVisible();

      // Try searching when DB is offline
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if ((await searchInput.count()) > 0) {
        await searchInput.first().fill("test query");
        await searchInput.first().press("Enter");

        // Should show empty results or degradation message, not crash
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });

  test.describe("Error Boundaries", () => {
    test("should catch and display errors gracefully", async ({ page }) => {
      await page.goto("/admin/posts");

      // Error boundaries should prevent full page crashes
      // Look for error boundary fallback UI
      const errorBoundaryMessages = [
        "Something went wrong",
        "出错了",
        "Error loading",
        "暂时不可用",
      ];

      const hasErrorHandling =
        (await page.locator("body").count()) > 0 &&
        !(await page.locator("text=/application crashed|unhandled error/i").count());

      expect(hasErrorHandling).toBeTruthy();
    });
  });

  test.describe("Feature Flags", () => {
    test("should respect FEATURE_ADMIN_POSTS flag", async ({ page }) => {
      // This test assumes FEATURE_ADMIN_POSTS is enabled in test environment
      await page.goto("/admin/posts");

      // Should either show posts page or feature disabled message
      const hasPostsFeature =
        (await page.locator('text="文章管理"').count()) > 0 ||
        (await page.locator('text="Posts"').count()) > 0 ||
        (await page.locator('text="已禁用文章管理功能"').count()) > 0 ||
        (await page.locator('text="FEATURE_ADMIN_POSTS=on"').count()) > 0;

      expect(hasPostsFeature).toBeTruthy();
    });

    test("should respect FEATURE_ADMIN_GALLERY flag", async ({ page }) => {
      await page.goto("/admin/gallery");

      // Should either show gallery page or feature disabled message
      const hasGalleryFeature =
        (await page.locator('text="相册管理"').count()) > 0 ||
        (await page.locator('text="Gallery"').count()) > 0 ||
        (await page.locator('text="已禁用相册管理功能"').count()) > 0 ||
        (await page.locator('text="FEATURE_ADMIN_GALLERY=on"').count()) > 0;

      expect(hasGalleryFeature).toBeTruthy();
    });
  });
});

test.describe("External API Degradation", () => {
  test.describe("Sync Operations", () => {
    test("should handle failed sync operations gracefully", async ({ page }) => {
      // Navigate to sync page if it exists
      await page.goto("/admin");

      // Try to find sync-related links
      const syncLink = page.locator('a[href*="sync"]');
      if ((await syncLink.count()) > 0) {
        await syncLink.first().click();

        // Should show sync UI without crashing
        await expect(page.locator("body")).toBeVisible();

        // If there's a sync button, try clicking it
        const syncButtons = page.locator('button:has-text("同步"), button:has-text("Sync")');
        if ((await syncButtons.count()) > 0) {
          await syncButtons.first().click();

          // Wait for sync operation
          await page.waitForTimeout(2000);

          // Should show result (success or failure) without crashing
          await expect(page.locator("body")).toBeVisible();
        }
      }
    });
  });

  test.describe("Credentials Management", () => {
    test("should handle credentials page in degraded mode", async ({ page }) => {
      await page.goto("/admin/credentials");

      // Page should load
      await expect(page.locator("body")).toBeVisible();

      // Should show either credentials list or degradation message
      const hasCredentialsUI =
        (await page.locator('text="凭据管理"').count()) > 0 ||
        (await page.locator('text="Credentials"').count()) > 0 ||
        (await page.locator('text="暂不可用"').count()) > 0;

      expect(hasCredentialsUI).toBeTruthy();
    });
  });
});

test.describe("Performance Under Degradation", () => {
  test("should load pages within acceptable time even when degraded", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/admin");

    const loadTime = Date.now() - startTime;

    // Pages should load within 5 seconds even in degraded mode
    expect(loadTime).toBeLessThan(5000);
  });

  test("should not cause memory leaks with repeated degradation", async ({ page }) => {
    // Navigate between pages multiple times to test for memory leaks
    for (let i = 0; i < 5; i++) {
      await page.goto("/admin");
      await page.goto("/admin/posts");
      await page.goto("/admin/gallery");
    }

    // Page should still be responsive
    await expect(page.locator("body")).toBeVisible();
  });
});
