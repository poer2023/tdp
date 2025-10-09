#!/bin/bash

# Coverage Tracking Script for TDP Project
# This script checks test coverage and enforces minimum thresholds

set -e

echo "🔍 Checking test coverage..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run unit tests with coverage
echo "📊 Running unit tests with coverage..."
npm run test:coverage -- --run > /dev/null 2>&1 || {
  echo -e "${RED}❌ Unit tests failed${NC}"
  exit 1
}

# Parse coverage results from JSON
if [ ! -f "coverage/coverage-summary.json" ]; then
  echo -e "${RED}❌ Coverage report not found${NC}"
  exit 1
fi

# Extract coverage percentages using Node.js
read -r lines functions branches statements <<< $(node -p "
  const coverage = require('./coverage/coverage-summary.json').total;
  [
    coverage.lines.pct,
    coverage.functions.pct,
    coverage.branches.pct,
    coverage.statements.pct
  ].join(' ')
")

# Define thresholds
LINES_THRESHOLD=75
FUNCTIONS_THRESHOLD=70
BRANCHES_THRESHOLD=70
STATEMENTS_THRESHOLD=75

# Check thresholds
echo ""
echo "📈 Coverage Report:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

failed=0

check_threshold() {
  local name=$1
  local value=$2
  local threshold=$3

  if (( $(echo "$value >= $threshold" | bc -l) )); then
    echo -e "${GREEN}✅ ${name}: ${value}% (threshold: ${threshold}%)${NC}"
  else
    echo -e "${RED}❌ ${name}: ${value}% (threshold: ${threshold}%)${NC}"
    failed=1
  fi
}

check_threshold "Lines      " "$lines" "$LINES_THRESHOLD"
check_threshold "Functions  " "$functions" "$FUNCTIONS_THRESHOLD"
check_threshold "Branches   " "$branches" "$BRANCHES_THRESHOLD"
check_threshold "Statements " "$statements" "$STATEMENTS_THRESHOLD"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $failed -eq 1 ]; then
  echo ""
  echo -e "${RED}❌ Coverage check failed!${NC}"
  echo -e "${YELLOW}💡 Tip: Run 'npm run test:coverage' to see detailed report${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}✅ All coverage thresholds met!${NC}"
  exit 0
fi
