# Testing Documentation

This document describes the automated test scripts for validating the blog's i18n and content management features.

## Test Scripts

All test scripts are located in `/scripts` and can be run with `npx tsx`.

### 1. Export/Import Round-Trip Test

**File**: `scripts/test-export-import.ts`

**Purpose**: Validates the integrity of content export and import operations.

**What it tests**:

- Export all posts to ZIP format
- Parse exported Markdown files
- Validate frontmatter completeness
- Dry-run import to verify matching logic
- Compare exported data with original posts
- Verify no data loss or corruption

**Run**:

```bash
npx tsx scripts/test-export-import.ts
```

**Expected output**:

- ✅ Export complete
- ✅ All files validated
- ✅ No data integrity issues
- ✅ Import dry-run successful

**What to check**:

- File count matches original post count
- All frontmatter fields preserved
- Content body unchanged
- No parsing errors

---

### 2. Comment System E2E Test

**File**: `scripts/test-comments.ts`

**Purpose**: End-to-end validation of the comment system.

**What it tests**:

- Comment creation with auth requirement
- First-time commenter moderation (PENDING status)
- Comment approval workflow
- Auto-approval for returning users
- Threaded replies (parent-child relationship)
- Comment retrieval with threading
- Comment statistics and counting

**Run**:

```bash
npx tsx scripts/test-comments.ts
```

**Expected output**:

- ✅ Comment creation works
- ✅ Moderation workflow functional
- ✅ Auto-approval logic correct
- ✅ Threading (replies) works
- ✅ Comment retrieval functional

**What to check**:

- First comment → PENDING status
- After approval → PUBLISHED status
- Second comment from same user → auto-PUBLISHED
- Replies correctly linked via parentId
- Comments retrieved with proper threading

---

### 3. Sitemap Validation Test

**File**: `scripts/test-sitemap.ts`

**Purpose**: Validates sitemap generation and coverage.

**What it tests**:

- Sitemap XML structure and syntax
- All published posts included
- URL format correctness
- Last modified dates validity
- Coverage percentage (target: ≥95%)
- Locale-specific sitemaps (EN/ZH)

**Run**:

```bash
npx tsx scripts/test-sitemap.ts
```

**Expected output**:

- ✅ All URLs properly formatted
- ✅ Coverage ≥95%
- ✅ Valid dates
- ✅ Proper XML structure

**What to check**:

- Coverage: (posts in sitemaps / total published) ≥ 95%
- All URLs pass `new URL()` validation
- No future dates in lastmod
- XML has proper declaration and namespace

**Manual validation**:

1. Visit `http://localhost:3000/sitemap.xml`
2. Visit `http://localhost:3000/sitemap-en.xml`
3. Visit `http://localhost:3000/sitemap-zh.xml`
4. Submit to Google Search Console

---

### 4. SEO Metadata Validation Test

**File**: `scripts/test-seo-metadata.ts`

**Purpose**: Validates SEO metadata and structured data.

**What it tests**:

- JSON-LD BlogPosting schema structure
- Required schema fields present
- Locale-specific `inLanguage` tags (en-US, zh-CN)
- Hreflang alternate language links
- Canonical URL format
- Metadata completeness (title, excerpt, publishedAt)

**Run**:

```bash
npx tsx scripts/test-seo-metadata.ts
```

**Expected output**:

- ✅ JSON-LD schema properly structured
- ✅ Locale-specific language tags correct
- ✅ Hreflang links generated
- ✅ All URLs valid
- ✅ Metadata complete

**What to check**:

- Schema has required fields: @context, @type, headline, inLanguage, datePublished
- EN posts: `inLanguage: "en-US"`
- ZH posts: `inLanguage: "zh-CN"`
- Hreflang links: `en`, `zh`, `x-default` (points to EN)
- All posts have title, excerpt, and publishedAt

**Manual validation**:

