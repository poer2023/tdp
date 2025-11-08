#!/bin/bash

###############################################################################
# Automatic Database Restore Script for CI/CD
#
# Restores database from the latest backup when migration fails
# Designed to be called from GitHub Actions deployment workflow
#
# Usage:
#   ./scripts/restore-from-backup.sh [backup_file_path]
#
# Features:
#   - Finds latest backup automatically
#   - Safe restoration with connection termination
#   - Docker-aware execution
#   - Comprehensive logging for CI/CD
###############################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RESTORE_TIMEOUT=300  # 5 minutes timeout for restore

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Find latest backup file
find_latest_backup() {
    local backup_file

    if [ $# -gt 0 ] && [ -f "$1" ]; then
        backup_file="$1"
        log_info "Using specified backup: $backup_file"
    else
        # Find most recent backup file
        backup_file=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -printf '%T+ %p\n' 2>/dev/null | \
                      sort -r | head -n1 | cut -d' ' -f2-)

        if [ -z "$backup_file" ]; then
            log_error "No backup files found in $BACKUP_DIR"
            exit 1
        fi

        log_info "Using latest backup: $backup_file"
    fi

    # Verify backup file exists and is readable
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    if [ ! -r "$backup_file" ]; then
        log_error "Backup file not readable: $backup_file"
        exit 1
    fi

    echo "$backup_file"
}

# Restore database using Docker
restore_with_docker() {
    local backup_file="$1"

    log_step "=== Starting Database Restore (Docker Method) ==="

    # Extract database connection from .env file
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Cannot determine database credentials."
        exit 1
    fi

    # Source DATABASE_URL from .env
    export $(grep -v '^#' .env | grep 'DATABASE_URL=' | xargs)

    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL not found in .env file"
        exit 1
    fi

    # Parse DATABASE_URL
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

    log_info "Database: $DB_NAME"
    log_info "Host: $DB_HOST:$DB_PORT"
    log_info "User: $DB_USER"

    # Terminate existing connections
    log_step "Terminating existing database connections..."

    docker compose exec -T postgres psql -U "$DB_USER" -d postgres <<EOF || {
        log_warn "Could not terminate connections (database may be idle)"
    }
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
EOF

    # Drop and recreate database
    log_step "Dropping and recreating database..."

    docker compose exec -T postgres psql -U "$DB_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS "$DB_NAME";
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
EOF

    # Restore from backup
    log_step "Restoring from backup file: $(basename "$backup_file")"
    log_info "This may take several minutes for large databases..."

    # Decompress and restore
    if timeout "$RESTORE_TIMEOUT" gunzip -c "$backup_file" | \
       docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log_info "✅ Database restored successfully from backup"
        return 0
    else
        log_error "❌ Database restore failed or timed out after ${RESTORE_TIMEOUT}s"
        return 1
    fi
}

# Main restore flow
main() {
    log_info "=== Automatic Database Restore Starting ==="
    log_info "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"

    # Check if Docker is available
    if ! docker compose ps > /dev/null 2>&1; then
        log_error "Docker Compose not available or containers not running"
        log_error "Cannot perform automatic restore"
        exit 1
    fi

    # Find backup file
    BACKUP_FILE=$(find_latest_backup "$@")

    if [ -z "$BACKUP_FILE" ]; then
        log_error "Failed to find backup file"
        exit 1
    fi

    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup file size: $BACKUP_SIZE"

    # Confirm restore in interactive mode
    if [ -t 0 ]; then
        log_warn "⚠️  WARNING: This will DROP and RESTORE the database!"
        log_warn "Database: $(grep 'DATABASE_URL=' .env | cut -d'/' -f4 | cut -d'?' -f1)"
        log_warn "Backup: $(basename "$BACKUP_FILE")"
        read -p "Continue? (yes/no): " CONFIRM

        if [ "$CONFIRM" != "yes" ]; then
            log_info "Restore cancelled by user"
            exit 0
        fi
    else
        log_warn "Running in non-interactive mode (CI/CD)"
        log_warn "Proceeding with automatic restore..."
    fi

    # Execute restore
    if restore_with_docker "$BACKUP_FILE"; then
        log_info "=== Database Restore Completed Successfully ==="
        log_info "Database has been restored from: $(basename "$BACKUP_FILE")"
        exit 0
    else
        log_error "=== Database Restore Failed ==="
        exit 1
    fi
}

# Run main function
main "$@"
