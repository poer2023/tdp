# Production Environment Troubleshooting Guide

## Issue: GitHub Credentials Sync Showing 0 Items

**Symptoms:**

- Sync UI displays "同步成功: 0 项成功" (Sync Success: 0 items successful)
- /about page not loading properly in production
- Development environment works normally
- No console errors visible
- Network requests appear normal

## Step-by-Step Debugging Process

### 1. Check Application Logs

First, SSH into your production server and check recent application logs:

```bash
# View recent logs
docker compose logs app --tail=200

# Filter for GitHub-related errors
docker compose logs app | grep -i "github"

# Filter for sync-related errors
docker compose logs app | grep -i "sync"

# Check for API errors
docker compose logs app | grep -i "error"

# Follow logs in real-time while testing sync
docker compose logs app --follow
```

**Look for:**

- GitHub API authentication errors (401, 403)
- Rate limiting errors (429)
- Network connectivity issues
- Database connection errors
- Prisma Client errors

### 2. Verify Database Migration Status

Check if all migrations were applied correctly:

```bash
# Check migration status
docker compose exec app npx prisma migrate status

# Expected output should show all migrations applied
# If any are pending, run:
docker compose exec app npx prisma migrate deploy

# Verify ExternalCredential table exists
docker compose exec postgres psql -U postgres -d tdp -c "\dt" | grep -i credential
```

### 3. Check GitHub Credentials in Database

Verify that GitHub credentials exist and are properly configured:

```bash
# List all GitHub credentials
docker compose exec postgres psql -U postgres -d tdp -c "
  SELECT
    id,
    platform,
    type,
    \"isActive\",
    \"lastSyncAt\",
    \"userId\"
  FROM \"ExternalCredential\"
  WHERE platform = 'GITHUB';
"

# Check if credential data is encrypted properly
docker compose exec postgres psql -U postgres -d tdp -c "
  SELECT
    id,
    length(\"encryptedData\") as encrypted_length,
    \"createdAt\"
  FROM \"ExternalCredential\"
  WHERE platform = 'GITHUB';
"
```

**Expected:**

- At least one GITHUB credential should exist
- `isActive` should be `true`
- `encryptedData` should have non-zero length

### 4. Verify Environment Variables

Check that all necessary environment variables are set:

```bash
# Check environment configuration
cat .env | grep -E "GITHUB|CREDENTIAL|ENCRYPTION"

# Specifically check:
# - CREDENTIAL_ENCRYPTION_KEY (must be set and match development)
# - Any GitHub API tokens or credentials
```

**Critical:** If `CREDENTIAL_ENCRYPTION_KEY` is different between development and production, encrypted credentials won't decrypt properly!

### 5. Test GitHub API Connectivity

Verify that the production server can reach GitHub API:

```bash
# Test basic GitHub API connectivity
docker compose exec app node -e "
  fetch('https://api.github.com/rate_limit')
    .then(r => r.json())
    .then(d => console.log(JSON.stringify(d, null, 2)))
    .catch(e => console.error('Error:', e.message))
"

# If you have a GitHub token, test authenticated request
docker compose exec app node -e "
  fetch('https://api.github.com/user', {
    headers: { 'Authorization': 'Bearer YOUR_GITHUB_TOKEN' }
  })
    .then(r => r.json())
    .then(d => console.log(JSON.stringify(d, null, 2)))
    .catch(e => console.error('Error:', e.message))
"
```

**Look for:**

- Rate limiting (X-RateLimit-Remaining: 0)
- Authentication errors
- Network connectivity issues

### 6. Test Sync Endpoint Directly

Test the sync API endpoint to see detailed error responses:

```bash
# First, get the credential ID
CREDENTIAL_ID=$(docker compose exec -T postgres psql -U postgres -d tdp -t -c "
  SELECT id FROM \"ExternalCredential\"
  WHERE platform = 'GITHUB'
  LIMIT 1;
" | xargs)

echo "Credential ID: $CREDENTIAL_ID"

# Test the sync endpoint (requires authentication)
curl -X POST "http://localhost:3000/api/admin/credentials/${CREDENTIAL_ID}/sync" \
  -H "Content-Type: application/json" \
  -H "Cookie: $(docker compose exec app cat /tmp/auth-cookie 2>/dev/null)" \
  -v
```

