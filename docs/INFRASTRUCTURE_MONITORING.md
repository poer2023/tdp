# Infrastructure Monitoring Setup Guide

This guide explains how to set up infrastructure monitoring for your application using Uptime Kuma.

## Overview

The infrastructure monitoring system integrates with Uptime Kuma to provide:

- Real-time service status monitoring
- Uptime statistics (24h and 30d)
- Response time tracking
- Incident history and downtime reports
- Admin access to Uptime Kuma dashboard

## Prerequisites

- Docker and Docker Compose
- PostgreSQL database (already configured)
- Access to deploy Uptime Kuma service

## Step 1: Deploy Uptime Kuma

### Using Docker

```bash
# Create a docker-compose.yml for Uptime Kuma
version: '3.8'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - uptime-kuma-data:/app/data
    ports:
      - "3001:3001"
    restart: always

volumes:
  uptime-kuma-data:
```

### Start the service

```bash
docker-compose up -d
```

Access Uptime Kuma at `http://localhost:3001` and complete the initial setup.

## Step 2: Configure Uptime Kuma

1. **Create Admin Account**
   - Navigate to `http://localhost:3001`
   - Set up your admin username and password

2. **Add Monitors**
   - Click "Add New Monitor"
   - Configure your services:
     - **Name**: Service name (e.g., "Main Website")
     - **Monitor Type**: HTTP(s), TCP, Ping, etc.
     - **URL**: Service URL to monitor
     - **Heartbeat Interval**: Check frequency (default: 60 seconds)

   Example monitors:
   - Main Website: `https://your-domain.com`
   - API Endpoint: `https://api.your-domain.com/health`
   - Database: TCP check on `your-db-server:5432`

3. **Generate API Key**
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key for environment configuration

## Step 3: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Uptime Kuma API 地址 (internal API endpoint)
UPTIME_KUMA_URL=http://localhost:3001

# Uptime Kuma API 密钥 (from Settings → API Keys)
UPTIME_KUMA_API_KEY=your_api_key_here

# Uptime Kuma 管理界面地址 (public dashboard URL)
NEXT_PUBLIC_UPTIME_KUMA_URL=https://status.your-domain.com

# 监控数据同步频率 (Cron expression)
MONITOR_SYNC_CRON_SCHEDULE=*/5 * * * *
```

## Step 4: Run Database Migration

```bash
# Generate Prisma client with new monitoring models
npx prisma generate

# The SQL migration has already been executed
# If you need to re-run it:
npx prisma db execute --file prisma/migrations/add_monitoring_tables.sql --schema prisma/schema.prisma
```

## Step 5: Configure Cron Jobs

### For Vercel Deployment

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-monitors",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### For Self-Hosted Deployment

Set up a cron job or use a service like GitHub Actions to call the sync endpoint:

```bash
*/5 * * * * curl -X GET https://your-domain.com/api/cron/sync-monitors \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Step 6: Verify Setup

1. **Check Data Sync**
   - Visit: `https://your-domain.com/api/cron/sync-monitors`
   - Should return sync status and statistics

2. **View Monitoring Dashboard**
   - Navigate to: `https://your-domain.com/[locale]/about/infra`
   - Should display all configured monitors

3. **Test Admin Access**
   - Login as admin user
   - Visit monitoring page
   - Click "Manage Monitors" button
   - Should redirect to Uptime Kuma dashboard

## Architecture

```
┌─────────────────┐
│  Uptime Kuma    │  ← Monitors your services
│  (Port 3001)    │
└────────┬────────┘
         │
         │ API calls (every 5 min)
         │
         ▼
┌─────────────────┐
│  Sync Cron Job  │  ← /api/cron/sync-monitors
│                 │
└────────┬────────┘
         │
         │ Stores data
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  ← Monitor + MonitorHeartbeat tables
│   Database      │
└────────┬────────┘
         │
         │ Queries data
         │
         ▼
┌─────────────────┐
│  Frontend API   │  ← /api/infra/monitors, /stats, /incidents
│                 │
└────────┬────────┘
         │
         │ Displays data
         │
         ▼
┌─────────────────┐
│  Infra Page     │  ← /[locale]/about/infra
└─────────────────┘
```

## API Endpoints

### Public Endpoints

- `GET /api/infra/monitors` - Get all active monitors with latest status
- `GET /api/infra/stats` - Get uptime statistics and performance metrics
- `GET /api/infra/incidents?limit=20` - Get recent incidents

### Admin Endpoints

- `GET /api/cron/sync-monitors` - Manually trigger monitor sync (requires `CRON_SECRET`)

## Troubleshooting

### No monitors showing on the page

1. Check Uptime Kuma is running: `docker ps | grep uptime-kuma`
2. Verify API connection: Test the Uptime Kuma API endpoint
3. Check environment variables are set correctly
4. Run manual sync: `curl https://your-domain.com/api/cron/sync-monitors`
5. Check database: `SELECT * FROM "Monitor";`

### Sync job failing

1. Check Uptime Kuma API key is valid
2. Verify network connectivity between app and Uptime Kuma
3. Check sync job logs for error messages
4. Ensure database tables exist: `\dt Monitor*`

### Admin button not showing

1. Verify user has ADMIN role in database
2. Check `NEXT_PUBLIC_UPTIME_KUMA_URL` is set
3. Ensure user is logged in

## Data Retention

- Heartbeat data is automatically cleaned up after 3 months
- To change retention period, modify the cleanup logic in `/api/cron/sync-monitors/route.ts`

## Security Considerations

1. **API Keys**: Keep Uptime Kuma API key secure, never commit to git
2. **Access Control**: Uptime Kuma dashboard should be behind authentication
3. **Cron Secret**: Use a strong random value for `CRON_SECRET`
4. **Network**: If possible, keep Uptime Kuma on internal network

## Advanced Configuration

### Custom Monitor Types

The system supports all Uptime Kuma monitor types:

- HTTP/HTTPS (with keyword checking)
- TCP Port
- Ping
- DNS
- Custom keywords in HTTP response

### Notification Channels

Configure notifications in Uptime Kuma:

- Email
- Slack
- Discord
- Telegram
- Webhook

These notifications are independent of the Next.js integration.

## Support

For issues related to:

- **Uptime Kuma**: https://github.com/louislam/uptime-kuma
- **This Integration**: Create an issue in your project repository
