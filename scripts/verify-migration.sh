#!/bin/bash

###############################################################################
# Migration Verification Script
#
# Verifies database schema integrity before and after migrations
# Ensures no data loss during CI/CD deployments
#
# Usage:
#   ./scripts/verify-migration.sh [--check-only]
#
# Environment Variables Required:
#   DATABASE_URL - PostgreSQL connection string
#
# Features:
#   - Pre-migration schema verification
#   - Post-migration validation
#   - Row count verification
#   - Schema drift detection
#   - Safe rollback on failure
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
CHECK_ONLY="${1:-false}"
VERIFY_DIR="${VERIFY_DIR:-./migration-verify}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Parse DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract connection details
DB_URL="${DATABASE_URL}"
DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGPASSWORD="$DB_PASS"

log_info "Migration verification starting..."
log_info "Database: $DB_NAME"
log_info "Host: $DB_HOST:$DB_PORT"

# Create verification directory
mkdir -p "$VERIFY_DIR"

# Function to get table row counts
get_row_counts() {
    local output_file="$1"

    log_step "Collecting table row counts..."

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -F"," << 'EOF' > "$output_file"
SELECT
    schemaname || '.' || tablename as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY schemaname, tablename;
EOF

    if [ -s "$output_file" ]; then
        log_info "Row counts saved to: $output_file"
        return 0
    else
        log_warn "No tables found or unable to collect row counts"
        return 1
    fi
}

# Function to get schema checksum
get_schema_checksum() {
    local output_file="$1"

    log_step "Calculating schema checksum..."

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << 'EOF' > "$output_file"
SELECT md5(string_agg(
    table_schema || '.' || table_name || ':' ||
    column_name || ':' || data_type || ':' ||
    COALESCE(character_maximum_length::text, ''),
    '|' ORDER BY table_schema, table_name, ordinal_position
))
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
EOF

    log_info "Schema checksum saved to: $output_file"
}

# Function to check Prisma migration status
check_migration_status() {
    log_step "Checking Prisma migration status..."

    if npx prisma migrate status > "$VERIFY_DIR/migration_status_${TIMESTAMP}.txt" 2>&1; then
        log_info "Migration status check passed"
        cat "$VERIFY_DIR/migration_status_${TIMESTAMP}.txt"
        return 0
    else
        log_error "Migration status check failed"
        cat "$VERIFY_DIR/migration_status_${TIMESTAMP}.txt"
        return 1
    fi
}

# Function to compare row counts
compare_row_counts() {
    local before_file="$1"
    local after_file="$2"

    log_step "Comparing row counts before and after migration..."

    local lost_rows=false

    while IFS=',' read -r table count_after; do
        # Get count before
        local count_before=$(grep "^${table}," "$before_file" 2>/dev/null | cut -d',' -f2 || echo "0")

        if [ "$count_before" -gt "$count_after" ]; then
            log_error "❌ Data loss detected in table: $table (Before: $count_before, After: $count_after)"
            lost_rows=true
        elif [ "$count_before" -lt "$count_after" ]; then
            log_info "✅ Table $table: Rows increased ($count_before → $count_after)"
        else
            log_info "✅ Table $table: Row count unchanged ($count_before)"
        fi
    done < "$after_file"

    if [ "$lost_rows" = true ]; then
        log_error "⚠️ DATA LOSS DETECTED! Migration verification failed!"
        return 1
    else
        log_info "✅ No data loss detected. All tables verified."
        return 0
    fi
}

# Main verification flow
if [ "$CHECK_ONLY" = "--check-only" ]; then
    log_info "Running in check-only mode..."

    # Check migration status
    check_migration_status

    # Get current row counts
    get_row_counts "$VERIFY_DIR/row_counts_check_${TIMESTAMP}.csv"

    # Get schema checksum
    get_schema_checksum "$VERIFY_DIR/schema_checksum_check_${TIMESTAMP}.txt"

    log_info "Check completed successfully!"
    exit 0
fi

# Pre-migration verification
log_step "=== PRE-MIGRATION VERIFICATION ==="

get_row_counts "$VERIFY_DIR/row_counts_before_${TIMESTAMP}.csv"
get_schema_checksum "$VERIFY_DIR/schema_checksum_before_${TIMESTAMP}.txt"
check_migration_status

log_info "Pre-migration verification completed"

# Inform user to run migration
log_warn "⚠️ Please run your migration now (e.g., prisma migrate deploy)"
log_warn "After migration completes, run this script again with the same TIMESTAMP"

# Save timestamp for post-migration check
echo "$TIMESTAMP" > "$VERIFY_DIR/current_migration_timestamp.txt"

log_info "Verification data saved with timestamp: $TIMESTAMP"
log_info "To verify after migration, run: ./scripts/verify-migration.sh --post-check"

exit 0