### 7. Check Sync Job Logs

Review SyncJobLog entries to see what's happening:

```bash
docker compose exec postgres psql -U postgres -d tdp -c "
  SELECT
    id,
    platform,
    status,
    \"itemsProcessed\",
    \"itemsSucceeded\",
    \"itemsFailed\",
    \"startedAt\",
    \"completedAt\",
    \"errorMessage\"
  FROM \"SyncJobLog\"
  WHERE platform = 'GITHUB'
  ORDER BY \"startedAt\" DESC
  LIMIT 10;
"
```

**Check for:**

- Recent sync jobs with status = 'FAILED'
- Jobs with itemsProcessed = 0
- Any error messages

### 8. Verify GitHubStats Table

Check if the GitHubStats table is receiving data:

```bash
docker compose exec postgres psql -U postgres -d tdp -c "
  SELECT COUNT(*) as total_records FROM \"GitHubStats\";
"

docker compose exec postgres psql -U postgres -d tdp -c "
  SELECT
    id,
    \"userId\",
    \"totalStars\",
    \"totalRepos\",
    \"updatedAt\"
  FROM \"GitHubStats\"
  LIMIT 5;
"
```

### 9. Check About Page Data

Verify that the /about page API endpoints are returning data:

```bash
# Test GitHub stats endpoint
curl http://localhost:3000/api/about/live/github -v

# Check response status and body
# Should return GitHub stats JSON if data exists
```

## Common Issues and Solutions

### Issue 1: Encryption Key Mismatch

**Symptom:** Credentials exist but sync returns 0 items

**Solution:**

```bash
# Check if encryption key is consistent
# Development: check .env.local
# Production: check .env

# If keys don't match, you need to re-create credentials in production
# or copy the encryption key from development to production
```

### Issue 2: GitHub Rate Limiting

**Symptom:** API returns 429 errors or X-RateLimit-Remaining: 0

**Solution:**

- Wait for rate limit to reset (check X-RateLimit-Reset header)
- Use authenticated GitHub API requests (higher rate limits)
- Implement rate limit handling in sync logic

### Issue 3: Network Connectivity

**Symptom:** Cannot reach api.github.com

**Solution:**

```bash
# Test basic connectivity
docker compose exec app ping api.github.com -c 3

# Check firewall rules
# Check proxy configuration
```

### Issue 4: Database Migration Not Applied

**Symptom:** Table or column doesn't exist errors

**Solution:**

```bash
# Apply pending migrations
docker compose exec app npx prisma migrate deploy

# Regenerate Prisma Client
docker compose exec app npx prisma generate

# Restart application
docker compose restart app
```

### Issue 5: Token/Credential Invalid

**Symptom:** GitHub API returns 401 Unauthorized

**Solution:**

- Verify GitHub Personal Access Token is valid
- Check token permissions (scopes)
- Re-authenticate and save new token

## Detailed Logging Instructions

If you need more detailed logs, temporarily enable debug logging:

```bash
# Add to .env
LOG_LEVEL=debug
DEBUG=github:*,sync:*

# Restart application
docker compose restart app

# Now logs will be more verbose
docker compose logs app --follow
```

## Getting Help

If issues persist, collect the following information:

1. Application logs (last 200 lines):

   ```bash
   docker compose logs app --tail=200 > app-logs.txt
   ```

2. Database state:

   ```bash
   docker compose exec postgres psql -U postgres -d tdp -c "
     SELECT platform, COUNT(*)
     FROM \"ExternalCredential\"
     GROUP BY platform;
   " > db-credentials.txt
   ```

3. Sync job history:

   ```bash
   docker compose exec postgres psql -U postgres -d tdp -c "
     SELECT * FROM \"SyncJobLog\"
     ORDER BY \"startedAt\" DESC
     LIMIT 20;
   " > sync-jobs.txt
   ```

4. Environment configuration (sanitized):
   ```bash
   cat .env | grep -v "SECRET\|PASSWORD\|KEY" > env-config.txt
   ```

Share these files when requesting support.

---

**Last Updated:** 2025-10-25
**Maintainer:** Development Team
**Version:** 1.0.0
