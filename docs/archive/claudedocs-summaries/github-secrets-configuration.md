# GitHub Secrets Configuration Guide

## Overview

This document provides instructions for configuring GitHub repository secrets required by automated workflows, specifically for the **Sync Gaming Data** workflow.

## Issue Analysis

### Sync Gaming Data Workflow Failure

**Workflow**: `.github/workflows/sync-gaming-data.yml`
**Schedule**: Runs every 3 hours via cron (`0 */3 * * *`)
**Error**: `curl: (3) URL rejected: No host part in the URL`

**Root Cause**: Missing GitHub repository secrets

- `SITE_URL` - Empty or not configured
- `ADMIN_API_KEY` - Empty or not configured

**Impact**: The workflow attempts to make an API call to trigger gaming data synchronization but fails because the secrets are not configured, resulting in a malformed curl command.

## Required Secrets

### 1. SITE_URL

**Purpose**: The base URL of your production deployment

**Example Value**:

```
https://your-production-domain.com
```

**Usage in Workflow**:

```yaml
curl -X POST ${{ secrets.SITE_URL }}/api/admin/gaming/sync
```

### 2. ADMIN_API_KEY

**Purpose**: Authentication token for admin API endpoints

**Format**: Bearer token for API authentication

**Example Value**:

```
your-secure-admin-api-key-here
```

**Usage in Workflow**:

```yaml
-H "Authorization: Bearer ${{ secrets.ADMIN_API_KEY }}"
```

## Configuration Steps

### Step 1: Access Repository Settings

1. Navigate to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**

### Step 2: Add SITE_URL Secret

1. Click the **New repository secret** button
2. Enter the following details:
   - **Name**: `SITE_URL`
   - **Value**: Your production site URL (e.g., `https://tdp.example.com`)
3. Click **Add secret**

### Step 3: Add ADMIN_API_KEY Secret

1. Click the **New repository secret** button again
2. Enter the following details:
   - **Name**: `ADMIN_API_KEY`
   - **Value**: Your admin API authentication key
3. Click **Add secret**

**Note**: If you don't have an admin API key yet, you'll need to generate one. Refer to your application's authentication documentation for instructions.

### Step 4: Verify Configuration

After adding the secrets:

1. Go to **Actions** tab in your repository
2. Find the **Sync Gaming Data** workflow
3. Click **Run workflow** to manually trigger it
4. Monitor the workflow run to ensure it completes successfully

## Workflow Behavior

Once secrets are configured, the workflow will:

1. Run automatically every 3 hours (cron schedule)
2. Make a POST request to `{SITE_URL}/api/admin/gaming/sync`
3. Include admin API key for authentication
4. Trigger synchronization of gaming data from configured platforms

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use repository secrets** - Configure secrets at the repository level, not in workflow files
3. **Rotate secrets regularly** - Update ADMIN_API_KEY periodically for security
4. **Restrict access** - Ensure only administrators have access to repository settings
5. **Use environment-specific secrets** - Consider using separate secrets for staging/production

## Troubleshooting

### Common Issues

#### Issue: Workflow still failing after adding secrets

**Solution**: Verify that:

- Secret names match exactly (case-sensitive)
- `SITE_URL` includes the protocol (`https://`)
- `SITE_URL` does NOT have a trailing slash
- `ADMIN_API_KEY` is valid and has admin privileges

#### Issue: API returns 401 Unauthorized

**Solution**:

- Verify that `ADMIN_API_KEY` is valid
- Check that the API endpoint requires the correct authentication format
- Ensure the key has necessary permissions for the sync operation

#### Issue: API endpoint not found (404)

**Solution**:

- Verify that `SITE_URL` is correct
- Ensure the `/api/admin/gaming/sync` endpoint exists in your deployment
- Check that the deployment is live and accessible

## Manual Testing

You can manually test the configuration using curl:

```bash
curl -X POST https://your-site-url.com/api/admin/gaming/sync \
  -H "Authorization: Bearer your-admin-api-key" \
  -H "Content-Type: application/json"
```

**Expected Response**: HTTP 200 with success message

## Related Documentation

- [Gaming Data Setup Guide](./steam-gaming-data-setup-guide.md)
- [Admin Guide](../docs/ADMIN_GUIDE.md)
- [Credential Management](./credential-management-implementation.md)

## Status

✅ **Documentation Created**: 2025-10-19
⚠️ **Action Required**: Repository administrator must configure secrets

## Next Steps

1. Repository administrator: Configure the two required secrets
2. Manually trigger the workflow to test configuration
3. Monitor scheduled workflow runs to ensure success
4. Update this document if additional secrets are required

---

**Last Updated**: 2025-10-19
**Author**: CI/CD Troubleshooting Team
