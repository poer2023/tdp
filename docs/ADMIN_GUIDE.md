# Admin Guide

Complete guide for administrators managing the blog content and operations.

## Table of Contents

- [Content Management](#content-management)
- [Export Operations](#export-operations)
- [Import Operations](#import-operations)
- [Best Practices](#best-practices)

---

## Content Management

### Accessing the Admin Dashboard

1. Navigate to `/admin` (requires admin authentication)
2. The dashboard displays:
   - Total posts (EN/ZH breakdown)
   - Published vs draft counts
   - Quick action links

### Post Management

#### Creating Posts

Posts are typically created through your content management workflow. For bulk operations, use the Import tool (see [Import Operations](#import-operations)).

#### Post Locales

- **English (EN)**: Default locale, URLs at `/posts/{slug}`
- **Chinese (ZH)**: Secondary locale, URLs at `/zh/posts/{slug}`
- Posts with the same `groupId` are considered translations of each other

#### Post Status

- **PUBLISHED**: Visible to all users, included in sitemaps
- **DRAFT**: Only visible to admins, not indexed

---

<!-- Comment moderation feature has been removed. -->

---

## Export Operations

### Accessing Export Tool

Navigate to `/admin/export`.

### Export Filters

#### Date Range

```
From: 2024-01-01  To: 2024-12-31
```

- Exports posts created within the specified date range
- Leave blank to export all posts regardless of date

#### Status Filter

```
☑ Published
☐ Draft
```

- Select which post statuses to include
- Multiple selections allowed
- Uncheck all to include all statuses

#### Locale Filter

```
☑ English (EN)
☐ Chinese (ZH)
```

- Select which locales to include
- Multiple selections allowed
- Uncheck all to include all locales

### Running an Export

1. Configure your filters (or leave default for all posts)
2. Click **"Export Content"** button
3. Wait for generation (typically 1-5 seconds for <100 posts)
4. Download automatically starts: `content-export-YYYY-MM-DD.zip`

### Export File Structure

```
content-export-2024-12-31.zip
├── manifest.json
├── content/
│   ├── en/
│   │   ├── post-slug-1.md
│   │   └── post-slug-2.md
│   └── zh/
│       ├── chinese-post-1.md
│       └── chinese-post-2.md
└── uploads/ (if assets referenced)
    └── images/
        └── cover.jpg
```

### Manifest File

`manifest.json` contains export metadata:

```json
{
  "exportDate": "2024-12-31T10:00:00.000Z",
  "exportVersion": "1.0",
  "filters": {
    "from": "2024-01-01T00:00:00.000Z",
    "to": "2024-12-31T23:59:59.999Z",
    "statuses": ["PUBLISHED"],
    "locales": ["EN"]
  },
  "stats": {
    "totalPosts": 42,
    "postsByLocale": {
      "EN": 30,
      "ZH": 12
    },
    "totalAssets": 15
  }
}
```

### Markdown File Format

Each `.md` file contains YAML frontmatter + content:

```markdown
---
title: "Post Title"
date: "2024-01-15T10:00:00.000Z"
slug: "post-slug"
locale: "EN"
groupId: "abc123"
tags:
  - "technology"
  - "tutorial"
status: "PUBLISHED"
excerpt: "A brief summary"
cover: "/uploads/cover.jpg"
author: "admin@example.com"
publishedAt: "2024-01-15T12:00:00.000Z"
---

## Post Content

This is the Markdown content of your post...
```

See [docs/CONTENT_FORMAT.md](./CONTENT_FORMAT.md) for complete specification.

---

## Import Operations

### Accessing Import Tool

Navigate to `/admin/import`.

### Two-Stage Import Process

Import uses a **preview → apply** workflow to prevent accidental data loss.

#### Stage 1: Preview (Dry-Run)

1. Click **"Choose File"** or drag-and-drop a `.zip` file
2. Upload must contain:
   - `content/en/` and/or `content/zh/` directories
   - Valid `.md` files with frontmatter
   - Optional: `manifest.json` (for metadata)
3. Click **"Preview Import"**
4. System validates all files and shows preview table

**Preview Table Columns:**

- **File**: Filename from the ZIP
- **Action**: What will happen (Create, Update, or Error)
- **Title**: Post title from frontmatter
- **Locale**: EN or ZH
- **Status**: PUBLISHED or DRAFT

**Summary Stats:**

- Created: N posts will be created
- Updated: N posts will be updated
- Skipped: N files skipped (e.g., duplicates)
- Errors: N files with validation errors

#### Stage 2: Apply

1. Review the preview table carefully
2. Verify the summary stats match your expectations
3. Click **"Apply Import"**
4. Confirm the action (irreversible)
5. Wait for completion (1-30 seconds depending on volume)
6. View final report with actual results

### Import Matching Rules

The system uses these rules to determine Create vs Update:

#### Rule 1: Match by groupId + locale

```
If (groupId exists in frontmatter AND post with same groupId+locale exists):
  → UPDATE existing post
```

**Example:**

```yaml
groupId: "abc123"
locale: "EN"
```

→ Updates the EN post in group "abc123"

#### Rule 2: Match by locale + slug

```
If (no groupId OR no match found by groupId):
  → Try matching by (locale, slug)
  → If match found: UPDATE
  → If no match: CREATE
```

**Example:**

```yaml
slug: "my-post"
locale: "EN"
```

→ Updates post with slug "my-post" in EN locale

#### Rule 3: Slug conflict resolution

```
If (creating new post AND slug already exists):
  → Append suffix: -2, -3, -4, etc.
```

**Example:**

- Existing: `my-post`
- Conflict: `my-post-2`
- Second conflict: `my-post-3`

### Chinese Slug Handling

If a Chinese post lacks a slug or has Chinese characters in slug:

```
Title: "你好世界"
Slug: (empty or Chinese)
→ Auto-generate: "ni-hao-shi-jie"
```

Uses pinyin conversion with tone removal.

### Validation Rules

All imports must pass these validations:

**Required Fields:**

- title (non-empty string)
- slug (ASCII-only, no spaces)
- locale (EN or ZH)
- groupId (non-empty string)
- status (PUBLISHED or DRAFT)
- tags (array of strings)
- date (valid ISO 8601 timestamp)

**Optional Fields:**

- excerpt
- cover
- author (email format)
- publishedAt

**Errors Prevent Import:**

- Missing required fields
- Invalid date formats
- Invalid locale values
- Invalid status values
- Malformed YAML

### Import Best Practices

1. **Always preview first**: Never skip the dry-run stage
2. **Review errors carefully**: Fix validation errors before applying
3. **Backup before import**: Export all content before large imports
4. **Test with small batches**: Import 5-10 posts first, verify, then import the rest
5. **Verify groupId consistency**: Ensure translation pairs share the same groupId
6. **Check slug uniqueness**: Avoid creating unintended duplicates

### Common Import Scenarios

#### Scenario 1: Adding New Content

```
Action: Create new .md files in content/en/ or content/zh/
Expected Result: All new posts created
Verification: Check post count increases by N
```

#### Scenario 2: Updating Existing Content

```
Action: Modify existing .md files, keep groupId+locale unchanged
Expected Result: Existing posts updated with new content
Verification: Check post updatedAt timestamp changes
```

#### Scenario 3: Adding Translations

```
Action: Create ZH version with same groupId as existing EN post
Expected Result: New ZH post created, linked to EN post via groupId
Verification: Language switcher appears on both EN and ZH posts
```

#### Scenario 4: Migrating from External Source

```
1. Convert external format to .md with frontmatter
2. Assign unique groupId to each post
3. Set appropriate locale (EN or ZH)
4. Preview to check for validation errors
5. Fix errors, preview again
6. Apply import
7. Verify all posts appear in /admin/posts
```

---

## Best Practices

### Content Organization

1. **Use groupId consistently**: All translations of a post share the same groupId
2. **Descriptive slugs**: Use clear, SEO-friendly slugs (e.g., `getting-started-guide`)
3. **Tag strategically**: 3-5 tags per post, consistent vocabulary
4. **Excerpt quality**: Write compelling 150-200 character excerpts

### Export/Import Operations

1. **Regular exports**: Create weekly backups via export
2. **Version control**: Store exports in git or cloud storage
3. **Test imports**: Always preview before applying
4. **Document changes**: Keep notes on what was imported and when

### SEO Maintenance

1. **Translation pairs**: Ensure EN/ZH posts with same groupId exist
2. **Canonical URLs**: System handles automatically, no action needed
3. **Sitemap updates**: Regenerates automatically on build
4. **Redirect monitoring**: Check `/admin` logs for PostAlias hits

### Performance

1. **Image optimization**: Compress images before upload
2. **Content length**: Aim for 1000-3000 words per post
3. **Tag cleanup**: Remove unused tags periodically

---

## Troubleshooting

### "Import failed with errors"

**Cause**: Validation errors in frontmatter
**Solution**: Review preview table, fix YAML syntax, try again

### "Cannot find alternate language version"

**Cause**: Translation missing or wrong groupId
**Solution**: Create translation with matching groupId

### "Slug already exists"

**Cause**: Duplicate slug in same locale
**Solution**: System auto-resolves with -2 suffix, or manually edit slug

### "Export contains no files"

**Cause**: Filters exclude all posts
**Solution**: Adjust date range or status/locale filters

---

## Support

For additional help:

- Technical issues: Check [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Content format: See [docs/CONTENT_FORMAT.md](./CONTENT_FORMAT.md)
- Testing procedures: See [docs/TESTING.md](./TESTING.md)
- Deployment: See [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
