#!/bin/bash

# ============================================================================
# Deployment Pre-Flight Checklist
# ============================================================================
# Validates the application is ready for production deployment
# Run this script before deploying to catch common issues early
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deployment Pre-Flight Checklist${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNED++))
}

# ============================================================================
# 1. Environment Variables
# ============================================================================
echo -e "\n${BLUE}[1/8] Checking Environment Variables...${NC}"

if [ -z "$DATABASE_URL" ]; then
    check_fail "DATABASE_URL not set"
else
    check_pass "DATABASE_URL is set"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    check_fail "NEXTAUTH_SECRET not set"
else
    check_pass "NEXTAUTH_SECRET is set"
fi

if [ -z "$NEXTAUTH_URL" ]; then
    check_fail "NEXTAUTH_URL not set"
else
    check_pass "NEXTAUTH_URL is set"
fi

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    check_fail "GOOGLE_CLIENT_ID not set"
else
    check_pass "GOOGLE_CLIENT_ID is set"
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    check_fail "GOOGLE_CLIENT_SECRET not set"
else
    check_pass "GOOGLE_CLIENT_SECRET is set"
fi

if [ -z "$NEXT_PUBLIC_SITE_URL" ]; then
    check_fail "NEXT_PUBLIC_SITE_URL not set"
else
    check_pass "NEXT_PUBLIC_SITE_URL is set"
fi

# ============================================================================
# 2. Code Quality
# ============================================================================
echo -e "\n${BLUE}[2/8] Running Code Quality Checks...${NC}"

# TypeScript check
echo -n "Running TypeScript compiler... "
if npm run typecheck > /dev/null 2>&1; then
    check_pass "TypeScript compilation successful"
else
    check_fail "TypeScript compilation failed"
    echo -e "  ${RED}Run 'npm run typecheck' for details${NC}"
fi

# ESLint check
echo -n "Running ESLint... "
if npm run lint > /dev/null 2>&1; then
    check_pass "ESLint passed"
else
    check_fail "ESLint found errors"
    echo -e "  ${RED}Run 'npm run lint' for details${NC}"
fi

# ============================================================================
# 3. Build
# ============================================================================
echo -e "\n${BLUE}[3/8] Testing Build...${NC}"

echo -n "Building application... "
if npm run build > /dev/null 2>&1; then
    check_pass "Build successful"
else
    check_fail "Build failed"
    echo -e "  ${RED}Run 'npm run build' for details${NC}"
fi

# ============================================================================
# 4. Database
# ============================================================================
echo -e "\n${BLUE}[4/8] Checking Database...${NC}"

# Check database connection
echo -n "Testing database connection... "
if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    check_pass "Database connection successful"
else
    check_fail "Cannot connect to database"
fi

# Check for pending migrations
echo -n "Checking for pending migrations... "
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    check_pass "Database schema up to date"
elif echo "$MIGRATION_STATUS" | grep -q "pending migrations"; then
    check_warn "Pending migrations detected - run 'npx prisma migrate deploy'"
else
    check_warn "Could not determine migration status"
fi

# ============================================================================
# 5. Content Data
# ============================================================================
echo -e "\n${BLUE}[5/8] Checking Content Data...${NC}"

# Check for posts
POST_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Post\"" 2>/dev/null | tail -1 || echo "0")

if [ "$POST_COUNT" -gt 0 ]; then
    check_pass "Found $POST_COUNT posts in database"
else
    check_warn "No posts found in database - is this intentional?"
fi

# Check for post locales
EN_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Post\" WHERE locale = 'EN'" 2>/dev/null | tail -1 || echo "0")
ZH_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Post\" WHERE locale = 'ZH'" 2>/dev/null | tail -1 || echo "0")

if [ "$EN_COUNT" -gt 0 ]; then
    check_pass "Found $EN_COUNT English posts"
else
    check_warn "No English posts found"
fi

if [ "$ZH_COUNT" -gt 0 ]; then
    check_pass "Found $ZH_COUNT Chinese posts"
else
    check_warn "No Chinese posts found"
fi

# ============================================================================
# 6. Security
# ============================================================================
echo -e "\n${BLUE}[6/8] Security Checks...${NC}"

# Check if NEXTAUTH_SECRET is strong
if [ -n "$NEXTAUTH_SECRET" ] && [ ${#NEXTAUTH_SECRET} -ge 32 ]; then
    check_pass "NEXTAUTH_SECRET is sufficiently long (≥32 chars)"
else
    check_fail "NEXTAUTH_SECRET is too short (should be ≥32 chars)"
    echo -e "  ${YELLOW}Generate with: openssl rand -base64 32${NC}"
fi

# Check if NEXTAUTH_URL uses HTTPS
if [[ "$NEXTAUTH_URL" == https://* ]]; then
    check_pass "NEXTAUTH_URL uses HTTPS"
else
    check_warn "NEXTAUTH_URL does not use HTTPS"
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    check_pass "Node.js version is 18+ (v$(node -v))"
else
    check_fail "Node.js version is too old ($(node -v)), requires 18+"
fi

# ============================================================================
# 7. Dependencies
# ============================================================================
echo -e "\n${BLUE}[7/8] Checking Dependencies...${NC}"

# Check for known vulnerabilities
echo -n "Checking for security vulnerabilities... "
AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)

if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    check_pass "No high/critical vulnerabilities found"
elif echo "$AUDIT_OUTPUT" | grep -q "vulnerabilities"; then
    VULN_COUNT=$(echo "$AUDIT_OUTPUT" | grep -oP '\d+(?= vulnerabilities)' | head -1)
    check_warn "Found $VULN_COUNT vulnerabilities - run 'npm audit' for details"
else
    check_pass "Dependency audit completed"
fi

# Check for outdated critical packages
echo -n "Checking critical packages... "
if npm list next@latest react@latest @prisma/client@latest > /dev/null 2>&1; then
    check_pass "Critical packages installed"
else
    check_warn "Some critical packages may need updating"
fi

# ============================================================================
# 8. File System
# ============================================================================
echo -e "\n${BLUE}[8/8] Checking File System...${NC}"

# Check for required files
REQUIRED_FILES=("package.json" "prisma/schema.prisma" "next.config.js")

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Found $file"
    else
        check_fail "Missing $file"
    fi
done

# Check for .env in production
if [ -f ".env" ] && [ "$NODE_ENV" = "production" ]; then
    check_warn ".env file found in production - use environment variables instead"
fi

# Check for backup directory
if [ ! -d "backups" ]; then
    check_warn "No backups directory found - consider creating one"
fi

# ============================================================================
# Summary
# ============================================================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNED"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED"
echo -e "${BLUE}========================================${NC}\n"

# Exit code
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}✗ Pre-flight checks FAILED${NC}"
    echo -e "${RED}Please fix the failed checks before deploying${NC}\n"
    exit 1
elif [ $CHECKS_WARNED -gt 0 ]; then
    echo -e "${YELLOW}⚠ Pre-flight checks passed with warnings${NC}"
    echo -e "${YELLOW}Review warnings before deploying${NC}\n"
    exit 0
else
    echo -e "${GREEN}✓ All pre-flight checks PASSED${NC}"
    echo -e "${GREEN}Ready for deployment!${NC}\n"
    exit 0
fi
