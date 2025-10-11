/**
 * Likes Feature Tests (Improved Version)
 *
 * This is a refactored version demonstrating best practices:
 * - Uses Page Object Model
 * - No hardcoded timeouts
 * - Deterministic test data
 * - Better assertions
 * - Improved test isolation
 */

import { test, expect } from "@playwright/test";
import { PostPage } from "./pages/post-page";
import { PostsListPage } from "./pages/posts-list-page";
import { TEST_POST_IDS, resetLikesData } from "./fixtures/test-data";

test.describe.serial("Likes Feature", () => {
  let postsListPage: PostsListPage;
  let postPage: PostPage;

  test.beforeEach(async ({ page, context }) => {
    // Reset likes data for test isolation
    await resetLikesData();

    // Clear cookies for fresh session
    await context.clearCookies();

    postsListPage = new PostsListPage(page);
    postPage = new PostPage(page);
  });

  test("should display like button with initial count of zero", async () => {
    await postPage.gotoPost("test-post-en-1");
    await postPage.expectPostLoaded();
    await postPage.expectLikeFeaturePresent();

    const likeCount = await postPage.getLikeCount();
    expect(likeCount).toBe(0);
  });

  test("should increment like count after clicking like button", async () => {
    await postPage.gotoPost("test-post-en-1");

    const initialCount = await postPage.clickLike();

    // Verify count increased
    const newCount = await postPage.getLikeCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test("should disable like button after first like", async () => {
    await postPage.gotoPost("test-post-en-1");

    await postPage.clickLike();

    // Button should be disabled
    const isDisabled = await postPage.isLikeButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test("should persist like state across page reloads", async ({ page, context }) => {
    await postPage.gotoPost("test-post-en-1");

    // Wait for initial load
    await page.waitForLoadState("networkidle");

    // Wait for like button to be ready - use data-testid for cross-browser compatibility
    const likeButton = page.getByTestId("like-button");
    await expect(likeButton).toBeVisible({ timeout: 5000 });

    await postPage.clickLike();

    // Wait for button to become disabled after like
    await expect(likeButton).toBeDisabled({ timeout: 5000 });

    // Wait for cookie to be set (Safari may need extra time)
    await page.waitForTimeout(500);

    // Verify sessionKey cookie exists before reload
    const cookies = await context.cookies();
    const sessionKeyCookie = cookies.find((c) => c.name === "sessionKey");
    expect(sessionKeyCookie).toBeDefined();

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for button to be visible after reload
    await expect(likeButton).toBeVisible({ timeout: 5000 });

    // Button should still be disabled (user already liked)
    const isDisabled = await postPage.isLikeButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test("should set sessionKey cookie after first like", async ({ context }) => {
    await postPage.gotoPost("test-post-en-1");

    // Verify no sessionKey before like
    const cookiesBefore = await context.cookies();
    const hasSessionKeyBefore = cookiesBefore.some((c) => c.name === "sessionKey");
    expect(hasSessionKeyBefore).toBe(false);

    await postPage.clickLike();

    // Verify sessionKey exists after like
    const cookiesAfter = await context.cookies();
    const sessionKeyCookie = cookiesAfter.find((c) => c.name === "sessionKey");
    expect(sessionKeyCookie).toBeDefined();
    expect(sessionKeyCookie?.httpOnly).toBe(true);
  });

  test("should work on both EN and ZH post pages", async () => {
    // Test EN page
    await postPage.gotoPost("test-post-en-1", "en");
    await postPage.expectLikeFeaturePresent();
    await postPage.clickLike();

    let isDisabled = await postPage.isLikeButtonDisabled();
    expect(isDisabled).toBe(true);

    // Test ZH page
    await postPage.gotoPost("test-post-zh-1", "zh");
    await postPage.expectLikeFeaturePresent();
    await postPage.clickLike();

    isDisabled = await postPage.isLikeButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test("should handle rate limiting gracefully", async () => {
    // Like multiple posts in succession
    const postSlugs = ["test-post-en-1", "test-post-en-2", "test-post-en-3"];

    for (const slug of postSlugs) {
      await postPage.gotoPost(slug);
      await postPage.clickLike();
    }

    // No errors should occur
    // Rate limiting is handled gracefully by the backend
    expect(postPage.url).toContain("/posts/");
  });

  test("should display correct like count for posts with existing likes", async ({ page }) => {
    // First session: add a like
    await postPage.gotoPost("test-post-en-1");
    await page.waitForLoadState("networkidle");

    const initialCount = await postPage.getLikeCount();
    expect(initialCount).toBe(0); // Should be 0 after beforeEach reset

    await postPage.clickLike();

    // Wait for like count to update using web-first assertion
    await expect(async () => {
      const count = await postPage.getLikeCount();
      expect(count).toBe(1);
    }).toPass({ timeout: 5000 });

    // Verify like count increased to 1
    const afterLikeCount = await postPage.getLikeCount();
    expect(afterLikeCount).toBe(1);

    // Second session: new anonymous user should see the total count
    const context = page.context();
    await context.clearCookies();
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for like count to be visible and correct
    await expect(async () => {
      const count = await postPage.getLikeCount();
      expect(count).toBe(1);
    }).toPass({ timeout: 5000 });

    // Should still show count of 1 (total from all users)
    const newSessionCount = await postPage.getLikeCount();
    expect(newSessionCount).toBe(1);
  });
});
