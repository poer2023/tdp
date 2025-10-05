# Archived Migration Scripts

This directory contains one-time migration scripts that have been completed and archived for historical reference.

## Scripts

### backfill-i18n.ts

**Purpose**: One-time i18n data migration script

**When Used**: During the i18n architecture upgrade (2025-10)

**What It Did**:

- Backfilled locale field for existing posts
- Set default locale based on content language detection
- Migrated posts to new i18n schema structure

**Status**: ✅ Completed and archived

**Why Archived**: Migration completed, all posts have locale fields populated

---

### migrate-chinese-slugs.ts

**Purpose**: One-time Chinese slug conversion to pinyin

**When Used**: During the i18n routing implementation (2025-10)

**What It Did**:

- Converted Chinese character slugs to pinyin equivalents
- Updated post slugs for URL compatibility
- Ensured SEO-friendly URLs for Chinese content

**Status**: ✅ Completed and archived

**Why Archived**: All Chinese posts migrated to pinyin slugs, no further migration needed

---

## Notes

These scripts are preserved for:

- Historical reference and documentation
- Understanding past migration decisions
- Reference for future similar migrations

**⚠️ Do not execute these scripts** - they were designed for one-time use and executing them again may cause data inconsistencies.

---

**Last Updated**: 2025-10-05
**Archived By**: Development Team
