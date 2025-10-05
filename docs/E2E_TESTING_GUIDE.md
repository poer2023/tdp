# E2E Testing Guide

Complete guide for End-to-End testing with Playwright in the TDP project.

## Overview

This project uses Playwright for E2E testing with the following characteristics:

- **Framework**: Playwright Test
- **Test Location**: `e2e/` directory
- **Total Tests**: 314 tests across 15 test files
- **Browser Projects**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari (configurable)
- **Authentication**: Session-based testing with `loginAsUser()` utility

## Test Structure

### Test Files

| Test File                         | Coverage               | Test Count |
| --------------------------------- | ---------------------- | ---------- |
| `accessibility.spec.ts`           | Accessibility features | 5          |
| `auth-improved.spec.ts`           | Authentication flows   | 27         |
| `content-export-improved.spec.ts` | Content export         | Variable   |
| `content-import-improved.spec.ts` | Content import         | Variable   |
| `content-operations.spec.ts`      | Admin content ops      | 1          |
| `error-handling.spec.ts`          | Error scenarios        | Variable   |
| `home.spec.ts`                    | Home page              | Variable   |
| `i18n-routing-improved.spec.ts`   | i18n routing & SEO     | 20         |
| `likes-improved.spec.ts`          | Like functionality     | 8          |
| `navigation.spec.ts`              | Navigation             | Variable   |
| `performance.spec.ts`             | Performance checks     | Variable   |
| `public-tests.spec.ts`            | Public pages           | Variable   |
| `seo-metadata-improved.spec.ts`   | SEO metadata           | 24         |
| `sitemap-improved.spec.ts`        | Sitemap generation     | 32         |
| `uploads.spec.ts`                 | Image uploads          | Variable   |

### Test Utilities

Located in `e2e/utils/` and `e2e/helpers/`:

- **`auth.ts`**: Authentication helpers (`loginAsUser()`, `logout()`, `isLoggedIn()`)
- **`seed-test-data.ts`**: Test data seeding and cleanup
- **`wait-helpers.ts`**: Network idle, visibility helpers
- **`assertion-helpers.ts`**: Custom assertions (ARIA, focus, etc.)

### Page Objects

Located in `e2e/pages/`:

- **`auth-page.ts`**: Authentication UI interactions
- Additional page objects for complex workflows

## Running Tests

### Local Execution

#### All Tests (Full Suite)

```bash
npm run test:e2e
```

This runs all 314 tests across all browser projects (~30-45 minutes).

#### Critical Tests Only

```bash
npm run test:e2e:critical
```

Runs only critical path tests (~60-80 tests, <20 minutes).

#### Specific Test File

```bash
npx playwright test e2e/auth-improved.spec.ts
```

#### Single Browser

```bash
npx playwright test --project=chromium
```

#### Watch Mode

```bash
npx playwright test --ui
```

#### Debug Mode

```bash
npx playwright test --debug
```

### CI/CD Execution

#### GitHub Actions Workflows

1. **CI Critical Path** (`.github/workflows/ci-critical.yml`)
   - Runs on every PR and push
   - Executes critical E2E tests (~60-80 tests)
   - Uses Chromium only for speed
   - **Blocks deployment** if fails

2. **E2E Full Suite** (`.github/workflows/e2e.yml`)
   - Runs on schedule (daily at 2 AM)
   - Runs on main branch push (non-doc changes)
   - Manual trigger available
   - Executes all 314 tests with 4-way sharding
   - **Non-blocking** (creates GitHub issue on failure)

## Authentication Testing

### Setup

Tests use session-based authentication instead of real OAuth flow:

```typescript
import { loginAsUser, logout } from "./utils/auth";

test("authenticated test", async ({ page, context }) => {
  // Login as regular user
  await loginAsUser(page, context, "regular");

  // Or login as admin
  await loginAsUser(page, context, "admin");

  // Your test logic...

  // Cleanup
  await logout(page, context);
});
```

### Test Users

Defined in `e2e/utils/auth.ts`:

- **Regular User**: `test-user@example.com`
- **Admin User**: `admin@example.com` (role: ADMIN)

### Global Setup/Teardown

