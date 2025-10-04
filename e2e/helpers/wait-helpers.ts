/**
 * Wait Helpers
 *
 * Intelligent waiting strategies to replace hardcoded timeouts.
 * Improves test reliability and reduces flakiness.
 */

import { Page, Locator, expect } from "@playwright/test";

/**
 * Wait for network idle after an action
 * Use instead of waitForTimeout after clicks/form submissions
 */
export async function waitForNetworkIdle(page: Page) {
  // Ensure DOM is ready first for stability, then wait until network settles
  try {
    await page.waitForLoadState("domcontentloaded");
  } catch (_) {
    // ignore if already past this state
  }
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for an API response matching a URL pattern
 * Returns the response for further assertions
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  const response = await page.waitForResponse(urlPattern);
  return response;
}

/**
 * Wait for element to be visible and stable (no animations)
 * Better than isVisible() for animated elements
 */
export async function waitForElementStable(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeStable();
}

/**
 * Wait for text content to change
 * Useful for waiting for updates after user actions
 */
export async function waitForTextChange(
  locator: Locator,
  previousText: string,
  options?: { timeout?: number }
) {
  await expect(locator).not.toHaveText(previousText, options);
}

/**
 * Wait for element count to change
 * Useful for lists that update after actions
 */
export async function waitForCountChange(
  locator: Locator,
  previousCount: number,
  options?: { timeout?: number }
) {
  await expect(async () => {
    const newCount = await locator.count();
    expect(newCount).not.toBe(previousCount);
  }).toPass(options);
}

/**
 * Wait for success message or error message
 * Common pattern after form submissions
 */
export async function waitForSubmissionFeedback(page: Page) {
  const feedback = page.locator('[role="alert"], .toast, [class*="message"]');
  await expect(feedback.first()).toBeVisible({ timeout: 5000 });
  return feedback;
}

/**
 * Poll until condition is met
 * Fallback for complex conditions
 */
export async function waitUntil(
  condition: () => Promise<boolean>,
  options?: { timeout?: number; interval?: number }
) {
  const timeout = options?.timeout || 5000;
  const interval = options?.interval || 100;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Wait for dialog to appear (confirm, alert, etc.)
 * Returns a promise that resolves with the dialog
 */
export function waitForDialog(page: Page) {
  return new Promise<{
    message: string;
    accept: () => Promise<void>;
    dismiss: () => Promise<void>;
  }>((resolve) => {
    page.once("dialog", async (dialog) => {
      resolve({
        message: dialog.message(),
        accept: () => dialog.accept(),
        dismiss: () => dialog.dismiss(),
      });
    });
  });
}
