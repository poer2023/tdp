/**
 * Authenticated Page Fixtures
 *
 * Provides pre-authenticated page contexts for testing authenticated features.
 * Simplifies test setup and improves test readability.
 */

import { test as base, Page } from "@playwright/test";
import { loginAsUser, logout } from "../utils/auth";

type AuthenticatedFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

/**
 * Fixture: authenticatedPage
 * Provides a page with regular user authentication
 */
export const test = base.extend<AuthenticatedFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginAsUser(page, "regular");
    await use(page);
    await logout(page);
  },

  adminPage: async ({ page }, use) => {
    await loginAsUser(page, "admin");
    await use(page);
    await logout(page);
  },
});

export { expect } from "@playwright/test";
