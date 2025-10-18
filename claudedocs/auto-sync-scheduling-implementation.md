# Automatic Sync Scheduling Implementation - Phase 4.1

## Overview

Implemented automatic sync scheduling using Vercel Cron Jobs to periodically sync data from all configured platforms based on their frequency settings.

## Components Created

### 1. Cron Sync API (`/src/app/api/cron/sync/route.ts`)

**Features:**
- Automatic sync orchestration for all platforms
- Smart frequency-based scheduling (hourly/daily/weekly)
- Platform-specific sync logic coordination
- Comprehensive logging and monitoring
- Security with CRON_SECRET authentication

**Sync Frequencies:**
- `hourly`: Sync if last sync was >1 hour ago
- `daily`: Sync if last sync was >24 hours ago
- `weekly`: Sync if last sync was >7 days ago
- `disabled`: Skip sync completely

**Endpoint:** `GET /api/cron/sync`

**Security:**
```typescript
// Validates authorization header
Authorization: Bearer <CRON_SECRET>
```

### 2. Vercel Cron Configuration (`/vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

**Cron Schedule Format (cron expression):**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

**Common Schedules:**
- `0 * * * *` - Every hour at minute 0
- `0 */2 * * *` - Every 2 hours
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday at midnight

## How It Works

### 1. Cron Trigger

Vercel Cron service sends authenticated GET request to `/api/cron/sync` every hour.

### 2. Credential Discovery

```typescript
// Fetch all valid credentials with auto-sync enabled
const credentials = await prisma.externalCredential.findMany({
  where: {
    isValid: true,
    autoSync: true,  // Only sync if autoSync is enabled
  },
  include: {
    syncJobLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    syncJobs: { orderBy: { startedAt: "desc" }, take: 1 },
  },
});
```

### 3. Frequency Evaluation

For each credential:
```typescript
function shouldSyncCredential(frequency, lastSyncAt) {
  // Calculate time since last sync
  const hoursSinceLastSync = (now - lastSyncAt) / (1000 * 60 * 60);

  // Check if sync is due based on frequency
  switch (frequency) {
    case "hourly": return hoursSinceLastSync >= 1;
    case "daily": return hoursSinceLastSync >= 24;
    case "weekly": return hoursSinceLastSync >= 168; // 7 * 24
    case "disabled": return false;
  }
}
```

### 4. Platform-Specific Sync

**Media Platforms (Bilibili, Douban):**
```typescript
// Sync all media platforms together
const mediaResults = await syncMedia();
```

**Gaming Platforms (Steam, HoYoverse):**
```typescript
// Sync each gaming credential separately
const gamingService = new GamingSyncService();

if (platform === "STEAM") {
  const result = await gamingService.syncSteamData(steamId);
}

if (platform === "HOYOVERSE") {
  const result = await gamingService.syncZZZData(uid);
}
```

### 5. Result Reporting

```typescript
return NextResponse.json({
  success: true,
  duration: 1234,
  summary: {
    totalCredentials: 5,
    synced: 3,
    skipped: 2,
    succeeded: 3,
    failed: 0,
  },
  schedules: [/* sync decisions */],
  results: [/* sync outcomes */],
});
```

## Database Schema Support

### ExternalCredential Model

```prisma
model ExternalCredential {
  id            String   @id @default(cuid())
  platform      Platform
  value         String   // Encrypted credential data
  autoSync      Boolean  @default(false)  // Enable/disable auto-sync
  syncFrequency String?  @default("daily") // hourly | daily | weekly | disabled
  isValid       Boolean  @default(true)
  // ... other fields
}
```

**Key Fields for Auto-Sync:**
- `autoSync`: Master switch for automatic syncing
- `syncFrequency`: How often to sync (hourly/daily/weekly/disabled)
- `isValid`: Only sync valid credentials

## Environment Configuration

### Required Environment Variables

```env
# Vercel Cron Secret (for authentication)
CRON_SECRET=<random-secret-string>

# Credential encryption key (already configured in Phase 3.1)
CREDENTIAL_ENCRYPTION_KEY=<64-char-hex>
```

### Generating CRON_SECRET

```bash
# Generate secure random string (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment

### 1. Vercel Platform Configuration

1. Add `CRON_SECRET` to environment variables in Vercel dashboard
2. Deploy application with `vercel.json` configuration
3. Vercel automatically registers cron job

### 2. Verification

Check Vercel dashboard → Deployments → Cron Jobs to verify:
- Cron job is registered
- Schedule is correct
- Last execution status

### 3. Manual Testing

Test cron endpoint directly (with authentication):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/sync
```

## Logging and Monitoring

### Console Logs

```
[Cron Sync] Starting automatic sync job...
[Cron Sync] Found 5 credentials with auto-sync enabled
[Cron Sync] Syncing 3 credentials
[Cron Sync] Skipping 2 credentials

✅ SYNC BILIBILI (daily): Last sync 25.3h ago
✅ SYNC STEAM (hourly): Last sync 1.2h ago
⏭️  SKIP DOUBAN (weekly): Synced 2.1d ago (< 7d)

[Cron Sync] Syncing BILIBILI (1 credentials)...
[Cron Sync] Syncing STEAM (1 credentials)...

[Cron Sync] Completed in 3456ms: 2 success, 0 failed
```

### Response Format

