-- Drop Analytics Tables
-- This migration removes the self-built analytics system in favor of Cloudflare Web Analytics

-- Drop PageView table
DROP TABLE IF EXISTS "PageView";

-- Drop Visitor table  
DROP TABLE IF EXISTS "Visitor";

-- Drop DailyStats table
DROP TABLE IF EXISTS "DailyStats";

-- Drop DeviceType enum
DROP TYPE IF EXISTS "DeviceType";
