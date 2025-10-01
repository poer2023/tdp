# Blog i18n Upgrade Roadmap

**Goal**: English-first internationalization with Chinese under `/zh`, SEO optimization, self-hosted engagement features (likes/comments), and standard Markdown content operations.

**Timeline**: 3 weeks

---

## Week 1: Foundation (Database, Migration, Auth)

### 1.1 Database Schema Changes ✅

- [x] Update `prisma/schema.prisma` with new models and fields
  - [x] Add `Post.locale` enum (EN, ZH)
  - [x] Add `Post.groupId` (string, for translation grouping)
  - [x] Add unique constraints: `(locale, slug)`, `(groupId, locale)`
  - [x] Create `PostAlias` model (id, locale, oldSlug, postId, createdAt)
  - [x] Create `ReactionAggregate` model (postId unique, likeCount, updatedAt)
  - [x] Create `Reaction` model (id, postId, sessionKeyHash, createdAt)
  - [x] Create `Comment` model (id, postId, parentId?, authorId, content, status, ipHash?, ua?, locale, createdAt)
  - [ ] Optional: Create `Tag` and `TagTranslation` models for localized tags
- [x] Run `npx prisma migrate dev` and verify schema
- [x] Run `npx prisma generate`

### 1.2 Data Backfill & Migration ✅

- [x] Write backfill script to set existing posts
  - [x] Determine default locale (EN or ZH) based on content language detection or manual review
  - [x] Assign `groupId` to existing posts (generate unique IDs)
  - [x] Update all existing posts with locale and groupId
- [x] Verify backfill results in database

### 1.3 Chinese Slug → Pinyin Migration ✅

- [x] Create migration script for Chinese slugs
  - [x] Identify posts with Chinese characters in slug
  - [x] Generate pinyin slugs (tone-less, ASCII only) using `pinyin-pro`
  - [x] Handle duplicates with `-2`, `-3` suffix
  - [x] Create `PostAlias` entries for old slugs → new slugs
- [x] Test migration script on staging data (no posts needed migration)
- [x] Execute migration on production (no posts needed migration)
- [ ] Verify 301 redirects work for old Chinese slug URLs (will be tested with middleware)

### 1.4 Redirect Middleware for PostAlias ✅

- [x] Create middleware or API route handler
  - [x] Check incoming `/zh/posts/:slug` and `/posts/:slug` against `PostAlias` table
  - [x] Return 301 redirect to new pinyin slug if alias found
  - [x] Log redirect hits for monitoring
- [x] Test redirects with sample old URLs (test alias created, ready for dev server testing)

### 1.5 Top-Right Auth Controls (Google Only) ✅

- [x] Update NextAuth configuration
  - [x] Configure Google OAuth provider only (already configured)
  - [x] Set up proper callback URLs
  - [x] Request minimal scopes (profile, email)
  - [x] Implement CSRF protection (NextAuth default)
- [x] Create header auth component
  - [x] Desktop: "Sign in with Google" button (icon + text)
  - [x] Mobile: "Sign in" short text
  - [x] Logged in state: avatar button with dropdown menu
  - [x] Menu items: "Dashboard", "Sign out"
  - [x] Return to current page after sign in/out
- [x] Implement SSR session loading in header (no flicker)
- [x] Add accessibility features
  - [x] `aria-haspopup="menu"` on avatar button
  - [x] Focus management for dropdown
  - [x] Esc key to close menu
  - [x] Keyboard navigation support (Arrow Up/Down)
- [ ] Test auth flow on desktop and mobile (ready for dev server testing)

---

## Week 2: Features (Likes, Comments, SEO, Routing)

### 2.1 i18n Routing Structure ✅

- [x] Update Next.js routing for i18n
  - [x] English default: `/`, `/posts/[slug]` (existing)
  - [x] Chinese: `/zh`, `/zh/posts`, `/zh/posts/[slug]` (created [locale] route group)
- [x] Middleware for locale detection (already handles /zh routes for PostAlias)
- [x] Update navigation components with locale-aware links (MainNav component)

### 2.2 Language Toggle Component ✅

