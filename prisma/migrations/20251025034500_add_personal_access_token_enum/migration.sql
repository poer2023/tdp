-- Add PERSONAL_ACCESS_TOKEN enum value to CredentialType
-- This migration fixes the production issue where GitHub credentials cannot be saved
-- Background: schema.prisma was updated with PERSONAL_ACCESS_TOKEN but migration was never created

-- Add new enum value (PostgreSQL 12+ supports this in transactions)
ALTER TYPE "CredentialType" ADD VALUE IF NOT EXISTS 'PERSONAL_ACCESS_TOKEN';

-- Verify enum now contains the new value
-- Expected values: API_KEY, OAUTH_TOKEN, COOKIE, PASSWORD, ENCRYPTED, PERSONAL_ACCESS_TOKEN
