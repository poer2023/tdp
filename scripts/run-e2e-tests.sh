#!/bin/bash

# E2E Test Runner Script for i18n Features
# This script runs all E2E tests for features implemented in the i18n upgrade

set -e

echo "🧪 Running E2E Tests for i18n Features"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if dev server is running
check_server() {
  echo "🔍 Checking if dev server is running..."
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Dev server is running"
    return 0
  else
    echo -e "${RED}✗${NC} Dev server is not running"
    echo ""
    echo "Please start the dev server first:"
    echo "  npm run dev"
    echo ""
    exit 1
  fi
}

# Run all E2E tests
run_all_tests() {
  echo ""
  echo "📋 Running all E2E tests..."
  echo ""

  npx playwright test
}

# Run specific test suites
run_i18n_tests() {
  echo ""
  echo "🌐 Running i18n routing tests..."
  npx playwright test e2e/i18n-routing.spec.ts
}

run_likes_tests() {
  echo ""
  echo "❤️  Running likes feature tests..."
  npx playwright test e2e/likes.spec.ts
}


run_auth_tests() {
  echo ""
  echo "🔐 Running authentication tests..."
  npx playwright test e2e/auth.spec.ts
}

run_sitemap_tests() {
  echo ""
  echo "🗺️  Running sitemap tests..."
  npx playwright test e2e/sitemap.spec.ts
}

run_content_ops_tests() {
  echo ""
  echo "📦 Running content operations tests..."
  npx playwright test e2e/content-operations.spec.ts
}

# Generate test report
generate_report() {
  echo ""
  echo "📊 Generating test report..."
  npx playwright show-report
}

# Main execution
main() {
  check_server

  # Parse command line arguments
  case "${1:-all}" in
    all)
      run_all_tests
      ;;
    i18n)
      run_i18n_tests
      ;;
    likes)
      run_likes_tests
      ;;
    auth)
      run_auth_tests
      ;;
    sitemap)
      run_sitemap_tests
      ;;
    content)
      run_content_ops_tests
      ;;
    report)
      generate_report
      ;;
    *)
      echo "Usage: $0 [all|i18n|likes|auth|sitemap|content|report]"
      exit 1
      ;;
  esac

  echo ""
  echo -e "${GREEN}✓${NC} E2E tests completed!"
  echo ""
  echo "To view the test report, run:"
  echo "  npm run test:e2e:report"
}

main "$@"
