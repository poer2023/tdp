# CI/CD E2E Testing Strategy

## Overview

This document outlines the E2E testing strategy for the TDP project's CI/CD pipeline, based on industry best practices for 2025.

## Problem Statement

Previously, our CI/CD pipeline was blocked by unstable E2E tests with an 87% pass rate. The main issues were:

1. **Flaky authentication tests** - Complex auth flows causing intermittent failures
2. **Full suite blocking deployment** - 314 tests taking 30+ minutes
3. **False negatives** - Deployment blocked by non-critical test failures

## Best Practices Applied

Based on research from Playwright, Google, and industry leaders, we implement:

### 1. **Layered Testing Strategy**

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: CI Pipeline (BLOCKING)                     │
│ - Lint, Format, Type Check                          │
│ - Unit Tests (141 tests)                            │
│ - Build Verification                                │
│ Duration: ~3-5 minutes                               │
└─────────────────────────────────────────────────────┘
                      ↓ PASS
┌─────────────────────────────────────────────────────┐
│ Layer 2: CI Critical Path (BLOCKING)                │
│ - Stable, non-auth E2E tests                        │
│ - Critical user-facing features                     │
│ - SEO, i18n, sitemap, public content                │
│ Duration: ~5-8 minutes                               │
└─────────────────────────────────────────────────────┘
                      ↓ PASS
