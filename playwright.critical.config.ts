import { defineConfig, devices } from "@playwright/test";

/**
 * Critical E2E tests configuration for CI/CD pipeline
 * Only runs essential tests that must pass before deployment
 *
 * Usage:
 *   npx playwright test --config=playwright.critical.config.ts
 *   npm run test:e2e:critical
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.(critical|improved)\.spec\.ts/,

  // Fail fast - stop on first failure in critical tests
  maxFailures: 5,

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
