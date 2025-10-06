import { defineConfig, devices } from "@playwright/test";

/**
 * Critical E2E tests configuration for CI/CD pipeline
 * Only runs stable, non-auth tests that must pass before deployment
 *
 * Strategy: Focus on core public-facing functionality without authentication
 * - SEO and sitemap generation (critical for discoverability)
 * - Internationalization routing (core feature)
 * - Content import/export (admin functionality)
 *
 * Auth tests and other potentially flaky tests run in the full suite (non-blocking)
 *
 * Usage:
 *   npx playwright test --config=playwright.critical.config.ts
 *   npm run test:e2e:critical
 *
 * See: docs/CI_CD_E2E_TESTING_STRATEGY.md
 */
export default defineConfig({
  testDir: "./e2e",

  // Only run stable, non-auth tests
  // Note: content-export and content-import require admin auth, excluded for stability
  testMatch: [
    "**/sitemap-improved.spec.ts",
    "**/seo-metadata-improved.spec.ts",
    "**/i18n-routing-improved.spec.ts",
  ],

  // Fail fast - stop after 3 failures in critical tests
  maxFailures: 3,

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 4 : 2,

  // Retries for flaky tests
  retries: process.env.CI ? 2 : 0,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "playwright-report-critical" }],
    ["json", { outputFile: "test-results-critical.json" }],
    [
      "list",
      {
        printSteps: true,
      },
    ],
  ],

  // Global timeout
  timeout: 45000,
  expect: {
    timeout: 10000,
  },

  // Global setup
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  globalTeardown: require.resolve("./e2e/global-teardown.ts"),

  use: {
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    // Ensure deterministic Accept-Language for middleware-based redirects
    locale: "en-US",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Dev server for testing (both local and CI)
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