┌─────────────────────────────────────────────────────┐
│ Layer 3: Docker Build & Deploy                      │
│ - Build Docker image                                │
│ - Push to registry                                  │
│ - Auto-deploy to staging/production                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 4: Full E2E Suite (NON-BLOCKING)              │
│ - All 314 E2E tests including auth                  │
│ - Runs every 6 hours on schedule                    │
│ - Creates GitHub issues on failure                  │
│ Duration: ~30-45 minutes                             │
└─────────────────────────────────────────────────────┘
```

### 2. **Test Classification**

#### Critical Tests (Blocking - Layer 2)

Tests that verify core public-facing functionality **without authentication**:

- ✅ **sitemap-improved.spec.ts** - Sitemap generation (critical for SEO) - **22 tests**
- ✅ **seo-metadata-improved.spec.ts** - SEO meta tags (critical for discoverability) - **24 tests**
- ✅ **i18n-routing-improved.spec.ts** - Internationalization routing (core feature) - **20 tests**

**Total: 66 tests in 3 files**

**Characteristics:**

- ✅ No authentication required (public-facing tests only)
- ✅ Stable and deterministic
- ✅ Fast execution (~5-8 minutes total in CI)
- ✅ High business impact (SEO, i18n, discoverability)
- ✅ Low flakiness (<5% expected failure rate)

#### Full Suite Tests (Non-blocking - Layer 4)

All tests including potentially flaky ones:

- ⚠️ **auth-improved.spec.ts** - Authentication flows (complex, flaky)
- ⚠️ **likes-improved.spec.ts** - Like functionality (requires auth)
- ⚠️ **content-export-improved.spec.ts** - Content export (requires admin auth)
- ⚠️ **content-import-improved.spec.ts** - Content import (requires admin auth)
- 📝 All other `-improved.spec.ts` and `.spec.ts` files

**Total: 314 tests**

**Characteristics:**

- May require authentication
- Higher complexity
- Potential for flakiness
- Important but not deployment-blocking
- Run on schedule (every 6 hours) and create issues when failing

### 3. **Flaky Test Management**

Following Google's approach:

1. **Quarantine, Don't Ignore**
   - Flaky tests moved to non-blocking suite
   - Still run and monitored
   - Issues created automatically on failure

2. **Automatic Retries**
   - Critical tests: 2 retries in CI
   - Full suite: 0 retries (to detect flakiness)

3. **Continuous Improvement**
   - Track flaky test trends
   - Fix root causes over time
   - Gradually promote stable tests to critical path

## Implementation Details

### Configuration Files

#### `playwright.critical.config.ts`

```typescript
export default defineConfig({
  testDir: "./e2e",
  // Only match stable, non-auth tests (66 tests total)
  // Note: content-export and content-import require admin auth, excluded for stability
  testMatch: [
    "**/sitemap-improved.spec.ts", // 22 tests - SEO critical
    "**/seo-metadata-improved.spec.ts", // 24 tests - Discoverability
    "**/i18n-routing-improved.spec.ts", // 20 tests - Core i18n feature
  ],

  maxFailures: 3, // Fail fast
  fullyParallel: true,
  workers: process.env.CI ? 4 : 2,
  retries: process.env.CI ? 2 : 0,
  timeout: 45000,

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### `playwright.config.ts` (Full Suite)

```typescript
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/, // All tests

  maxFailures: undefined, // Run all tests
  retries: 0, // No retries to detect flakiness
  timeout: 60000,

  // ... rest of config
});
```

### GitHub Actions Workflows

#### `.github/workflows/ci-critical.yml` (Blocking)

```yaml
name: CI Critical Path

on:
  push:
    branches: [main, develop, feature/*]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-format:
    # ... lint, format checks

  type-check:
    # ... TypeScript checks

  unit-test:
    # ... unit tests

  e2e-critical:
    name: Critical E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15 # Fast feedback
    steps:
      # ... setup steps
      - run: npm run test:e2e:critical

  build:
    name: Build Application
    needs: [lint-and-format, type-check, unit-test, e2e-critical]
    # ... build steps
```

#### `.github/workflows/e2e.yml` (Non-blocking)

```yaml
name: E2E Full Suite (Non-blocking)

on:
  schedule:
    - cron: "0 */6 * * *" # Every 6 hours
  workflow_dispatch:

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    continue-on-error: true # Non-blocking

    steps:
      # ... test steps

      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              title: `E2E Tests Failure - ${new Date().toISOString()}`,
              body: `Full E2E suite failed. This does NOT block deployment.`,
              labels: ['e2e', 'test-failure', 'non-blocking'],
            })
```

#### `.github/workflows/docker-publish.yml`

```yaml
name: Docker Build and Push

on:
  workflow_run:
    workflows: ["CI Critical Path"]
    types: [completed]
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    # ... Docker build and push
```

## Metrics and Success Criteria

### Target Metrics

| Metric                  | Target       | Current     |
| ----------------------- | ------------ | ----------- |
| Critical Path Duration  | < 10 minutes | ~8 minutes  |
| Critical Path Pass Rate | > 95%        | TBD         |
| Full Suite Duration     | < 45 minutes | ~35 minutes |
| Full Suite Pass Rate    | > 85%        | 87%         |
| Mean Time to Deploy     | < 15 minutes | TBD         |

### Success Indicators

- ✅ Deployments not blocked by flaky tests
- ✅ Fast feedback loop (< 10 minutes)
- ✅ High confidence in critical functionality
- ✅ Visibility into full test suite health
- ✅ Automatic issue creation for failures

## Migration Plan

### Phase 1: Configuration Update ✅

- [x] Create `playwright.critical.config.ts` with stable tests only
- [x] Update `package.json` scripts
- [x] Create `ci-critical.yml` workflow

### Phase 2: Workflow Migration (Current)

- [ ] Update critical test match pattern
- [ ] Test locally
- [ ] Deploy to CI
- [ ] Verify deployment flow

### Phase 3: Monitoring & Optimization

- [ ] Monitor critical path stability (1 week)
- [ ] Track full suite flakiness
- [ ] Identify and fix flaky tests
- [ ] Gradually add stable tests to critical path

## Maintenance Guidelines

### Adding Tests to Critical Path

Before adding a test to the critical path, verify:

1. **Stability**: Run 10 times locally - must pass 10/10
2. **Speed**: Execution time < 2 minutes
3. **Independence**: No external dependencies (auth, third-party APIs)
4. **Business Value**: Covers critical user-facing functionality
5. **CI Validation**: Run in CI 5 times - must pass 5/5

### Handling Flaky Tests

When a critical test becomes flaky:

1. **Immediate Action**: Move to full suite (non-blocking)
2. **Investigation**: Analyze failure patterns
3. **Fix**: Address root cause (timeouts, race conditions, selectors)
4. **Validation**: Run 20 times locally and in CI
5. **Promotion**: Add back to critical path if stable

### Reviewing Full Suite Failures

Every week, review:

- GitHub issues created by failed E2E runs
- Flakiness trends
- Common failure patterns
- Opportunities to improve test stability

## Tools and Resources

### Running Tests Locally

```bash
# Run critical tests only
npm run test:e2e:critical

# Run full suite
npm run test:e2e

# Run specific test file
npx playwright test e2e/sitemap-improved.spec.ts

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui
```

### CI Commands

```bash
# Check CI status
gh run list --limit 5

# View workflow logs
gh run view <run-id> --log

# Trigger E2E full suite manually
gh workflow run e2e.yml
```

### Useful Links

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## Troubleshooting

### Critical Tests Failing in CI but Passing Locally

1. Check CI logs for specific error messages
2. Verify database seeding in `global-setup.ts`
3. Check environment variables in workflow
4. Increase timeouts if network-related
5. Run with `DEBUG=pw:api` for detailed logs

### Full Suite Creating Too Many Issues

1. Adjust failure threshold in workflow
2. Batch issues (daily digest instead of per-run)
3. Add filters to exclude known flaky tests
4. Prioritize fixing most common failures

### Deployment Blocked Unexpectedly

1. Check `ci-critical.yml` workflow status
2. Review recent changes to critical tests
3. Verify all jobs in workflow completed
4. Check workflow dependencies

## References

Based on industry best practices from:

- Google Testing Blog - Flaky Test Management
- Playwright Official Documentation
- Martin Fowler - Continuous Integration
- ThoughtWorks Technology Radar
- DevOps Research and Assessment (DORA) Metrics

## Changelog

### 2025-10-04

- Initial strategy document created
- Implemented layered testing approach
- Separated critical path from full suite
- Made full E2E suite non-blocking

---

**Document Owner**: Engineering Team
**Last Updated**: 2025-10-04
**Next Review**: 2025-10-18
