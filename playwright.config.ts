import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const PORT = Number(process.env.PORT || process.env.E2E_PORT || 3000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Parallel workers on CI for efficiency */
  workers: process.env.CI ? "50%" : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",

  /* Global setup and teardown */
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    /* Set default locale to English for consistent testing */
    locale: "en-US",
    /* Action and navigation timeouts - increased for stability */
    actionTimeout: 15 * 1000, // 10s -> 15s for slower operations
    navigationTimeout: 45 * 1000, // 30s -> 45s for complex page loads
    /* Test ID attribute for stable selectors */
    testIdAttribute: "data-testid",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Next.js with output: 'standalone' cannot use `next start`.
    // Build, copy test fixtures, then run the standalone server.
    command: "bash e2e/setup-and-start.sh",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // Allow extra time in CI to complete Next.js build
    timeout: 300 * 1000,
  },
});