- **Global Setup** (`e2e/global-setup.ts`): Seeds test users and posts before all tests
- **Global Teardown** (`e2e/global-teardown.ts`): Cleans up test data after all tests

## Test Data Management

### Seeding Test Data

Test data is automatically seeded before tests run via global setup.

Manual seeding:

```bash
npx tsx e2e/utils/seed-test-data.ts
```

### Cleaning Test Data

Automatic cleanup happens after all tests via global teardown.

Manual cleanup:

```bash
npx tsx e2e/utils/seed-test-data.ts --cleanup
```

### Test Data Fixtures

Located in `e2e/fixtures/test-data.ts`:

- User fixtures (regular, admin)
- Post fixtures (EN, ZH, published, draft)
- Comment fixtures
- Image upload fixtures

## Best Practices

### 1. Use Page Objects

For complex UI interactions, use Page Object Model:

```typescript
import { AuthPage } from "./pages/auth-page";

test("example", async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.goto();
  await authPage.clickSignIn();
});
```

### 2. Wait for Network Idle

Always wait for network to stabilize:

```typescript
import { waitForNetworkIdle } from "./helpers/wait-helpers";

await page.goto("/");
await waitForNetworkIdle(page);
```

### 3. Use Custom Assertions

For accessibility and UI checks:

```typescript
import { expectAriaAttributes, expectFocusable } from "./helpers/assertion-helpers";

await expectAriaAttributes(element, { role: "button", label: "Submit" });
await expectFocusable(element);
```

### 4. Clean Up After Tests

Always clean up auth state:

```typescript
test.afterEach(async ({ page, context }) => {
  await logout(page, context);
});
```

### 5. Handle Flaky Tests

- Use `test.fail()` for known intermittent failures
- Add `test.skip()` with reason for tests requiring real OAuth
- Increase timeouts for slow operations

## Configuration

### Playwright Config

Main configuration: `playwright.config.ts`

Key settings:

- **Workers**: 50% CPU in CI, unlimited locally
- **Retries**: 2 in CI, 0 locally
- **Timeout**: 30s per test, 120s per action
- **Base URL**: http://localhost:3000
- **Web Server**: Auto-starts Next.js standalone build

### Critical Tests Config

Separate config: `playwright.critical.config.ts`

- Reduced browser matrix (Chromium only)
- Faster execution for CI
- Used in `test:e2e:critical` script

## Troubleshooting

### Tests Fail Locally

1. **Check database**:

   ```bash
   docker compose ps  # Ensure postgres is running
   npm run db:migrate # Run migrations
   ```

2. **Reset test data**:

   ```bash
   npx tsx e2e/utils/seed-test-data.ts --cleanup
   npx tsx e2e/utils/seed-test-data.ts
   ```

3. **Clear browser state**:
   ```bash
   rm -rf playwright-report test-results
   ```

### Authentication Tests Fail

- Verify test users exist in database
- Check session generation in `e2e/utils/auth.ts`
- Ensure `NEXTAUTH_SECRET` is set in `.env`

### Timeout Errors

- Increase timeout in test:

  ```typescript
  test("slow test", async ({ page }) => {
    test.setTimeout(60000); // 60 seconds
    // ...
  });
  ```

- Or globally in `playwright.config.ts`

### Flaky Tests in CI

- Check for race conditions (missing `waitForNetworkIdle`)
- Verify test isolation (cleanup between tests)
- Review CI logs for specific errors

## Related Documentation

- **[E2E Auth Setup](E2E_AUTH_SETUP.md)** - Detailed authentication testing setup
- **[E2E Scaling Guide](../E2E_SCALING_GUIDE.md)** - Large-scale execution strategies
- **[Local E2E Playbook](../LOCAL_E2E_SCHEME_B_PLAYBOOK.md)** - Step-by-step local execution
- **[CI/CD Configuration](../claudedocs/E2E_CICD_CONFIGURATION_GUIDE.md)** - Complete CI/CD setup

## Archive

Historical documentation can be found in `docs/archive/development/`:

- E2E test improvement summaries
- Phase completion reports
- CI/CD implementation success reports

---

**Last Updated**: 2025-10-05
**Maintainer**: Development Team