- [x] Create language switcher component
  - [x] Show toggle when both locales exist for same groupId
  - [x] Hide or show "translation not available" message when missing
  - [x] Link to corresponding locale URL
- [x] Integrate into article page layout (both EN and ZH post pages)
- [x] Test with posts having/missing translations

### 2.3 Likes Feature (No Login Required) ✅

- [x] Create session management for likes
  - [x] Generate `sessionKey` cookie on first interaction
  - [x] Server-side hash storage: `hash(sessionKey)` per postId
  - [x] Implement idempotency (1 like per session per day)
- [x] Create API routes
  - [x] `GET /api/posts/[slug]/reactions` → `{ likeCount: number }`
  - [x] `POST /api/posts/[slug]/like` → `{ ok: true, likeCount }`
  - [x] Return 404 if post not found
  - [x] Return 429 if rate limited
- [x] Implement rate limiting
  - [x] 10 requests/min per IP/UA across all posts
  - [x] Store in-memory or Redis-based rate limit tracking
- [x] Create like button UI component
  - [x] Show current like count
  - [x] Optimistic UI update on click
  - [x] Disable after first like in session
  - [x] Visual feedback (animation, color change)
- [x] Integrate into article page (both EN and ZH post pages)
- [ ] Test like functionality and rate limiting (ready for dev server testing)

### 2.4 Comments Feature (Login Required) ✅

- [x] Create comments API routes
  - [x] `GET /api/posts/[slug]/comments?cursor=&limit=` → paginated list
  - [x] `POST /api/posts/[slug]/comments` → create comment (auth required)
  - [x] Body: `{ content: string, parentId?: string }`
  - [x] Return 201 with comment status (pending/published)
- [x] Implement content sanitization
  - [x] XSS cleaning (Markdown subset or HTML whitelist)
  - [x] Validate content length and format (2000 char limit)
- [x] Implement rate limiting for comments
  - [x] 3 comments per 5 minutes per user
  - [x] 20 comments per day per user
  - [x] Optional: CAPTCHA trigger on limit exceeded
- [x] Create comment UI components
  - [x] Logged out: "Sign in to comment" prompt
  - [x] Logged in: comment form
  - [x] Comment list with pagination ("Load more")
  - [x] Threaded replies (one level deep)
  - [x] Show "awaiting moderation" for pending comments
- [x] Integrate into article page (both EN and ZH post pages)
- [ ] Test comment flow (post, pagination, threading) (ready for dev server testing)

### 2.5 Comment Moderation System ✅

- [x] Create admin moderation API
  - [x] `POST /api/admin/comments/:id/moderate`
  - [x] Actions: approve, hide, delete
  - [x] Auth: admin role only
- [x] Create admin moderation UI (`/admin/comments`)
  - [x] Status-based filtering (Pending/Published/Hidden/All)
  - [x] List comments with full context
  - [x] Approve/hide/delete buttons inline
  - [x] Show comment content, author, post context
  - [x] Display user trust signals (approved comment count)
  - [x] Post link navigation
  - [x] Reply count indicators
- [x] Implement moderation logic
  - [x] Default: require approval for first-time commenters
  - [x] Auto-approve for users with approved history (configurable)
- [ ] Test moderation workflow (ready for testing)

### 2.6 SEO Enhancements ✅

- [x] Implement hreflang and canonical tags
  - [x] Per page: `alternates.languages = { en: url, zh: url }`
  - [x] Include `x-default` → English URL
  - [x] Set `canonical` to current locale URL
- [x] Implement JSON-LD structured data
  - [x] BlogPosting schema
  - [x] Fields: inLanguage, headline, datePublished, image, author
  - [x] Locale-specific schemas for EN and ZH
- [x] Update metadata generation
  - [x] Use locale-specific title/description
  - [x] Include Open Graph tags with locale
- [x] Create SEO helper functions in `src/lib/seo.ts`
- [x] Integrate SEO helpers into both EN and ZH post pages
- [ ] Test metadata in Google Rich Results Test (ready for dev server testing)

---

## Week 3: Content Operations (Import/Export, Sitemaps, QA)

### 3.1 Markdown Export Specification ✅

