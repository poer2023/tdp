# Content Format Specification

## Markdown Export/Import Format

This document defines the frontmatter and file structure for exporting and importing blog posts as Markdown files.

## Directory Structure

```
content/
├── en/
│   ├── my-first-post.md
│   ├── getting-started.md
│   └── ...
├── zh/
│   ├── wo-de-di-yi-pian-wenzhang.md
│   ├── ru-men-zhi-nan.md
│   └── ...
└── uploads/
    ├── cover-image-1.jpg
    ├── screenshot-2.png
    └── ...
```

## Frontmatter Specification

### Required Fields

```yaml
---
title: "Post Title"
date: "2025-01-15T10:30:00.000Z"
slug: "post-slug"
locale: "EN" # or "ZH"
groupId: "clx8a7b2c0000abcd1234efgh"
tags: ["nextjs", "typescript", "web"]
status: "PUBLISHED" # or "DRAFT"
---
```

### Optional Fields

```yaml
---
# ... required fields ...
excerpt: "A short description of the post"
cover: "../uploads/cover-image.jpg"
author: "user-id-string"
publishedAt: "2025-01-15T10:30:00.000Z"
---
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Post title |
| `date` | ISO8601 | Yes | Creation date (used as publishedAt if status is PUBLISHED) |
| `slug` | string | Yes | URL-safe slug (auto-generated from title if missing for ZH posts) |
| `locale` | enum | Yes | `"EN"` or `"ZH"` |
| `groupId` | string | Yes | UUID linking translations together |
| `tags` | array | Yes | Array of tag strings (can be empty `[]`) |
| `status` | enum | Yes | `"PUBLISHED"` or `"DRAFT"` |
| `excerpt` | string | No | Short description for metadata |
| `cover` | string | No | Relative path to cover image (from content/ root) |
| `author` | string | No | User ID (defaults to system/admin if missing) |
| `publishedAt` | ISO8601 | No | Explicit publish date (defaults to `date` if status is PUBLISHED) |

## Content Body

The content body follows standard Markdown with GFM (GitHub Flavored Markdown) support:

- Headers (`#`, `##`, etc.)
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Tables
- Links and images
- Blockquotes
- Horizontal rules

### Image References

Images should use relative paths from the `content/` directory:

```markdown
![Alt text](../uploads/image-name.jpg)
```

During import:
- Images are copied to the upload storage
- Paths are updated to absolute URLs
- Missing images are logged as warnings

## Example Post

```markdown
---
title: "Getting Started with Next.js 15"
date: "2025-01-15T08:00:00.000Z"
slug: "getting-started-nextjs-15"
locale: "EN"
groupId: "clx8a7b2c0000abcd1234efgh"
tags: ["nextjs", "react", "tutorial"]
status: "PUBLISHED"
excerpt: "Learn how to build modern web applications with Next.js 15"
cover: "../uploads/nextjs-cover.jpg"
---

# Getting Started with Next.js 15

Next.js 15 introduces several new features...

![Next.js Architecture](../uploads/nextjs-architecture.png)

## Installation

\`\`\`bash
npx create-next-app@latest
\`\`\`

## Configuration

...
```

## Import Behavior

### Matching Rules

Posts are matched for updates using the following logic:

1. **If `groupId` is present**: Match by `(groupId, locale)` compound key
2. **Otherwise**: Match by `(locale, slug)` compound key
3. **On conflict**: Suffix slug with `-2`, `-3`, etc.

### Slug Generation

- **English posts**: Slug is required in frontmatter
- **Chinese posts**: Slug auto-generated from title using pinyin if missing
- **Duplicates**: Numbered suffix added (`-2`, `-3`, etc.)

### Asset Handling

- Assets in `content/uploads/` are uploaded to storage
- Image paths in Markdown are rewritten to absolute URLs
- Missing assets generate warnings but don't block import

### Author Assignment

- If `author` field present: Link to existing user by ID
- If `author` missing: Assign to system admin user
- Invalid author IDs: Log warning and use system admin

### PostAlias Creation

- If slug changes during import: Create `PostAlias` entry for 301 redirect
- Old slug → new slug mapping preserved
- Locale-specific aliases maintained

## Export Behavior

### Filters

Export API supports filtering by:
- **Date range**: `from` and `to` ISO8601 dates
- **Status**: `PUBLISHED`, `DRAFT`, or both
- **Locale**: `en`, `zh`, or both

### Output Format

- Zip file containing `content/` directory structure
- `manifest.json` with export metadata:
  - Export date and time
  - Filter parameters used
  - Post count per locale
  - Asset count
  - Export version

### Asset Bundling

- Referenced images copied to `content/uploads/`
- Paths rewritten to relative format
- Unreferenced assets excluded

## Validation Rules

### Dry-Run Validation

Before applying import, the system validates:

1. **Directory structure**: Must match `content/{en,zh}/*.md` pattern
2. **Frontmatter**: All required fields present and valid
3. **Slug conflicts**: Detect existing posts with same slug
4. **Asset references**: Check for missing image files
5. **Date formats**: Valid ISO8601 timestamps
6. **Enum values**: Valid locale and status values

### Error Handling

- **Critical errors**: Block import (invalid frontmatter, duplicate groupId+locale)
- **Warnings**: Allow import with logging (missing assets, invalid author)
- **Report**: Return detailed list of created/updated/skipped/errored posts

## Round-Trip Guarantee

Export → Import should be lossless:
- All frontmatter fields preserved
- Content body unchanged
- Asset links maintained
- Metadata consistency verified

This enables:
- Version control for content
- Backup and restore workflows
- Content migration between environments
- Bulk editing with external tools
