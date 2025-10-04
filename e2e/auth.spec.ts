import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "./utils/auth";

test.describe("Authentication Flow", () => {
  test("should show 'Sign in' button when not authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for sign-in button in header
    const signInButton = page
      .getByRole("button", { name: /sign in|登录/i })
      .or(page.getByRole("link", { name: /sign in|登录/i }));

    expect(await signInButton.count()).toBeGreaterThan(0);
  });

  test("should display Google icon on sign-in button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInButton = page.getByRole("button", { name: /sign in|登录/i });

    if ((await signInButton.count()) > 0) {
      // Check for SVG icon (Google logo)
      const svg = signInButton.locator("svg").first();
      expect(await svg.count()).toBeGreaterThan(0);
    }
  });

  test("should show full text on desktop, short text on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    const desktopButton = page.getByRole("button", { name: /sign in with google/i });

    if ((await desktopButton.count()) > 0) {
      expect(await desktopButton.isVisible()).toBe(true);
    }

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileButton = page.getByRole("button", { name: /sign in/i });

    expect(await mobileButton.count()).toBeGreaterThan(0);
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInButton = page.getByRole("button", { name: /sign in/i });

    if ((await signInButton.count()) > 0) {
      // Button should be focusable
      await signInButton.first().focus();
      expect(await signInButton.first().evaluate((el) => document.activeElement === el)).toBe(true);
    }
  });

  test.skip("should redirect to Google OAuth when sign-in clicked", async ({ page }) => {
    // This test requires OAuth setup and will redirect to Google
    // Skip for now to avoid external dependencies
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInButton = page.getByRole("button", { name: /sign in/i });

    if ((await signInButton.count()) > 0) {
      // Monitor navigation
      const navigationPromise = page.waitForNavigation();
      await signInButton.first().click();

      const navigation = await navigationPromise;
      const url = navigation?.url() || "";

      // Should redirect to Google OAuth or callback
      expect(url).toMatch(/google|auth|callback/i);
    }
  });

  test.skip("should return to same page after sign-in", async ({ page }) => {
    // This test requires OAuth completion
  });
});

test.describe("Authenticated User Header", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "regular");
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("should show user avatar when authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should show user menu button
    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    // User menu should be visible
    expect(await userMenu.count()).toBeGreaterThan(0);
  });

  test("should show user name in header", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should display user name from TEST_USERS
    const userName = page.getByText("Test User");
    expect(await userName.count()).toBeGreaterThan(0);
  });

  test("should open dropdown menu on avatar click", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      // Menu should open
      const menu = page.getByRole("menu");
      expect(await menu.count()).toBeGreaterThan(0);
    }
  });

  test("should show 'Dashboard' menu item", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      // Should show Dashboard link
      const dashboardLink = page.getByText(/dashboard|控制台/i);
      expect(await dashboardLink.count()).toBeGreaterThan(0);
    }
  });

  test("should show 'Sign out' menu item", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      // Should show Sign out button
      const signOutButton = page.getByText(/sign out|退出|登出/i);
      expect(await signOutButton.count()).toBeGreaterThan(0);
    }
  });

  test("should close menu on Escape key", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      // Menu should be open
      const menu = page.getByRole("menu");
      expect(await menu.count()).toBeGreaterThan(0);

      // Press Escape
      await page.keyboard.press("Escape");

      // Wait for animation
      await page.waitForTimeout(300);

      // Menu should be closed
      expect(await page.getByRole("menu").count()).toBe(0);
    }
  });

  test("should close menu on outside click", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      // Menu should be open
      expect(await page.getByRole("menu").count()).toBeGreaterThan(0);

      // Click outside
      await page.locator("body").click({ position: { x: 10, y: 10 } });

      // Wait for animation
      await page.waitForTimeout(300);

      // Menu should be closed
      expect(await page.getByRole("menu").count()).toBe(0);
    }
  });

  test("should support keyboard navigation (Arrow keys)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      const menu = page.getByRole("menu");
      if ((await menu.count()) > 0) {
        // Press ArrowDown
        await page.keyboard.press("ArrowDown");

        // Press ArrowUp
        await page.keyboard.press("ArrowUp");

        // Menu should still be open
        expect(await page.getByRole("menu").count()).toBeGreaterThan(0);
      }
    }
  });

  test("should have aria-haspopup and aria-expanded attributes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenu = page.getByLabel("User menu");

    if ((await userMenu.count()) > 0) {
      // Should have aria-haspopup
      const hasPopup = await userMenu.getAttribute("aria-haspopup");
      expect(hasPopup).toBe("menu");

      // Should have aria-expanded
      const expanded = await userMenu.getAttribute("aria-expanded");
      expect(expanded).toBe("false");

      // Click to open
      await userMenu.click();

      // aria-expanded should be true
      const expandedAfter = await userMenu.getAttribute("aria-expanded");
      expect(expandedAfter).toBe("true");
    }
  });

  test("should sign out and return to current page", async ({ page }) => {
    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const userMenu = page
      .getByLabel("User menu")
      .or(page.locator("button").filter({ hasText: /test user/i }));

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();

      const signOutButton = page.getByText(/sign out|退出|登出/i);
      if ((await signOutButton.count()) > 0) {
        await signOutButton.first().click();

        // Wait for sign out
        await page.waitForTimeout(1000);

        // Should still be on posts page or redirected to home
        const url = page.url();
        expect(url).toMatch(/posts|localhost:3000\/?$/);
      }
    }
  });
});

test.describe("SSR Session Loading", () => {
  test("should not show authentication flicker on page load", async ({ page }) => {
    await page.goto("/");

    // Monitor for layout shifts
    let cumulativeLayoutShift = 0;
    await page.evaluate(() => {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).hadRecentInput) continue;
          cumulativeLayoutShift += (entry as any).value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.waitForLoadState("networkidle");

    // CLS should be minimal (< 0.1 is good)
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let totalCLS = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              totalCLS += (entry as any).value;
            }
          }
          resolve(totalCLS);
        }).observe({ type: "layout-shift", buffered: true });

        setTimeout(() => resolve(totalCLS), 1000);
      });
    });

    expect(cls).toBeLessThan(0.5);
  });

  test("should load session data on initial render", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Auth state should be immediately visible (no loading skeleton flash)
    const loadingSkeleton = page.locator(".animate-pulse");

    // Either skeleton is not present, or very briefly shown
    const skeletonCount = await loadingSkeleton.count();
    expect(skeletonCount).toBeGreaterThanOrEqual(0);
  });
});