- [x] Define frontmatter spec (document in README or docs)
  - [x] Required: title, date, slug, locale, groupId, tags, status
  - [x] Optional: cover, excerpt, author, publishedAt
  - [x] Documented in `docs/CONTENT_FORMAT.md`
- [x] Create export directory structure
  - [x] `content/en/<slug>.md`
  - [x] `content/zh/<slug>.md`
  - [x] Assets referenced via relative paths: `![](../uploads/cover.jpg)`

### 3.2 Export Tool Implementation ✅

- [x] Create export API endpoint
  - [x] `GET /api/admin/content/export?from=&to=&statuses=&locales=`
  - [x] Returns zip file of content/ + manifest.json
- [x] Implement export logic in `src/lib/content-export.ts`
  - [x] Query posts by date range, status, locale filters
  - [x] Generate Markdown files with YAML frontmatter
  - [x] Track referenced assets
  - [x] Preserve relative paths for assets
  - [x] Create manifest.json with export metadata
- [x] Create admin export UI (`/admin/export`)
  - [x] Filters: date range, status, locale selection
  - [x] One-click download button with loading state
  - [x] Inline format documentation
  - [x] Error handling and user feedback
- [ ] Test export with various filter combinations (ready for testing)

### 3.3 Import Tool Implementation (Dry-Run) ✅

- [x] Create import API endpoint
  - [x] `POST /api/admin/content/import?dryRun=true|false`
  - [x] Accept FormData zip upload
  - [x] Returns: `{ dryRun, summary: { created, updated, skipped, errors }, details: [] }`
- [x] Implement dry-run validation in `src/lib/content-import.ts`
  - [x] Validate directory structure (content/en/, content/zh/)
  - [x] Check required frontmatter fields
  - [x] Detect slug conflicts
  - [x] Parse YAML frontmatter
  - [x] Generate preview report
- [x] Implement matching rules
  - [x] If `groupId` present: upsert by `(groupId, locale)`
  - [x] Else: upsert by `(locale, slug)`
  - [x] On conflict: suffix `-2`, `-3`, etc.
- [x] Auto-generate pinyin slug for ZH posts without slug
- [x] Create admin import UI (`/admin/import`)
  - [x] File upload with drag-and-drop (styled as button)
  - [x] Two-stage process: Preview → Apply
  - [x] Detailed preview table with action badges
  - [x] Display stats: created/updated/skipped/errors
  - [x] Show per-file errors inline
  - [x] "Apply Import" button with confirmation
  - [x] Inline documentation
- [ ] Test dry-run with sample content (ready for testing)

### 3.4 Import Tool Implementation (Apply) ✅

- [x] Implement actual import logic
  - [x] Create/update posts based on dry-run results
  - [x] Handle both create and update operations
  - [x] Convert relative asset paths to absolute paths
  - [x] Handle groupId assignment for translation groups
- [x] Add safety features
  - [x] Validate all inputs before database operations
  - [x] Skip invalid posts with detailed error messages
  - [x] Preserve existing data on updates
- [x] Generate import report
  - [x] Stats: created, updated, skipped, errors
  - [x] Per-file action details
  - [x] Error details for failed imports
- [x] UI integration for apply workflow
  - [x] Confirmation dialog before applying
  - [x] Success/error reporting
  - [x] Automatic refresh after import
- [ ] Test import apply with various scenarios (ready for testing)
  - [ ] New posts
  - [ ] Updates to existing posts
  - [ ] Slug conflicts
  - [ ] Missing assets

### 3.5 Round-Trip Testing

- [ ] Export all posts
- [ ] Import exported content (dry-run)
- [ ] Verify no diffs in frontmatter
- [ ] Verify asset links intact
- [ ] Test with posts having Chinese titles (pinyin slug generation)

### 3.6 Sitemap Generation ✅

- [x] Create root `sitemap.xml`
  - [x] Index pointing to `sitemap-en.xml` and `sitemap-zh.xml`
  - [x] Implemented in `src/app/sitemap.ts`
- [x] Create `sitemap-en.xml`
  - [x] List English posts and list pages (/, /posts)
  - [x] Include lastmod, changefreq, priority
  - [x] Implemented as route handler
