# Deployment Guide

Step-by-step guide for deploying the i18n-enabled blog to production.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Build and Deploy](#build-and-deploy)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

Before deploying, ensure all of the following are complete:

### Code Quality

- [ ] All tests passing

  ```bash
  npm run test
  npm run lint
  npm run typecheck
  ```

- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build succeeds locally
  ```bash
  npm run build
  ```

### Data Preparation

- [ ] Database backup created

  ```bash
  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
  ```

- [ ] Content exported (for rollback safety)

  ```bash
  # Visit /admin/export and download full export
  ```

- [ ] Test data removed from production database

### Configuration

- [ ] Environment variables configured (see [Environment Setup](#environment-setup))
- [ ] Google OAuth credentials updated for production domain
- [ ] Database connection string verified
- [ ] `NEXT_PUBLIC_SITE_URL` set to production URL

### Security

- [ ] All secrets rotated (database passwords, auth secrets)
- [ ] Admin accounts verified and unnecessary accounts removed
- [ ] Rate limiting configuration reviewed
- [ ] CORS settings appropriate for production

### Documentation

- [ ] [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) reviewed and updated
- [ ] [USER_GUIDE.md](./USER_GUIDE.md) published or linked
- [ ] [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) reviewed and published
- [ ] README updated with production notes

---

## Environment Setup

### Required Environment Variables

Create a `.env.production` file or configure your hosting platform with these variables:

#### Database

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# Optional: Direct connection (for Prisma migrations)
DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"
```

#### Authentication (NextAuth.js)

```bash
# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-super-secret-key-here"

# Production URL
NEXTAUTH_URL="https://yourdomain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Site Configuration

```bash
# Public site URL (used for SEO, sitemaps, etc.)
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# Optional: Analytics or monitoring
NEXT_PUBLIC_ANALYTICS_ID="UA-XXXXX-X"
```

#### Optional: Security

```bash
# Optional: Enable IP and user agent hashing for security
ENABLE_IP_HASHING="true"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
5. Save and copy the client ID and secret to `.env.production`

---

## Database Migration

### Step 1: Backup Production Database

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-*.sql
```

### Step 2: Run Migrations

```bash
# Preview migrations (dry-run)
npx prisma migrate deploy --preview-feature

# Apply migrations to production
npx prisma migrate deploy
```

**Expected output:**

```
Applying migration `20240101000000_add_i18n_support`
Applying migration `20240101000001_add_post_alias`
Applying migration `20240101000002_add_reactions`

...
✔ Migrations applied successfully
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Run Data Backfill Scripts

If this is your first i18n deployment, run backfill scripts:

#### Set locale and groupId for existing posts

```bash
npx tsx scripts/backfill-locale.ts
```

**Expected output:**

```
✓ Backfilled 42 posts
  - EN: 30
  - ZH: 12
```

#### Migrate Chinese slugs to pinyin

```bash
npx tsx scripts/migrate-chinese-slugs.ts
```

**Expected output:**

```
✓ Migrated 5 posts
✓ Created 5 PostAlias entries
No posts required migration
```

### Step 5: Verify Database State

```bash
# Connect to database
psql $DATABASE_URL

# Check post counts
SELECT locale, COUNT(*) FROM "Post" GROUP BY locale;

# Check PostAlias entries
SELECT COUNT(*) FROM "PostAlias";



# Exit
\q
```

---

## Build and Deploy

### Option 1: Vercel Deployment

#### Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

#### Deploy to Production

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Post-Deploy Configuration

1. Go to Vercel Dashboard
2. Navigate to **Settings > Environment Variables**
3. Add all required environment variables (see [Environment Setup](#environment-setup))
4. Redeploy to apply changes

### Option 2: Docker Deployment

#### Build Docker Image

```bash
# Build image
docker build -t blog:latest .

# Tag for registry
docker tag blog:latest your-registry/blog:latest

# Push to registry
docker push your-registry/blog:latest
```

#### Deploy with Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    image: your-registry/blog:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=blog
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```

```bash
# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Option 3: Self-Hosted (PM2)

#### Build Application

```bash
# Build Next.js
npm run build

# Start with PM2
pm2 start npm --name "blog" -- start

# Save PM2 config
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/blog
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (use certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Post-Deployment Verification

### Automated Verification Script

```bash
# Run all tests against production
npm run test:production
```

Or manually verify each component:

### 1. Site Accessibility

```bash
# Check homepage (EN)
curl -I https://yourdomain.com

# Check homepage (ZH)
curl -I https://yourdomain.com/zh

# Expected: 200 OK
```

### 2. Authentication Flow

1. Visit `https://yourdomain.com`
2. Click "Sign in with Google"
3. Authorize the app
4. Verify redirect back to homepage
5. Check profile menu displays correctly
6. Sign out and verify redirect

### 3. Post Pages

```bash
# Check EN post
curl -I https://yourdomain.com/posts/test-post

# Check ZH post
curl -I https://yourdomain.com/zh/posts/test-post

# Expected: 200 OK
```

### 4. SEO Metadata

```bash
# Check sitemap
curl https://yourdomain.com/sitemap.xml
curl https://yourdomain.com/sitemap-en.xml
curl https://yourdomain.com/sitemap-zh.xml

# Check robots.txt
curl https://yourdomain.com/robots.txt
```

**Verify in browser:**

1. Visit a post page
2. View page source
3. Check for:
   - `<script type="application/ld+json">` with BlogPosting schema
   - `<link rel="alternate" hreflang="en">` tags
   - `<link rel="canonical">` tag
   - `<meta property="og:*">` Open Graph tags

### 5. Like Functionality

1. Visit a post page
2. Click the like button
3. Verify count increments
4. Verify button becomes disabled
5. Reload page
6. Verify button remains disabled

### 7. Admin Dashboard

1. Sign in as admin
2. Navigate to `/admin`
3. Verify metrics display correctly:
   - Post counts (EN/ZH)
4. Test export: `/admin/export`
5. Test import: `/admin/import`

### 8. PostAlias Redirects

If you migrated Chinese slugs:

```bash
# Check 301 redirect
curl -I https://yourdomain.com/zh/posts/老中文slug

# Expected: 301 Moved Permanently
# Location: https://yourdomain.com/zh/posts/lao-zhong-wen-slug
```

### 9. Performance

```bash
# Run Lighthouse
npx lighthouse https://yourdomain.com --view

# Target metrics:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - SEO: >95
```

### 10. Error Monitoring

Check your error monitoring service (e.g., Sentry, LogRocket) for:

- No new errors or warnings
- No failed API requests
- No database connection issues

---

## Rollback Procedure

If deployment fails or critical issues are discovered:

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel list

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Manual Rollback

#### Step 1: Restore Database

```bash
# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
```

#### Step 2: Rollback Code

```bash
# Git rollback
git revert HEAD
git push origin main

# Or checkout previous commit
git checkout <previous-commit-hash>
git push origin main --force
```

#### Step 3: Redeploy Previous Version

```bash
# Vercel
vercel --prod

# Docker
docker pull your-registry/blog:previous-tag
docker-compose -f docker-compose.prod.yml up -d

# PM2
git checkout <previous-commit-hash>
npm run build
pm2 restart blog
```

#### Step 4: Verify Rollback

- Test homepage loads
- Test authentication works
- Test posts display correctly
- Check error logs

---

## Monitoring Setup

### Health Check Endpoint

```bash
# Add to your monitoring service
curl https://yourdomain.com/api/health

# Expected: {"status": "ok"}
```

### Uptime Monitoring

Configure uptime monitoring service (e.g., UptimeRobot, Pingdom):

- URL: `https://yourdomain.com`
- Interval: Every 5 minutes
- Alerts: Email/SMS on downtime

### Error Tracking

Configure error tracking service (e.g., Sentry):

- Capture all exceptions
- Alert on high error rate
- Track slow API endpoints

### Database Monitoring

Monitor database metrics:

- Connection pool usage
- Query performance
- Disk usage
- Backup status

### Alerts Configuration

Set up alerts for:

- **Downtime**: Site unreachable for >5 minutes
- **High error rate**: >10 errors per minute
- **Slow response**: P95 response time >3 seconds
- **Database issues**: Connection failures
- **Disk space**: >80% usage

---

## Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Monitor error logs for 24 hours
- [ ] Test all critical user flows
- [ ] Verify SEO metadata in Google Search Console
- [ ] Check sitemap submission status
- [ ] Announce deployment to users

### Short-term (Week 1)

- [ ] Monitor like engagement metrics
- [ ] Check for broken links or redirect loops
- [ ] Verify hreflang tags in search results
- [ ] Test language switching on all posts

### Long-term (Month 1)

- [ ] Analyze SEO performance (search rankings, impressions)
- [ ] Review user feedback on i18n features
- [ ] Optimize slow queries or pages
- [ ] Plan next iteration based on metrics

---

## Troubleshooting

### "Database connection failed"

**Cause**: Incorrect `DATABASE_URL` or network issue
**Solution**:

1. Verify `DATABASE_URL` format
2. Check database is accessible from deployment environment
3. Verify firewall rules allow connections

### "OAuth error: redirect_uri_mismatch"

**Cause**: Production URL not added to Google OAuth settings
**Solution**:

1. Go to Google Cloud Console
2. Add `https://yourdomain.com/api/auth/callback/google` to authorized redirect URIs
3. Redeploy

### "Build failed: Type errors"

**Cause**: TypeScript errors in code
**Solution**:

1. Run `npm run typecheck` locally
2. Fix all type errors
3. Commit and redeploy

### "Slow page load times"

**Cause**: Database queries not optimized, or images not optimized
**Solution**:

1. Enable Next.js cache: `revalidate` in `getStaticProps`
2. Optimize images with Next.js `<Image>`
3. Add database indexes on frequently queried fields

---

## Support

For deployment issues:

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review deployment logs
- Contact: admin@example.com

---

## Deployment Checklist Summary

Print and check off during deployment:

```
Pre-Deployment:
□ All tests passing
□ Build succeeds locally
□ Database backup created
□ Content exported
□ Environment variables configured
□ Google OAuth updated

Deployment:
□ Database migrations applied
□ Backfill scripts run (if first i18n deploy)
□ Application deployed
□ Environment variables set

Post-Deployment:
□ Homepage loads (EN and ZH)
□ Authentication works
□ Post pages load
□ SEO metadata present
□ Like button works
□ Comments work
□ Admin dashboard accessible
□ PostAlias redirects work (if applicable)
□ Performance metrics acceptable

Monitoring:
□ Error tracking configured
□ Uptime monitoring active
□ Alerts configured
□ Database monitoring enabled

Final:
□ Deployment documented
□ Team notified
□ Users announced (if public launch)
```

Congratulations on your deployment! 🎉
