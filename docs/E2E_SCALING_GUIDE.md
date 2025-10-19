# E2E Testing Scaling Guide

## Overview

This guide documents the modular testing strategy for the TDP project, designed to scale E2E testing while maintaining fast feedback loops during development.

## Testing Strategy

### Modular Test Scripts

The project uses a modular testing approach with specialized test scripts that can be run independently or as part of CI/CD pipelines.

#### Available Test Scripts

| Script                              | Purpose                         | Scope                           | Typical Runtime |
| ----------------------------------- | ------------------------------- | ------------------------------- | --------------- |
| `npm run test:run`                  | Core unit tests                 | All unit tests                  | 5-10s           |
| `npm run test:credentials`          | Credentials module tests        | Admin credentials functionality | 2-5s            |
| `npm run test:features`             | Feature flag tests              | Feature toggle system           | 1-2s            |
| `npm run test:admin`                | Admin module tests              | All admin components            | 3-7s            |
| `npm run test:integration:coverage` | Integration tests with coverage | API and integration tests       | 15-30s          |
| `npm run test:e2e:critical`         | Critical path E2E tests         | Most important user flows       | 2-5 min         |
| `npm run test:e2e`                  | Full E2E test suite             | Complete application flows      | 10-15 min       |

### Development Workflow

#### During Active Development

```bash
# Run only affected tests
npm run test:credentials  # When working on credentials
npm run test:admin       # When working on admin features
npm run test:features    # When working on feature flags
```

#### Before Creating PR

```bash
# Run critical checks (matches CI)
npm run lint
npm run type-check
npm run test:credentials
npm run test:run
```

#### Local Validation

```bash
# Full local test run
npm run test:run && npm run test:integration:coverage && npm run test:e2e:critical
```

## Database Degradation Testing

### E2E_SKIP_DB Mode

The application supports offline/degraded mode testing using the `E2E_SKIP_DB` environment variable.

#### Running Tests in Degraded Mode

```bash
# Set environment variable
export E2E_SKIP_DB=1

# Run application
npm run dev

# Run degradation E2E tests
npx playwright test e2e/degradation.spec.ts
```

#### What Gets Tested

1. **Frontend Resilience**: Pages load without crashes when DB is unavailable
2. **Error Boundaries**: Proper error handling and user-friendly messages
3. **Feature Flags**: Feature toggle behavior in degraded mode
4. **Performance**: Application performance under degradation
5. **UI State Management**: Empty states and degradation warnings display correctly

### Degradation Test Scenarios

Located in `e2e/degradation.spec.ts`:

- ✅ Admin dashboard degradation warnings
- ✅ Navigation without crashes in degraded mode
- ✅ Frontend pages with empty states
- ✅ Error boundary functionality
- ✅ Feature flag respect
- ✅ External API failure handling
- ✅ Performance under degradation
- ✅ Memory leak prevention

## CI/CD Integration

### PR Stage (ci-critical.yml)

Fast feedback for pull requests:

```yaml
unit-test:
  - Run unit tests (npm run test:run)
  - Run credentials tests (npm run test:credentials)

integration-test:
  - Run integration tests with coverage

e2e-critical:
  - Run critical path E2E tests (~60-80 tests)
```

**Estimated Total Time**: 8-12 minutes

### Main Branch/Scheduled

Comprehensive validation:

```yaml
e2e-full:
  - Run complete E2E test suite
  - Run degradation tests
  - Performance validation
```

**Estimated Total Time**: 15-25 minutes

## Test Organization

### Unit Tests

```
src/
├── lib/
│   └── utils/
│       └── __tests__/
│           ├── db-fallback.test.ts      # Database fallback utilities
│           └── ...
├── components/
│   └── admin/
│       └── __tests__/
│           ├── recent-uploads.test.tsx  # Component degradation tests
│           ├── recent-posts.test.tsx
│           ├── dashboard-metrics.test.tsx
│           └── dashboard-activity.test.tsx
└── app/
    └── admin/
        └── credentials/
            └── __tests__/
                └── ...                   # Credentials module tests
```

### E2E Tests

```
e2e/
├── auth/                    # Authentication flows
├── admin/                   # Admin functionality
├── posts/                   # Blog posts management
├── gallery/                 # Gallery functionality
├── search/                  # Search features
└── degradation.spec.ts      # Database degradation scenarios
```

## Best Practices

### When to Run Which Tests

**Working on Admin Credentials**:

```bash
npm run test:credentials
```

**Working on Frontend Components**:

```bash
npm run test:admin
```

**Working on Core Utilities**:

```bash
npm run test:run
```

**Before Pushing Code**:

```bash
npm run lint && npm run type-check && npm run test:credentials
```

**Before Merging**:

- Let CI run the full test suite
- Review test results in GitHub Actions

### Adding New Tests

1. **Unit Tests**: Place in `__tests__/` directory next to the code
2. **Component Tests**: Use `src/components/**/__tests__/` pattern
3. **E2E Tests**: Add to appropriate `e2e/` subdirectory
4. **Degradation Tests**: Add scenarios to `e2e/degradation.spec.ts`

### Test Naming Conventions

```typescript
// Unit tests
describe("ComponentName", () => {
  describe("feature", () => {
    it("should behave correctly", () => {});
  });

  describe("service degradation", () => {
    it("should display degradation warning", () => {});
  });
});

// E2E tests
test.describe("Feature Area", () => {
  test("should complete critical user flow", async ({ page }) => {});
});
```

## Monitoring and Maintenance

### Performance Tracking

Monitor test execution times in CI:

```bash
# Check test timing locally
npm run test:run -- --reporter=verbose
```

### Test Health Metrics

- **Pass Rate**: Target >99% on main branch
- **Flaky Tests**: Zero tolerance policy
- **Coverage**: >80% for critical paths
- **Execution Time**: <15 minutes for CI pipeline

### Troubleshooting

#### Tests Timing Out

```bash
# Increase timeout for specific tests
test('slow operation', async () => {}, { timeout: 30000 });
```

#### Flaky Tests

1. Check for race conditions
2. Verify proper cleanup in afterEach/beforeEach
3. Use Playwright's auto-waiting features
4. Add explicit waits where necessary

#### Database Issues

```bash
# Reset database
npx prisma migrate reset --force

# Regenerate Prisma client
npx prisma generate
```

## Future Enhancements

- [ ] Parallel test execution for E2E tests
- [ ] Visual regression testing integration
- [ ] Test result analytics and reporting
- [ ] Automatic test generation for new components
- [ ] Performance benchmarking in E2E tests

## References

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Modular Development Playbook](./modular-development-playbook.md)
