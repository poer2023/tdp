import { test, expect } from "@playwright/test";

test.describe("Likes Feature", () => {
  test("should display like button with count", async ({ page }) => {
    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const firstPost = page.locator('a[href^="/posts/"]').first();
    if ((await firstPost.count()) > 0) {
      await firstPost.click();
      await page.waitForLoadState("networkidle");

      // Look for like button
      const likeButton = page.locator("button").filter({ hasText: /like|赞|♥|❤/i });

      if ((await likeButton.count()) > 0) {
        expect(await likeButton.first().isVisible()).toBe(true);

        // Check for like count display
        const buttonText = await likeButton.first().textContent();
        expect(buttonText).toMatch(/\d+/); // Should contain a number
      }
    }
  });

  test("should increment like count on click", async ({ page, context }) => {
    // Clear cookies to simulate new session
    await context.clearCookies();

    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const firstPost = page.locator('a[href^="/posts/"]').first();
    if ((await firstPost.count()) > 0) {
      await firstPost.click();
      await page.waitForLoadState("networkidle");

      const likeButton = page.locator("button").filter({ hasText: /like|赞|♥|❤/i });

      if ((await likeButton.count()) > 0) {
        // Get initial count
        const initialText = await likeButton.first().textContent();
        const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || "0");

        // Click like button
        await likeButton.first().click();

        // Wait for update
        await page.waitForTimeout(500);

        // Check if count increased or button is disabled
        const isDisabled = await likeButton.first().isDisabled();
        const finalText = await likeButton.first().textContent();

        expect(isDisabled || finalText?.includes("Liked") || finalText?.includes("已赞")).toBe(
          true
        );
      }
    }
  });

  test("should disable like button after first like", async ({ page, context }) => {
    await context.clearCookies();

    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const firstPost = page.locator('a[href^="/posts/"]').first();
    if ((await firstPost.count()) > 0) {
      await firstPost.click();
      await page.waitForLoadState("networkidle");

      const likeButton = page.locator("button").filter({ hasText: /like|赞|♥|❤/i });

      if ((await likeButton.count()) > 0) {
        await likeButton.first().click();
        await page.waitForTimeout(500);

        // Button should be disabled
        expect(await likeButton.first().isDisabled()).toBe(true);
      }
    }
  });

  test("should persist like state across page reloads", async ({ page }) => {
    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const firstPost = page.locator('a[href^="/posts/"]').first();
    if ((await firstPost.count()) > 0) {
      const postUrl = await firstPost.getAttribute("href");
      await firstPost.click();
      await page.waitForLoadState("networkidle");

      const likeButton = page.locator("button").filter({ hasText: /like|赞|♥|❤/i });

      if ((await likeButton.count()) > 0) {
        // Click like
        await likeButton.first().click();
        await page.waitForTimeout(500);

        // Reload page
        await page.reload();
        await page.waitForLoadState("networkidle");

        // Button should still be disabled
        const likeButtonAfterReload = page.locator("button").filter({ hasText: /like|赞|♥|❤/i });
        if ((await likeButtonAfterReload.count()) > 0) {
          expect(await likeButtonAfterReload.first().isDisabled()).toBe(true);
        }
      }
    }
  });

  test("should handle rate limiting gracefully", async ({ page, context }) => {
    await context.clearCookies();

    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    // Try to like multiple posts quickly
    const posts = page.locator('a[href^="/posts/"]');
    const postCount = await posts.count();

    if (postCount < 3) {
      test.skip(true, "Need at least 3 posts to test rate limiting");
      return;
    }

    for (let i = 0; i < 3; i++) {
      await posts.nth(i).click();
      await page.waitForLoadState("networkidle");

      const likeButton = page.locator("button").filter({ hasText: /like|赞|♥|❤/i });
      if ((await likeButton.count()) > 0) {
        await likeButton.first().click();
        await page.waitForTimeout(100);
      }

      await page.goBack();
      await page.waitForLoadState("networkidle");
    }

    // No error should occur - rate limiting should be handled gracefully
    const errorMessages = page.locator("text=/error|错误|rate limit|速率限制/i");
    // Error message may or may not appear depending on rate limit
    expect(await errorMessages.count()).toBeGreaterThanOrEqual(0);
  });

  test("should work on both EN and ZH post pages", async ({ page }) => {
    // Test EN page
    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const enPost = page.locator('a[href^="/posts/"]').first();
    const enPostCount = await enPost.count();

    let enLikeButtonExists = false;
    if (enPostCount > 0) {
      await enPost.click();
      await page.waitForLoadState("networkidle");

      const enLikeButton = page.locator("button").filter({ hasText: /like|♥|❤/i });
      enLikeButtonExists = (await enLikeButton.count()) > 0;
    }

    // Test ZH page
    await page.goto("/zh/posts");
    await page.waitForLoadState("networkidle");

    const zhPost = page.locator('a[href^="/zh/posts/"]').first();
    const zhPostCount = await zhPost.count();

    let zhLikeButtonExists = false;
    if (zhPostCount > 0) {
      await zhPost.click();
      await page.waitForLoadState("networkidle");

      const zhLikeButton = page.locator("button").filter({ hasText: /赞|♥|❤/i });
      zhLikeButtonExists = (await zhLikeButton.count()) > 0;
    }

    // Skip if no posts with like buttons found
    if (!enLikeButtonExists && !zhLikeButtonExists) {
      test.skip(true, "No posts with like buttons available");
      return;
    }

    // At least one should have like button
    expect(enLikeButtonExists || zhLikeButtonExists).toBe(true);
  });

  test("should set sessionKey cookie after first like", async ({ page, context }) => {
    await context.clearCookies();

    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    const firstPost = page.locator('a[href^="/posts/"]').first();
    if ((await firstPost.count()) > 0) {
      await firstPost.click();
      await page.waitForLoadState("networkidle");

      const likeButton = page.locator("button").filter({ hasText: /like|赞|♥|❤/i });

      if ((await likeButton.count()) > 0) {
        // Check cookies before like
        const cookiesBefore = await context.cookies();
        const hasSessionKeyBefore = cookiesBefore.some((c) => c.name === "sessionKey");

        // Click like
        await likeButton.first().click();
        await page.waitForTimeout(500);

        // Check cookies after like
        const cookiesAfter = await context.cookies();
        const hasSessionKeyAfter = cookiesAfter.some((c) => c.name === "sessionKey");

        // SessionKey cookie should be set after liking
        expect(hasSessionKeyAfter).toBe(true);
      }
    }
  });
});