1. Test with [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Validate hreflang in Google Search Console
3. Check Open Graph tags in [Facebook Debugger](https://developers.facebook.com/tools/debug/)

---

## Running All Tests

To run all tests sequentially:

```bash
npx tsx scripts/test-export-import.ts && \
npx tsx scripts/test-comments.ts && \
npx tsx scripts/test-sitemap.ts && \
npx tsx scripts/test-seo-metadata.ts
```

Expected total time: ~10-15 seconds

---

## Test Results Summary

All tests should pass with the following indicators:

| Test          | Expected Result             | Critical? |
| ------------- | --------------------------- | --------- |
| Export/Import | ✅ Round-trip lossless      | Yes       |
| Comments      | ✅ All workflows functional | Yes       |
| Sitemap       | ✅ Coverage ≥95%            | Yes       |
| SEO Metadata  | ✅ All fields valid         | Yes       |

---

## Troubleshooting

### Export/Import Test Fails

**Issue**: File count mismatch

- **Cause**: Posts with DRAFT status excluded from export
- **Fix**: Check export filters, ensure posts are PUBLISHED

**Issue**: Parsing errors

- **Cause**: Invalid YAML frontmatter
- **Fix**: Check `content-export.ts` YAML generation

### Comment Test Fails

**Issue**: Auto-approval not working

- **Cause**: User has no approved comments in history
- **Fix**: Ensure first comment is manually approved before second comment

**Issue**: Threading broken

- **Cause**: parentId not set correctly
- **Fix**: Check comment creation code sets parentId

### Sitemap Test Fails

**Issue**: Coverage < 95%

- **Cause**: Posts missing from sitemap
- **Fix**: Check `sitemap-en.xml` and `sitemap-zh.xml` route handlers

**Issue**: Invalid URLs

- **Cause**: Incorrect baseUrl or slug format
- **Fix**: Set `NEXT_PUBLIC_SITE_URL` env variable

### SEO Test Fails

**Issue**: Missing schema fields

- **Cause**: Post missing required metadata
- **Fix**: Ensure all posts have title, excerpt, publishedAt

**Issue**: Wrong inLanguage

- **Cause**: Locale not correctly mapped
- **Fix**: Check `generateBlogPostingSchema()` locale mapping

---

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx prisma generate
      - run: npx tsx scripts/test-export-import.ts
      - run: npx tsx scripts/test-comments.ts
      - run: npx tsx scripts/test-sitemap.ts
      - run: npx tsx scripts/test-seo-metadata.ts
```

---

## Manual Testing Checklist

In addition to automated tests, manually verify:

### Admin UI

- [ ] Can access `/admin` (requires login)
- [ ] Dashboard shows correct statistics
- [ ] Comment moderation page loads
- [ ] Export tool downloads ZIP file
- [ ] Import tool shows dry-run preview
- [ ] Import apply creates/updates posts

### Frontend

- [ ] Language switcher works on post pages
- [ ] Like button increments count
- [ ] Comment form requires login
- [ ] Comments display with threading
- [ ] Pending comments show "awaiting moderation"

### SEO

- [ ] View page source shows JSON-LD script
- [ ] Hreflang links in `<head>`
- [ ] Open Graph tags present
- [ ] Sitemap accessible and valid XML

### i18n

- [ ] English posts at `/posts/[slug]`
- [ ] Chinese posts at `/zh/posts/[slug]`
- [ ] Old Chinese slugs redirect with 301
- [ ] Language detection works in backfill

---

## Test Data Setup

For comprehensive testing, ensure you have:

1. **At least 2 posts**: 1 EN, 1 ZH
2. **Translation pair**: 2 posts with same `groupId` but different `locale`
3. **Test user**: For comment testing
4. **Published status**: Posts should be PUBLISHED, not DRAFT

Create test data:

```bash
npx tsx scripts/backfill-i18n.ts
```

---

## Reporting Issues

If tests fail, report with:

- Test script name
- Full error output
- Database state (post count, comment count)
- Environment (local/staging/production)
