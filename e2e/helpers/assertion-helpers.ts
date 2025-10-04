/**
 * Assertion Helpers
 *
 * Custom assertions for common test patterns.
 * Improves test readability and reduces boilerplate.
 */

import { Page, Locator, expect } from "@playwright/test";

/**
 * Assert that element is visible and has specific text
 */
export async function expectVisibleText(locator: Locator, text: string | RegExp) {
  await expect(locator).toBeVisible();
  await expect(locator).toHaveText(text);
}

/**
 * Assert that page navigated to expected URL
 */
export async function expectUrlContains(page: Page, urlFragment: string) {
  expect(page.url()).toContain(urlFragment);
}

/**
 * Assert that page has specific meta tag
 */
export async function expectMetaTag(page: Page, property: string, content: string | RegExp) {
  const metaTag = page.locator(`meta[property="${property}"], meta[name="${property}"]`);
  await expect(metaTag).toHaveAttribute("content", content);
}

/**
 * Assert that element has ARIA attributes
 */
export async function expectAriaAttributes(
  locator: Locator,
  attributes: Record<string, string | boolean>
) {
  for (const [attr, value] of Object.entries(attributes)) {
    await expect(locator).toHaveAttribute(attr, String(value));
  }
}

/**
 * Assert that element is focusable and can receive keyboard focus
 */
export async function expectFocusable(locator: Locator) {
  await locator.focus();
  const isFocused = await locator.evaluate((el) => document.activeElement === el);
  expect(isFocused).toBe(true);
}

/**
 * Assert that list has minimum number of items
 */
export async function expectMinimumItems(locator: Locator, minCount: number) {
  const count = await locator.count();
  expect(count).toBeGreaterThanOrEqual(minCount);
}

/**
 * Assert that API response has expected structure
 */
export async function expectJsonResponse(response: any, expectedShape: Record<string, any>) {
  expect(response.ok()).toBe(true);
  const json = await response.json();

  for (const [key, expectedType] of Object.entries(expectedShape)) {
    expect(json).toHaveProperty(key);
    if (expectedType !== null) {
      expect(typeof json[key]).toBe(expectedType);
    }
  }

  return json;
}

/**
 * Assert that cookie exists with specific attributes
 */
export async function expectCookie(
  page: Page,
  name: string,
  attributes?: { sameSite?: string; httpOnly?: boolean }
) {
  const cookies = await page.context().cookies();
  const cookie = cookies.find((c) => c.name === name);

  expect(cookie).toBeDefined();

  if (attributes?.sameSite) {
    expect(cookie?.sameSite).toBe(attributes.sameSite);
  }

  if (attributes?.httpOnly !== undefined) {
    expect(cookie?.httpOnly).toBe(attributes.httpOnly);
  }

  return cookie;
}

/**
 * Assert form validation error is displayed
 */
export async function expectValidationError(page: Page, message: string | RegExp) {
  const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText(message);
}

/**
 * Assert that element is not in viewport
 */
export async function expectNotInViewport(locator: Locator) {
  const isInViewport = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  });
  expect(isInViewport).toBe(false);
}

/**
 * Assert element is stable (no animations)
 */
export async function expectStable(locator: Locator) {
  await expect(locator).toBeStable();
}
