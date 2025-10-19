-- Insert Steam credential if not exists
INSERT INTO "ExternalCredential" (
    id,
    platform,
    type,
    value,
    metadata,
    "isValid",
    "usageCount",
    "failureCount",
    "autoSync",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    'STEAM',
    'API_KEY',
    'C5083BA4529514944D4BABFFDA82C1ED',
    '{"steamId": "76561198795431974", "description": "Steam API credential for gaming data sync"}'::jsonb,
    true,
    0,
    0,
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM "ExternalCredential" WHERE platform = 'STEAM'
);

-- Display the result
SELECT
    id,
    platform,
    type,
    metadata->'steamId' as steam_id,
    "isValid",
    "createdAt"
FROM "ExternalCredential"
WHERE platform = 'STEAM';