- [x] Create `sitemap-zh.xml`
  - [x] List Chinese posts and list pages (/zh, /zh/posts)
  - [x] Include lastmod, changefreq, priority
  - [x] Implemented as route handler
- [ ] Test sitemap validation (ready for dev server testing)
  - [ ] Google Search Console validation
  - [ ] Coverage > 95% of published content

### 3.7 Quality Assurance

- [ ] Verify all acceptance criteria
  - [ ] English default at `/`, Chinese at `/zh`
  - [ ] Hreflang pairs emitted correctly
  - [ ] Old Chinese slugs 301 redirect to pinyin
  - [ ] Like: first click increments, second doesn't
  - [ ] Comments: login required, moderation works
  - [ ] Import/export round-trip lossless
  - [ ] Header auth: no flicker, SSR session
- [ ] Performance testing
  - [ ] Article LCP < 2.5s p75
  - [ ] No dynamic blockers on SSR/ISR
- [ ] Security testing
  - [ ] XSS protection in comments
  - [ ] CSRF protection on APIs
  - [ ] Rate limiting enforcement
- [ ] Accessibility testing
  - [ ] Keyboard navigation (header menu, comment form)
  - [ ] ARIA attributes present
  - [ ] Screen reader testing
- [ ] Cross-browser testing
  - [ ] Desktop: Chrome, Firefox, Safari
  - [ ] Mobile: iOS Safari, Android Chrome

### 3.8 Documentation

- [ ] Write admin guide
  - [ ] How to export/import content
  - [ ] Markdown frontmatter specification
  - [ ] Comment moderation workflow
- [ ] Write user guide
  - [ ] How to like posts
  - [ ] How to comment (login required)
  - [ ] Language switching
- [ ] Update privacy policy
  - [ ] Document like tracking (hashed sessionKey)
  - [ ] Comment data storage
  - [ ] No plaintext IP storage
- [ ] Update README with new features

### 3.9 Deployment & Monitoring

- [ ] Deploy to production
  - [ ] Run database migrations
  - [ ] Execute backfill script
  - [ ] Execute Chinese slug migration
- [ ] Monitor metrics
  - [ ] SEO: indexed pages, hreflang coverage
  - [ ] Performance: LCP, TTFB
  - [ ] Engagement: like rate, comment rate
  - [ ] Import/export: success rate
- [ ] Set up alerts
  - [ ] 404 spike (broken links)
  - [ ] Rate limit abuse
  - [ ] Comment spam detection

---

## Open Questions to Resolve

- [ ] **Q1**: Who is the default author for imported MD without authorId?
  - Options: System user, require authorId mapping, assign to admin

- [ ] **Q2**: Auto-approve comments from users with prior approved history?
  - Decision: Default off or on? Configurable?

- [ ] **Q3**: Per-locale tag display names now or later?
  - Decision: Implement Tag/TagTranslation models now or defer?

---

## Success Metrics (Track Post-Launch)

- **SEO**:
  - [ ] Indexed English pages in Google Search Console
  - [ ] Hreflang pairs present in all translations
  - [ ] Sitemap coverage > 95%

- **Performance**:
  - [ ] Article LCP < 2.5s p75
  - [ ] No dynamic blockers on article SSR/ISR

- **Engagement**:
  - [ ] ≥10% sessions with at least 1 like
  - [ ] Comment spam rejection rate < 5% after week 2

- **Content Ops**:
  - [ ] Import/export round-trip lossless for 100% frontmatter fields
  - [ ] Asset bundle preservation verified

- **Reliability**:
  - [ ] No broken links after Chinese slug migration
  - [ ] 301 redirects verified in Search Console
  - [ ] Alias hit logs show decreasing old link usage

---

## Risk Mitigation Checklist

- [ ] **Google login availability in CN**: Document limitation, plan email magic link as future option
- [ ] **Spam & abuse**: Rate limits active, moderation queue functional, CAPTCHA ready
- [ ] **SEO regressions**: Alias 301s in place, Search Console monitoring active
- [ ] **Content drift across locales**: GroupId consistency enforced, "missing translations" admin tool ready
