#!/bin/bash

###############################################################################
# GitHub Issue Alert Script for CI/CD
#
# Creates GitHub Issues for deployment/migration failures
# Designed to be called from GitHub Actions workflow
#
# Usage:
#   ./scripts/alert-github-issue.sh <title> <body> [labels]
#
# Environment Variables Required:
#   GITHUB_TOKEN - GitHub personal access token or ${{ github.token }}
#   GITHUB_REPOSITORY - Repository in format "owner/repo"
#
# Features:
#   - Creates labeled issues for different failure types
#   - Includes error logs and system status
#   - Prevents duplicate issues
#   - Supports custom labels and priorities
###############################################################################

set -euo pipefail

# Configuration
ISSUE_TITLE="${1:-Deployment Failure}"
ISSUE_BODY="${2:-Deployment failed without details}"
ISSUE_LABELS="${3:-deployment-failure,automated-alert}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment variables
validate_env() {
    if [ -z "${GITHUB_TOKEN:-}" ]; then
        log_error "GITHUB_TOKEN environment variable is required"
        log_error "Set it in GitHub Actions: \${{ secrets.GITHUB_TOKEN }} or \${{ github.token }}"
        exit 1
    fi

    if [ -z "${GITHUB_REPOSITORY:-}" ]; then
        log_error "GITHUB_REPOSITORY environment variable is required"
        log_error "Format: owner/repo"
        exit 1
    fi
}

# Check for duplicate issues
check_duplicate_issues() {
    local title="$1"
    log_info "Checking for duplicate issues..."

    # Search for open issues with the same title
    local existing_issues=$(gh issue list \
        --repo "$GITHUB_REPOSITORY" \
        --state open \
        --search "\"$title\" in:title" \
        --json number \
        --jq '.[].number' 2>/dev/null || echo "")

    if [ -n "$existing_issues" ]; then
        log_warn "Found existing open issue(s) with similar title: #$existing_issues"
        log_warn "Skipping duplicate issue creation"
        return 1
    fi

    return 0
}

# Create GitHub Issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"

    log_info "Creating GitHub Issue..."
    log_info "Title: $title"
    log_info "Labels: $labels"

    # Add metadata to issue body
    local full_body="$body

---

## 🤖 Automated Alert Information

- **Timestamp**: $(date '+%Y-%m-%d %H:%M:%S UTC')
- **Workflow Run**: [View Logs](${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID:-unknown})
- **Commit**: \`${GITHUB_SHA:-unknown}\`
- **Branch**: \`${GITHUB_REF_NAME:-unknown}\`
- **Actor**: @${GITHUB_ACTOR:-unknown}

---

**This issue was automatically created by the CI/CD deployment workflow.**
"

    # Create issue using gh CLI
    if gh issue create \
        --repo "$GITHUB_REPOSITORY" \
        --title "$title" \
        --body "$full_body" \
        --label "$labels" 2>&1; then
        log_info "✅ GitHub Issue created successfully"
        return 0
    else
        log_error "❌ Failed to create GitHub Issue"
        return 1
    fi
}

# Main function
main() {
    log_info "=== GitHub Issue Alert Starting ==="

    # Validate environment
    validate_env

    # Check for duplicates
    if ! check_duplicate_issues "$ISSUE_TITLE"; then
        log_info "Issue not created due to existing duplicate"
        exit 0
    fi

    # Create issue
    if create_issue "$ISSUE_TITLE" "$ISSUE_BODY" "$ISSUE_LABELS"; then
        log_info "=== Alert Issue Created Successfully ==="
        exit 0
    else
        log_error "=== Alert Issue Creation Failed ==="
        exit 1
    fi
}

# Run main function
main