```json
{
  "success": true,
  "duration": 3456,
  "summary": {
    "totalCredentials": 5,
    "synced": 3,
    "skipped": 2,
    "succeeded": 3,
    "failed": 0
  },
  "schedules": [
    {
      "credentialId": "abc123",
      "platform": "BILIBILI",
      "frequency": "daily",
      "lastSyncAt": "2025-10-17T12:00:00.000Z",
      "shouldSync": true,
      "reason": "Last sync 25.3h ago"
    }
  ],
  "results": [
    {
      "platform": "BILIBILI",
      "success": true,
      "message": "150 items synced"
    }
  ]
}
```

## Integration with Credential Management

### Credential Form Updates Required

To fully enable auto-sync functionality, credential forms need to support:

1. **autoSync Checkbox:**
   ```tsx
   <input
     type="checkbox"
     checked={autoSync}
     onChange={(e) => setAutoSync(e.target.checked)}
   />
   ```

2. **syncFrequency Select:**
   ```tsx
   <select value={syncFrequency} onChange={(e) => setSyncFrequency(e.target.value)}>
     <option value="hourly">Hourly</option>
     <option value="daily">Daily (Recommended)</option>
     <option value="weekly">Weekly</option>
     <option value="disabled">Disabled</option>
   </select>
   ```

## Frequency Recommendations

| Platform | Recommended Frequency | Reason |
|----------|----------------------|---------|
| Bilibili | daily | Video consumption patterns |
| Douban | daily | Movie/book consumption patterns |
| Steam | hourly | Real-time gaming activity |
| HoYoverse | daily | Daily gacha game activities |
| Jellyfin | daily | Media server consumption |

## Error Handling

### Failed Sync Scenarios

1. **Credential Invalid:**
   - Skip sync
   - Log warning
   - Continue with other credentials

2. **Platform API Error:**
   - Log error
   - Record failed sync in results
   - Continue with other platforms

3. **Database Error:**
   - Return 500 error
   - Log fatal error
   - Retry on next cron trigger

### Recovery Strategy

- Cron job runs hourly, so failed syncs retry automatically
- Individual platform failures don't block other platforms
- Comprehensive logging for debugging

## Performance Considerations

### Optimization Strategies

1. **Parallel Platform Syncs:**
   ```typescript
   // Sync media platforms together
   await syncMedia();  // Handles Bilibili + Douban
   ```

2. **Frequency-Based Filtering:**
   ```typescript
   // Only sync credentials that are due
   const credentialsToSync = schedules.filter(s => s.shouldSync);
   ```

3. **Rate Limiting:**
   - Respect platform API rate limits
   - Stagger sync operations if needed
   - Use exponential backoff for retries

### Execution Time Targets

- **Single platform:** < 5 seconds
- **All platforms:** < 30 seconds
- **Vercel function timeout:** 10 seconds (Hobby), 60 seconds (Pro)

## Security

### Authentication

```typescript
// Vercel Cron automatically sends authorization header
Authorization: Bearer <CRON_SECRET>

// API validates secret
if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Best Practices

1. **Keep CRON_SECRET secure** - Never commit to repository
2. **Use environment variables** - Different secrets for dev/prod
3. **Validate authorization** - Always check CRON_SECRET
4. **Log unauthorized attempts** - Monitor for security issues

## Testing

### Manual Cron Trigger

```bash
# Development (local)
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/sync

# Production
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/sync
```

### Test Scenarios

1. **First Time Sync (No History):**
   - All credentials with autoSync should sync
   - Reason: "Never synced before"

2. **Hourly Frequency:**
   - Sync if >1 hour since last sync
   - Skip if <1 hour

3. **Daily Frequency:**
   - Sync if >24 hours since last sync
   - Skip if <24 hours

4. **Weekly Frequency:**
   - Sync if >7 days since last sync
   - Skip if <7 days

5. **Disabled Frequency:**
   - Always skip
   - Reason: "Sync disabled"

## Monitoring

### Vercel Dashboard

Monitor cron job execution:
- Execution count
- Success/failure rate
- Average execution time
- Last execution timestamp

### Application Logs

View detailed sync logs in Vercel Functions logs:
```
[Cron Sync] Starting automatic sync job...
[Cron Sync] Completed in 3456ms: 2 success, 0 failed
```

### Alerting (Optional)

Set up monitoring alerts for:
- Cron job failures
- Excessive execution time
- High failure rate
- No executions for extended period

## Status

✅ **Completed:**
- Cron sync API implementation
- Vercel cron configuration
- Frequency-based scheduling logic
- Platform-specific sync orchestration
- Security with CRON_SECRET
- Comprehensive logging
- Error handling and recovery

⏳ **Remaining:**
- Credential form UI updates (autoSync checkbox, syncFrequency select)
- E2E testing with cron trigger
- Production deployment and verification
- Monitoring dashboard integration

## Next Steps

Phase 4.1 automatic sync scheduling is functionally complete. To fully enable the feature:

1. Update credential form components to support:
   - `autoSync` boolean field (checkbox)
   - `syncFrequency` select field (hourly/daily/weekly/disabled)

2. Deploy to Vercel with:
   - `CRON_SECRET` environment variable
   - `vercel.json` cron configuration

3. Verify cron job registration in Vercel dashboard

4. Monitor first few executions for success

## Architecture Summary

```
Vercel Cron Service
       ↓
  [Hourly Trigger]
       ↓
GET /api/cron/sync (with CRON_SECRET)
       ↓
  [Fetch Valid Credentials]
  (where autoSync=true, isValid=true)
       ↓
  [Evaluate Sync Frequency]
  (hourly/daily/weekly logic)
       ↓
  [Platform-Specific Sync]
  - Media: syncMedia()
  - Gaming: GamingSyncService
       ↓
  [Log Results & Return Summary]
```

This completes Phase 4.1: Automatic Sync Scheduling System! 🎉
