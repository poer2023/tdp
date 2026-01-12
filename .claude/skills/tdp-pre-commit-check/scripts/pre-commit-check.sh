#!/usr/bin/env bash
# TDP Pre-Commit Check Script
# Runs all checks required before committing code

set -e

echo "🔍 TDP Pre-Commit Check"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Phase 1: Quick checks
echo ""
echo "📋 Phase 1: Quick Checks"

# Check for console.log
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -v "__tests__" | grep -v "node_modules" | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $CONSOLE_LOGS console.log statements${NC}"
    grep -r "console\.log" --include="*.ts" --include="*.tsx" src/ | grep -v "__tests__" | head -5
    echo "   Fix: Use console.warn or console.error instead"
else
    echo -e "${GREEN}✓ No console.log found${NC}"
fi

# Phase 2: Lint
echo ""
echo "📋 Phase 2: ESLint Check"
if pnpm lint 2>&1; then
    echo -e "${GREEN}✓ Lint passed${NC}"
else
    echo -e "${RED}✗ Lint failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Phase 3: TypeScript
echo ""
echo "📋 Phase 3: TypeScript Check"
if pnpm type-check 2>&1; then
    echo -e "${GREEN}✓ TypeScript passed${NC}"
else
    echo -e "${RED}✗ TypeScript failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Phase 4: SSR Safety (quick grep)
echo ""
echo "📋 Phase 4: SSR Safety Check"
UNSAFE_WINDOW=$(grep -rn "window\." --include="*.tsx" src/components/ 2>/dev/null | grep -v "typeof window" | grep -v "useEffect" | wc -l | tr -d ' ')
if [ "$UNSAFE_WINDOW" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $UNSAFE_WINDOW potential SSR issues with window${NC}"
    grep -rn "window\." --include="*.tsx" src/components/ | grep -v "typeof window" | grep -v "useEffect" | head -3
else
    echo -e "${GREEN}✓ No obvious SSR issues${NC}"
fi

# Summary
echo ""
echo "========================"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed. Fix before committing.${NC}"
    exit 1
fi
