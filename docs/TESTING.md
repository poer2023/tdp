# Testing Documentation

This document covers automated and manual tests for core features (i18n, content operations, SEO, likes). All scripts live in `/scripts` and run with `npx tsx`.

## Test Scripts

### 1. Export/Import Round‑Trip Test

File: `scripts/test-export-import.ts`

Run:

```bash
npx tsx scripts/test-export-import.ts
```

### 2. Sitemap Validation Test

File: `scripts/test-sitemap.ts`

Run:

```bash
npx tsx scripts/test-sitemap.ts
```

### 3. SEO Metadata Validation Test

File: `scripts/test-seo-metadata.ts`

Run:

```bash
npx tsx scripts/test-seo-metadata.ts
```

## Running All Tests

```bash
npx tsx scripts/test-export-import.ts && \
npx tsx scripts/test-sitemap.ts && \
npx tsx scripts/test-seo-metadata.ts
```

## Continuous Integration

Example CI steps:

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
      - run: npx tsx scripts/test-sitemap.ts
      - run: npx tsx scripts/test-seo-metadata.ts
```

## Manual Testing Checklist

- [ ] `/admin` 可访问（需登录）
- [ ] 导出 ZIP 可下载
- [ ] 导入预览与应用流程可用
- [ ] 文章页语言切换正常
- [ ] 点赞按钮计数递增
- [ ] 页面含 JSON‑LD、hreflang、OG 元标签；sitemap 可访问

## Test Data Setup

准备：

1. 至少 2 篇文章：1 EN、1 ZH
2. 一组翻译配对：相同 `groupId`，不同 `locale`
3. 文章状态为 PUBLISHED

```bash
npx tsx scripts/backfill-i18n.ts
```

## Reporting Issues

请包含：脚本名、完整错误输出、数据库状态（post count）、运行环境（local/staging/prod）
