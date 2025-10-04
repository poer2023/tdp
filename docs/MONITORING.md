# Monitoring and Alerting Guide

Post-launch monitoring strategy for the i18n blog.

## Table of Contents

- [Key Metrics](#key-metrics)
- [Monitoring Tools](#monitoring-tools)
- [Alert Configuration](#alert-configuration)
- [Dashboard Setup](#dashboard-setup)
- [Incident Response](#incident-response)

---

## Key Metrics

### 1. SEO Metrics

#### Indexed Pages

**What to measure**:

- Total pages indexed by Google
- EN pages vs ZH pages
- Indexation rate (indexed/total published)

**Target**: 95%+ of published posts indexed within 7 days

**How to track**:

```bash
# Google Search Console
1. Navigate to Coverage report
2. Check "Valid" pages count
3. Compare with total published posts in database

# Query database for comparison
SELECT locale, COUNT(*) FROM "Post" WHERE status = 'PUBLISHED' GROUP BY locale;
```

**Alert if**:

- Indexation rate drops below 90%
- New posts not indexed within 14 days

#### Hreflang Coverage

**What to measure**:

- Posts with translation pairs
- Hreflang tag presence and correctness

**Target**: 100% of translation pairs have hreflang tags

**How to track**:

```bash
# Query posts with translations
SELECT
  "groupId",
  COUNT(*) as translation_count
FROM "Post"
WHERE status = 'PUBLISHED'
GROUP BY "groupId"
HAVING COUNT(*) > 1;

# Manual verification
# 1. Visit post with translation
# 2. View page source
# 3. Check for <link rel="alternate" hreflang="...">
```

**Alert if**:

- Translation pair missing hreflang tags
- Hreflang validation errors in Search Console

#### Sitemap Coverage

**What to measure**:

- Posts in sitemap vs posts in database
- Sitemap submission status in Search Console

**Target**: 100% of published posts in sitemap

**How to track**:

```bash
# Check sitemap
curl https://yourdomain.com/sitemap-en.xml | grep -c "<url>"
curl https://yourdomain.com/sitemap-zh.xml | grep -c "<url>"

# Compare with database
SELECT COUNT(*) FROM "Post" WHERE status = 'PUBLISHED' AND locale = 'EN';
SELECT COUNT(*) FROM "Post" WHERE status = 'PUBLISHED' AND locale = 'ZH';
```

**Alert if**:

- Sitemap count < published post count
- Sitemap not updated in 7+ days

---

### 2. Performance Metrics

#### Largest Contentful Paint (LCP)

**What to measure**: Time until largest content element is rendered

**Target**: <2.5s for 75th percentile (p75)

**How to track**:

```bash
# Lighthouse CI
npx lighthouse https://yourdomain.com --only-categories=performance

# Real User Monitoring (RUM)
# Use Web Vitals library + analytics
```

**Alert if**:

- p75 LCP >3.0s for 3 consecutive days
- p95 LCP >5.0s

#### Time to First Byte (TTFB)

**What to measure**: Time until first byte received from server

**Target**: <600ms for p75

**How to track**:

```bash
# cURL timing
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# curl-format.txt:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total: %{time_total}\n
```

**Alert if**:

- p75 TTFB >800ms
- p95 TTFB >1500ms

#### Database Query Performance

**What to measure**:

- Slow queries (>500ms)
- Query count per request
- Connection pool usage

**Target**: <100ms average query time

**How to track**:

```sql
-- PostgreSQL slow query log
ALTER DATABASE your_db SET log_min_duration_statement = 500;

-- Query stats
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Alert if**:

- > 10 slow queries per hour
- Connection pool >80% usage

---

### 3. Engagement Metrics

#### Like Rate

**What to measure**:

- Total likes per day
- Likes per post (average)
- Like conversion rate (likes/views)

**Target**: ≥10% sessions with at least 1 like

**How to track**:

```sql
-- Total likes per day
SELECT
  DATE("createdAt") as date,
  COUNT(*) as total_likes
FROM "Reaction"
GROUP BY DATE("createdAt")
ORDER BY date DESC
LIMIT 30;

-- Top liked posts
SELECT
  p.title,
  r."likeCount"
FROM "ReactionAggregate" r
JOIN "Post" p ON p.id = r."postId"
ORDER BY r."likeCount" DESC
LIMIT 10;
```

**Alert if**:

- Like rate drops >30% week-over-week
- No likes recorded in 24 hours (indicates potential bug)

#### Comment Rate and Quality

**What to measure**:

- Comments per day
- Comment spam rejection rate

**Target**:

- Spam rejection rate <5% after 2 weeks
- First approval within 24 hours

**How to track**:

```sql
-- Comments per day by status
SELECT
  DATE("createdAt") as date,
  status,
  COUNT(*) as count
FROM "Comment"
GROUP BY DATE("createdAt"), status
ORDER BY date DESC
LIMIT 30;


SELECT
  id,
  "content",
  "createdAt",
  NOW() - "createdAt" as age
FROM "Comment"
WHERE status = 'PENDING'
ORDER BY "createdAt" ASC;


SELECT
  COUNT(*) FILTER (WHERE status = 'HIDDEN') * 100.0 / COUNT(*) as spam_rate
FROM "Comment"
WHERE "createdAt" > NOW() - INTERVAL '7 days';
```

**Alert if**:

- Spam rate >10%
- Comment rate drops >50% week-over-week

#### Auto-Approval Rate

**What to measure**:

- Returning user engagement

**Target**: >70% auto-approved after 2 weeks

**How to track**:

```sql
-- Auto-approval rate
SELECT
  COUNT(*) FILTER (WHERE status = 'PUBLISHED' AND "createdAt" = "updatedAt") * 100.0 / COUNT(*) as auto_approve_rate
FROM "Comment"
WHERE "createdAt" > NOW() - INTERVAL '7 days';

-- Returning commenters
SELECT
  "authorId",

FROM "Comment"
WHERE status IN ('PUBLISHED', 'PENDING')
GROUP BY "authorId"
HAVING COUNT(*) > 1
ORDER BY comment_count DESC;
```

**Alert if**:

- Auto-approval rate <60% after 4 weeks

---

### 4. Content Operations Metrics

#### Import/Export Success Rate

**What to measure**:

- Export requests per week
- Import success rate (created+updated / total files)
- Import errors by type

**Target**: 100% lossless round-trip for exports

**How to track**:

```bash
# Test export/import round-trip weekly
npm run test:export-import

# Expected output:
# ✅ Round-trip test PASSED
# Created: 0, Updated: N, Errors: 0
```

**Alert if**:

- Round-trip test fails (errors > 0)
- Import success rate <95%

#### Asset Preservation

**What to measure**:

- Referenced assets in exports
- Asset availability (no 404s)

**Target**: 0 missing assets in exports

**How to track**:

```bash
# Check for broken image links
# Use broken link checker tool
npx linkinator https://yourdomain.com --recurse --skip "^(?!https://yourdomain.com)"

# Expected: 0 broken links
```

**Alert if**:

- > 5 broken asset links detected
- Asset count in manifest doesn't match exported files

---

### 5. Reliability Metrics

#### Uptime

**What to measure**:

- Service availability
- API endpoint uptime

**Target**: 99.9% uptime (≤43 minutes downtime per month)

**How to track**:

- Uptime monitoring service (UptimeRobot, Pingdom, etc.)
- Endpoint: `https://yourdomain.com/api/health`
- Interval: Every 5 minutes

**Alert if**:

- Downtime >5 minutes
- Uptime <99.5% in rolling 30-day window

#### Error Rate

**What to measure**:

- 5xx errors per hour
- 4xx errors per hour
- JavaScript exceptions

**Target**: <0.1% error rate

**How to track**:

```bash
# Server logs
tail -f /var/log/nginx/error.log | grep -E "50[0-9]"

# Application logs
# Use error tracking service (Sentry, Rollbar, etc.)
```

**Alert if**:

- > 10 5xx errors per hour
- > 50 4xx errors per hour (excluding 404s)
- New exception type appears

#### PostAlias Redirect Hits

**What to measure**:

- 301 redirects served per day
- Decreasing trend over time (old links being updated)

**Target**: Decreasing trend (users/search engines updating links)

**How to track**:

```sql
-- PostAlias hit log (if implemented)
SELECT
  DATE("createdAt") as date,
  COUNT(*) as redirect_count
FROM "PostAliasHit"
GROUP BY DATE("createdAt")
ORDER BY date DESC
LIMIT 30;
```

**Alert if**:

- Redirect count increases week-over-week (indicates new broken links)

---

## Monitoring Tools

### Recommended Stack

#### Application Performance Monitoring (APM)

- **Vercel Analytics** (if using Vercel)
- **New Relic** (self-hosted)
- **DataDog** (enterprise)

#### Error Tracking

- **Sentry** (recommended)
  - Captures exceptions
  - Source maps for debugging
  - Performance monitoring

**Setup**:

```bash
npm install @sentry/nextjs

# sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

#### Uptime Monitoring

- **UptimeRobot** (free tier available)
- **Pingdom**
- **Checkly** (synthetic monitoring)

#### SEO Monitoring

- **Google Search Console** (free, essential)
- **Bing Webmaster Tools**
- **Ahrefs** or **SEMrush** (paid, comprehensive)

#### Database Monitoring

- **pganalyze** (PostgreSQL-specific)
- **Datadog Database Monitoring**
- Built-in: `pg_stat_statements`

#### Real User Monitoring (RUM)

- **Web Vitals** library + Google Analytics
- **Vercel Speed Insights**
- **Cloudflare Web Analytics**

**Setup**:

```typescript
// app/layout.tsx
import { reportWebVitals } from "next/web-vitals";

export function reportWebVitalsMetric(metric) {
  // Send to analytics service
  gtag("event", metric.name, {
    value: Math.round(metric.value),
    event_label: metric.id,
  });
}
```

---

## Alert Configuration

### Critical Alerts (Immediate Response Required)

#### Site Down

- **Trigger**: Uptime check fails for >5 minutes
- **Channel**: SMS + Email + Slack
- **Response**: Investigate immediately, roll back if needed

#### Database Connection Failure

- **Trigger**: >10 connection errors per minute
- **Channel**: SMS + Email
- **Response**: Check database status, restart if needed

#### High Error Rate

- **Trigger**: >50 5xx errors per minute
- **Channel**: Email + Slack
- **Response**: Check error logs, identify root cause

#### Security Incident

- **Trigger**: >100 failed auth attempts per minute
- **Channel**: SMS + Email
- **Response**: Review logs, block IPs if attack detected

### High Priority (Response Within 1 Hour)

#### Performance Degradation

- **Trigger**: p75 LCP >5s for 30 minutes
- **Channel**: Email + Slack
- **Response**: Check database queries, optimize if needed

#### SEO Issues

- **Trigger**: Indexed pages drop >10%
- **Channel**: Email
- **Response**: Check Search Console, fix robots.txt/sitemap if needed

### Medium Priority (Response Within 24 Hours)

#### Engagement Drop

- **Trigger**: Like rate drops >30% week-over-week
- **Channel**: Email
- **Response**: Review user feedback, check for bugs

#### Slow Queries

- **Trigger**: >10 queries >500ms per hour
- **Channel**: Email
- **Response**: Optimize queries, add indexes

### Low Priority (Response Within 1 Week)

#### Asset Optimization

- **Trigger**: >50% images not optimized
- **Channel**: Dashboard only
- **Response**: Optimize images, implement lazy loading

#### Code Quality

- **Trigger**: Test coverage drops below 80%
- **Channel**: Dashboard only
- **Response**: Add tests for new features

---

## Dashboard Setup

### Google Search Console Dashboard

**Widgets**:

1. **Coverage**: Valid vs Error pages
2. **Performance**: Impressions, Clicks, CTR, Position
3. **Enhancements**: Mobile Usability, Core Web Vitals
4. **Links**: Top linking sites, most linked content

**Review frequency**: Weekly

### Application Dashboard (Custom)

**Metrics to display**:

```
┌─────────────────────────────────────────┐
│ System Health                           │
├─────────────────────────────────────────┤
│ Uptime (30d):        99.95%            │
│ Avg Response Time:   250ms             │
│ Error Rate:          0.05%             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Engagement (7d)                         │
├─────────────────────────────────────────┤
│ Total Likes:         342                │
│ Total Comments:      87                 │
│ Pending Comments:    3                  │
│ Auto-Approval Rate:  78%                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ SEO (30d)                               │
├─────────────────────────────────────────┤
│ Indexed Pages:       95/100 (95%)      │
│ Avg Position:        12.3               │
│ Impressions:         15,420             │
│ Clicks:              1,234 (8.0% CTR)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Content Operations (7d)                 │
├─────────────────────────────────────────┤
│ Exports:             12                 │
│ Imports:             3                  │
│ Import Success Rate: 100%               │
└─────────────────────────────────────────┘
```

**Implementation**:

```typescript
// app/admin/monitoring/page.tsx
export default async function MonitoringPage() {
  const [
    uptime,
    errorRate,
    likeCount,

    // ... fetch metrics
  ] = await Promise.all([/* queries */]);

  return <Dashboard metrics={{...}} />;
}
```

---

## Incident Response

### Incident Severity Levels

**SEV1 - Critical**

- Site completely down
- Data breach or security incident
- Database corruption
- Response: Immediate (within 15 minutes)

**SEV2 - High**

- Major performance degradation
- SEO critical issues (site de-indexed)
- Response: Within 1 hour

**SEV3 - Medium**

- Minor feature broken
- Performance slightly degraded
- Non-critical bugs
- Response: Within 24 hours

**SEV4 - Low**

- UI glitches
- Non-blocking issues
- Enhancement requests
- Response: Within 1 week

### Incident Response Playbook

#### Step 1: Assess

- Identify severity level
- Determine impact (users affected, features down)
- Check monitoring dashboards for clues

#### Step 2: Communicate

- Notify team via Slack/email
- If public-facing, post status update
- Document incident in tracking system

#### Step 3: Mitigate

- Implement temporary fix or workaround
- Roll back to previous version if needed
- Scale resources if performance issue

#### Step 4: Resolve

- Identify root cause
- Implement permanent fix
- Deploy fix to production
- Verify resolution

#### Step 5: Post-Mortem

- Document timeline of events
- Identify root cause
- List action items to prevent recurrence
- Share lessons learned with team

### Example Incident: Site Down

```
09:00 - Alert: Uptime monitor reports site down
09:02 - Engineer acknowledges alert
09:05 - Check server logs: Database connection timeout
09:07 - Check database: Connection pool exhausted
09:10 - Mitigation: Restart database, increase connection pool size
09:15 - Verification: Site back up, monitoring for stability
09:30 - Root cause: Slow query causing connection leaks
10:00 - Permanent fix: Optimize slow query, add connection pool monitoring
11:00 - Post-mortem: Document incident, add alert for connection pool usage
```

---

## Monitoring Checklist

### Daily

- [ ] Review error logs for new issues
- [ ] Check uptime status (>99.9%)

### Weekly

- [ ] Review SEO metrics (Search Console)
- [ ] Analyze engagement trends (likes)
- [ ] Check performance metrics (LCP, TTFB)
- [ ] Review slow query log

### Monthly

- [ ] Run full test suite (export/import, SEO)
- [ ] Review alert configuration and adjust thresholds
- [ ] Analyze traffic trends and user behavior
- [ ] Review and update documentation

### Quarterly

- [ ] Comprehensive security audit
- [ ] Performance optimization review
- [ ] Database maintenance (VACUUM, REINDEX)
- [ ] Update monitoring tools and dependencies

---

## Contact and Escalation

**On-Call Rotation**:

- Primary: [Name] - [Phone]
- Secondary: [Name] - [Phone]
- Escalation: [Manager] - [Phone]

**Emergency Contacts**:

- Database Admin: [Contact]
- Hosting Provider: [Support Link]
- Security Team: [Contact]

**Communication Channels**:

- Slack: #incidents
- Email: incidents@example.com
- Status Page: status.example.com

---

This monitoring guide ensures the blog remains reliable, performant, and engaging for users. Adjust thresholds and tools based on your specific requirements and scale.
