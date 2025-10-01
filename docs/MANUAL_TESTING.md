# Manual Testing Guide

Comprehensive manual testing procedures for features that require human verification.

## Table of Contents

- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Accessibility Testing](#accessibility-testing)
- [Cross-Browser Testing](#cross-browser-testing)
- [Mobile Testing](#mobile-testing)
- [SEO Testing](#seo-testing)

---

## Performance Testing

### Objective

Verify the blog meets performance targets:

- **LCP** (Largest Contentful Paint): <2.5s at p75
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1

### Tools

- [Google Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)

### Test Procedure

#### Test 1: Homepage Performance (EN)

1. Open Chrome DevTools
2. Navigate to **Lighthouse** tab
3. Configure:
   - Mode: Navigation
   - Device: Desktop
   - Categories: Performance, Accessibility, Best Practices, SEO
4. Click **Analyze page load**
5. Wait for results

**Expected Results**:

```
Performance:    ≥90
Accessibility:  ≥95
Best Practices: ≥90
SEO:            ≥95
```

**Core Web Vitals**:

```
LCP: <2.5s  (green)
FID: <100ms (green)
CLS: <0.1   (green)
```

**If fails**:

- Review **Opportunities** section
- Prioritize:
  - Image optimization
  - Eliminate render-blocking resources
  - Minify JavaScript/CSS

#### Test 2: Homepage Performance (ZH)

Repeat Test 1 for `/zh` URL.

**Expected**: Same scores as EN homepage.

#### Test 3: Post Page Performance

1. Navigate to a representative post (e.g., `/posts/example-post`)
2. Run Lighthouse analysis
3. Check Core Web Vitals

**Expected**:

- LCP <2.5s (should be the post title or featured image)
- No layout shift from like button or comments loading

**If fails**:

- Check for lazy-loaded images causing reflow
- Verify proper image dimensions set

#### Test 4: Cold vs Warm Load

**Cold load** (first visit):

1. Open Incognito window
2. Navigate to homepage
3. Measure with Lighthouse

**Warm load** (repeat visit):

1. Reload the same page
2. Measure with Lighthouse

**Expected**:

- Cold load: Performance ≥85
- Warm load: Performance ≥95 (cache benefits)

#### Test 5: Throttled Network (3G)

1. Open Chrome DevTools
2. Navigate to **Network** tab
3. Set throttling: **Slow 3G**
4. Navigate to homepage
5. Run Lighthouse analysis

**Expected**:

- LCP <4.0s (relaxed target for 3G)
- Page still usable, no critical blocking

#### Test 6: Heavy Content Page

Find a post with:

- Long content (>3000 words)
- Multiple images (>10)
- Many comments (>20)

Run Lighthouse analysis.

**Expected**:

- Performance ≥80 (heavier content acceptable)
- No layout shift from comment loading
- Images lazy-loaded properly

**If fails**:

- Implement pagination for comments
- Optimize image loading strategy

---

## Security Testing

### Objective

Verify security measures:

- XSS protection in comments
- CSRF protection on forms
- Rate limiting enforcement
- Secure authentication flow

### Test Procedure

#### Test 1: XSS Protection in Comments

1. Sign in with Google
2. Navigate to a post
3. Post a comment with XSS payload:
   ```html
   <script>alert('XSS')</script>
   <img src=x onerror=alert('XSS')>
   <iframe src="javascript:alert('XSS')"></iframe>
   ```
4. Wait for moderation approval (or auto-approval)
5. View the comment on the page

**Expected**:

- No JavaScript alert appears
- Tags are stripped or escaped
- Comment displays as plain text

**If fails**:

- Review comment sanitization logic
- Ensure using DOMPurify or similar

#### Test 2: CSRF Protection

**Test 2a: Comment Form**

1. Sign in
2. Open browser console
3. Attempt to submit comment via fetch without CSRF token:
   ```javascript
   fetch("/api/posts/test-slug/comments", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ content: "Test comment" }),
   });
   ```

**Expected**: 403 Forbidden or 401 Unauthorized

**Test 2b: Like Button**

1. Sign out
2. Attempt to like a post via fetch:
   ```javascript
   fetch("/api/posts/test-slug/like", {
     method: "POST",
   });
   ```

**Expected**: 429 Too Many Requests or validation error

#### Test 3: Rate Limiting - Likes

1. Open a post page
2. Open browser console
3. Rapidly send 15 like requests:
   ```javascript
   for (let i = 0; i < 15; i++) {
     fetch("/api/posts/test-slug/like", { method: "POST" });
   }
   ```

**Expected**:

- First 10 requests may succeed (10 per minute limit)
- Subsequent requests return 429 Too Many Requests
- Error message: "Rate limit exceeded"

#### Test 4: Rate Limiting - Comments

1. Sign in
2. Rapidly post 5 comments in 1 minute
3. Attempt a 6th comment

**Expected**:

- First 3 comments succeed (3 per 5 minutes limit)
- 4th-6th attempts return 429 Too Many Requests
- Error message displays in UI

#### Test 5: Authentication Flow Security

**Test 5a: OAuth Callback**

1. Sign out
2. Manually navigate to:
   ```
   /api/auth/callback/google?code=invalid&state=tampered
   ```

**Expected**: Error page, no authentication granted

**Test 5b: Session Fixation**

1. Sign out
2. Copy session cookie value
3. Sign in
4. Replace new session cookie with old one
5. Refresh page

**Expected**: Signed out, session invalid

#### Test 6: SQL Injection

1. Navigate to a post with user input in URL:
   ```
   /posts/test' OR '1'='1
   ```

**Expected**:

- 404 Not Found (slug doesn't exist)
- No database error exposed
- No unexpected behavior

#### Test 7: Content Security Policy

1. Open a post page
2. Open browser console
3. Check for CSP header:
   ```javascript
   console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
   ```

**Expected**:

- CSP header present (if implemented)
- Inline scripts blocked by default
- Only allowed sources can load resources

---

## Accessibility Testing

### Objective

Verify WCAG 2.1 Level AA compliance:

- Keyboard navigation
- Screen reader compatibility
- Color contrast
- ARIA attributes

### Tools

- [WAVE](https://wave.webaim.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA](https://www.nvaccess.org/) or [JAWS](https://www.freedomscientific.com/products/software/jaws/) (screen readers)

### Test Procedure

#### Test 1: Keyboard Navigation

**Test 1a: Header Auth Menu**

1. Navigate to homepage
2. Press **Tab** repeatedly
3. Verify tab order:
   - Logo/Home link
   - Navigation links
   - Sign in button (or avatar if signed in)
   - (If signed in) Press **Enter** on avatar
   - (If signed in) Press **Arrow Down** to navigate menu
   - (If signed in) Press **Enter** to select menu item

**Expected**:

- Tab order logical and sequential
- Focus visible on all interactive elements
- Menu opens with Enter/Space
- Menu navigable with Arrow keys
- Esc closes menu

**Test 1b: Comment Form**

1. Navigate to a post (signed in)
2. Tab to comment form
3. Press **Enter** to focus textarea
4. Type a comment
5. Tab to Submit button
6. Press **Enter** to submit

**Expected**:

- Form accessible without mouse
- Submit button has focus indicator
- Enter submits form (if not in textarea)

**Test 1c: Like Button**

1. Navigate to a post
2. Tab to like button
3. Press **Enter** or **Space** to like

**Expected**:

- Button has focus indicator
- Both Enter and Space activate button
- Button disabled state prevents re-activation

#### Test 2: Screen Reader Testing (NVDA)

**Setup**:

1. Install NVDA (Windows) or VoiceOver (Mac)
2. Start screen reader
3. Navigate to homepage

**Test 2a: Post List**

1. Navigate through posts with arrow keys
2. Listen to announcements

**Expected announcements**:

- "Article: [Post Title]"
- "Link: [Post Title]"
- "Published [Date]"
- "Tags: [tag1], [tag2], ..."

**Test 2b: Header Auth**

1. Navigate to Sign in button
2. Listen to announcement

**Expected**:

- "Button: Sign in with Google"
- Clear indication it's a button
- Purpose is clear

**Test 2c: Comment Section**

1. Navigate to comment section
2. Listen to announcements

**Expected**:

- "Region: Comments" or "Heading: Comments"
- Each comment announced as article or list item
- "Button: Reply" for each comment
- Form labeled: "Text area: Add your comment"

#### Test 3: Color Contrast

**Using WAVE or axe DevTools**:

1. Navigate to homepage
2. Run WAVE analysis
3. Check for contrast errors

**Expected**:

- No contrast errors
- Text on background meets 4.5:1 ratio (normal text)
- Text on background meets 3:1 ratio (large text ≥18pt)

**Manual check**:

- Primary text on white: black (#000000) ✓
- Links on white: sufficient contrast ✓
- Button text on dark background: white (#FFFFFF) ✓

#### Test 4: ARIA Attributes

**Test 4a: Header Dropdown Menu**

View page source, find avatar button:

```html
<button aria-haspopup="menu" aria-expanded="false" aria-controls="user-menu">[Avatar]</button>

<div id="user-menu" role="menu" aria-labelledby="avatar-button">
  <a role="menuitem">Dashboard</a>
  <a role="menuitem">Sign out</a>
</div>
```

**Expected**:

- `aria-haspopup="menu"` present
- `aria-expanded` toggles true/false
- Menu has `role="menu"`
- Menu items have `role="menuitem"`

**Test 4b: Like Button**

```html
<button aria-label="Like this post" aria-pressed="false">❤️ 42 likes</button>
```

**Expected**:

- `aria-label` describes action
- `aria-pressed` toggles after click
- Screen reader announces state change

#### Test 5: Focus Indicators

1. Navigate site with keyboard
2. Verify focus indicators visible on:
   - Links
   - Buttons
   - Form inputs
   - Dropdown menu items

**Expected**:

- Clear visual indication (outline or background change)
- Minimum 2px outline
- Sufficient contrast (3:1 ratio)

#### Test 6: Images and Alt Text

1. Navigate to posts with images
2. Check alt text:
   ```html
   <img src="..." alt="Descriptive text here" />
   ```

**Expected**:

- All images have alt attribute
- Decorative images: `alt=""`
- Content images: descriptive alt text

---

## Cross-Browser Testing

### Objective

Verify compatibility across major browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Test Procedure

#### Test Matrix

For each browser, test the following:

| Feature            | Chrome | Firefox | Safari | Edge |
| ------------------ | ------ | ------- | ------ | ---- |
| Homepage loads     | ✓      | ✓       | ✓      | ✓    |
| Post page loads    | ✓      | ✓       | ✓      | ✓    |
| Google sign-in     | ✓      | ✓       | ✓      | ✓    |
| Like button        | ✓      | ✓       | ✓      | ✓    |
| Post comment       | ✓      | ✓       | ✓      | ✓    |
| Reply to comment   | ✓      | ✓       | ✓      | ✓    |
| Language switcher  | ✓      | ✓       | ✓      | ✓    |
| Admin dashboard    | ✓      | ✓       | ✓      | ✓    |
| Export content     | ✓      | ✓       | ✓      | ✓    |
| Import content     | ✓      | ✓       | ✓      | ✓    |
| Comment moderation | ✓      | ✓       | ✓      | ✓    |

#### Browser-Specific Checks

**Safari-specific**:

- [ ] Date picker displays correctly
- [ ] OAuth popup doesn't get blocked
- [ ] Session cookies persist across tabs
- [ ] No console errors related to webkit

**Firefox-specific**:

- [ ] Flexbox layouts render correctly
- [ ] File upload (import) works
- [ ] No mixed content warnings

**Edge-specific**:

- [ ] All Chromium features work (similar to Chrome)
- [ ] No IE11 compatibility warnings (not supported)

#### Test Procedure per Browser

1. **Fresh install** (or clear cache)
2. Navigate to homepage
3. Test critical user flows:
   - Sign in → Comment → Sign out
   - Like post → Reload → Verify disabled
   - Switch language → Verify correct content
4. Open DevTools Console
5. Check for:
   - No red errors
   - No CORS issues
   - No 404s for resources

**Expected**: Zero errors across all browsers

---

## Mobile Testing

### Objective

Verify mobile experience on:

- iOS Safari
- Android Chrome
- Various screen sizes (320px - 768px)

### Test Procedure

#### Test 1: Responsive Design

**Using Chrome DevTools Device Mode**:

1. Open DevTools
2. Click **Toggle device toolbar** (Ctrl+Shift+M)
3. Test these viewport sizes:
   - 320px (iPhone SE)
   - 375px (iPhone 12/13)
   - 414px (iPhone 12 Pro Max)
   - 768px (iPad)

**Check for**:

- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Buttons large enough to tap (minimum 44x44px)
- [ ] No content overlap
- [ ] Images scale properly

#### Test 2: Touch Interactions

**On actual mobile device**:

1. Navigate to homepage
2. Tap navigation links
3. Tap post title to open
4. Tap like button
5. Tap to open comment form
6. Tap to submit comment

**Expected**:

- All taps register reliably
- No double-tap needed
- No accidental clicks on nearby elements
- Feedback on tap (color change, etc.)

#### Test 3: Mobile Sign-In

1. Tap "Sign in"
2. Tap "Sign in with Google"
3. Complete OAuth in popup/redirect
4. Verify redirect back to original page
5. Tap avatar
6. Verify dropdown menu opens
7. Tap "Sign out"

**Expected**:

- OAuth flow works smoothly
- Popups not blocked
- Menu usable with finger (not too small)

#### Test 4: Mobile Comment Form

1. Sign in
2. Navigate to a post
3. Scroll to comments
4. Tap comment form
5. Verify keyboard appears
6. Type comment
7. Tap Submit

**Expected**:

- Form doesn't cause viewport zoom
- Keyboard doesn't cover Submit button
- Can dismiss keyboard to see full form

#### Test 5: Landscape Orientation

1. Rotate device to landscape
2. Navigate through homepage and post
3. Check layout doesn't break

**Expected**:

- Content still readable
- No overflow issues
- Navigation accessible

#### Test 6: iOS Safari Specific

1. Open in iOS Safari (not Chrome)
2. Test add to Home Screen:
   - Tap Share icon
   - Tap "Add to Home Screen"
   - Open from home screen
3. Verify PWA features (if implemented)

**Expected**:

- App icon displays correctly
- Splash screen shows (if configured)
- Navigation bar correct color

---

## SEO Testing

### Objective

Verify SEO metadata and schema markup:

- Proper hreflang tags
- JSON-LD structured data
- Sitemap validity
- Robots.txt configuration

### Test Procedure

#### Test 1: Google Rich Results Test

1. Navigate to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter a post URL (e.g., `https://yourdomain.com/posts/test-post`)
3. Click **Test URL**
4. Wait for results

**Expected**:

- ✅ "Page is eligible for rich results"
- ✅ BlogPosting schema detected
- No errors or warnings

**Check for**:

- headline
- datePublished
- dateModified
- author (Person type)
- inLanguage

#### Test 2: Hreflang Validation

1. Navigate to a post with translation
2. View page source (Ctrl+U)
3. Search for `hreflang`

**Expected tags**:

```html
<link rel="alternate" hreflang="en" href="https://yourdomain.com/posts/test-post" />
<link rel="alternate" hreflang="zh" href="https://yourdomain.com/zh/posts/test-post-zh" />
<link rel="alternate" hreflang="x-default" href="https://yourdomain.com/posts/test-post" />
```

**Verify**:

- [ ] All three tags present
- [ ] URLs are absolute (not relative)
- [ ] x-default points to EN version

#### Test 3: Sitemap Validation

1. Navigate to `https://yourdomain.com/sitemap.xml`
2. Verify XML format is valid
3. Check links to:
   - `/sitemap-en.xml`
   - `/sitemap-zh.xml`

**Expected**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://yourdomain.com/sitemap-en.xml</loc>
    <lastmod>2024-12-31T00:00:00.000Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://yourdomain.com/sitemap-zh.xml</loc>
    <lastmod>2024-12-31T00:00:00.000Z</lastmod>
  </sitemap>
</sitemapindex>
```

4. Navigate to `/sitemap-en.xml`
5. Count `<url>` entries
6. Compare with published EN post count

**Expected**: Count matches or exceeds published post count

#### Test 4: Robots.txt

1. Navigate to `https://yourdomain.com/robots.txt`

**Expected content**:

```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

**Verify**:

- [ ] Allows all crawlers
- [ ] Sitemap URL present and correct

#### Test 5: Meta Tags

**For each page type (homepage, post), check**:

1. View page source
2. Verify meta tags present:

```html
<!-- Title -->
<title>Post Title | Blog Name</title>

<!-- Description -->
<meta name="description" content="Post excerpt here..." />

<!-- Open Graph -->
<meta property="og:title" content="Post Title" />
<meta property="og:description" content="Post excerpt..." />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://yourdomain.com/posts/test-post" />
<meta property="og:image" content="https://yourdomain.com/uploads/cover.jpg" />
<meta property="og:locale" content="en_US" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Post Title" />
<meta name="twitter:description" content="Post excerpt..." />

<!-- Canonical -->
<link rel="canonical" href="https://yourdomain.com/posts/test-post" />
```

**Verify**:

- [ ] All tags present
- [ ] Content matches post data
- [ ] URLs are absolute
- [ ] Image URLs valid (if cover present)

#### Test 6: Search Console Submission

1. Sign in to [Google Search Console](https://search.google.com/search-console)
2. Add property (if not already added)
3. Submit sitemap:
   - Go to **Sitemaps**
   - Enter `sitemap.xml`
   - Click **Submit**
4. Wait 24-48 hours for indexing
5. Check **Coverage** report

**Expected**:

- ✅ Sitemap processed successfully
- ✅ Pages indexed (95%+ after 1 week)
- No errors or warnings

---

## Testing Checklist

Print and use during manual testing sessions:

```
Performance:
□ Homepage LCP <2.5s (EN)
□ Homepage LCP <2.5s (ZH)
□ Post page LCP <2.5s
□ No CLS (layout shift)
□ Lighthouse Performance ≥90

Security:
□ XSS prevented in comments
□ CSRF protection active
□ Rate limiting enforced (likes)
□ Rate limiting enforced (comments)
□ OAuth flow secure

Accessibility:
□ Keyboard navigation works
□ Screen reader compatible
□ Color contrast passes (WCAG AA)
□ ARIA attributes present
□ Focus indicators visible

Cross-Browser:
□ Chrome: All features work
□ Firefox: All features work
□ Safari: All features work
□ Edge: All features work

Mobile:
□ Responsive design (320px-768px)
□ Touch interactions work
□ Sign-in flow works
□ Comment form usable
□ No zoom issues

SEO:
□ Rich Results Test passes
□ Hreflang tags present
□ Sitemap valid and submitted
□ Robots.txt correct
□ Meta tags complete
□ Search Console indexed
```

---

Congratulations on completing manual testing! Document any issues found and create tickets for resolution.
