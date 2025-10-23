-- Add monitoring-related enums and tables
-- This is a manual migration to avoid data loss

-- Create MonitorType enum
DO $$ BEGIN
    CREATE TYPE "MonitorType" AS ENUM ('HTTP', 'TCP', 'PING', 'DNS', 'KEYWORD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create MonitorStatus enum
DO $$ BEGIN
    CREATE TYPE "MonitorStatus" AS ENUM ('UP', 'DOWN', 'PENDING', 'MAINTENANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Monitor table
CREATE TABLE IF NOT EXISTS "Monitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MonitorType" NOT NULL DEFAULT 'HTTP',
    "url" TEXT NOT NULL,
    "uptimeKumaId" INTEGER NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- Create MonitorHeartbeat table
CREATE TABLE IF NOT EXISTS "MonitorHeartbeat" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "status" "MonitorStatus" NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitorHeartbeat_pkey" PRIMARY KEY ("id")
);

-- Create unique index for Monitor.uptimeKumaId
CREATE UNIQUE INDEX IF NOT EXISTS "Monitor_uptimeKumaId_key" ON "Monitor"("uptimeKumaId");

-- Create indexes for Monitor
CREATE INDEX IF NOT EXISTS "Monitor_uptimeKumaId_idx" ON "Monitor"("uptimeKumaId");
CREATE INDEX IF NOT EXISTS "Monitor_isActive_idx" ON "Monitor"("isActive");

-- Create indexes for MonitorHeartbeat
CREATE INDEX IF NOT EXISTS "MonitorHeartbeat_monitorId_timestamp_idx" ON "MonitorHeartbeat"("monitorId", "timestamp");
CREATE INDEX IF NOT EXISTS "MonitorHeartbeat_timestamp_idx" ON "MonitorHeartbeat"("timestamp");
CREATE INDEX IF NOT EXISTS "MonitorHeartbeat_status_idx" ON "MonitorHeartbeat"("status");

-- Add foreign key constraint
ALTER TABLE "MonitorHeartbeat"
DROP CONSTRAINT IF EXISTS "MonitorHeartbeat_monitorId_fkey";

ALTER TABLE "MonitorHeartbeat"
ADD CONSTRAINT "MonitorHeartbeat_monitorId_fkey"
FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
