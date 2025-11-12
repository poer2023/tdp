-- 创建 Steam API 凭据
-- 注意：这个脚本需要在数据库中运行

-- 检查是否已存在 Steam 凭据
DO $$
DECLARE
    existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count
    FROM "ExternalCredential"
    WHERE platform = 'STEAM';

    IF existing_count = 0 THEN
        -- 插入新的 Steam 凭据
        INSERT INTO "ExternalCredential" (
            id,
            platform,
            type,
            "value",
            "encryptedValue",
            metadata,
            "isEncrypted",
            "isValid",
            "createdAt",
            "updatedAt",
            "usageCount",
            "failureCount"
        ) VALUES (
            gen_random_uuid(),
            'STEAM',
            'API_KEY',
            '',  -- value 为空，因为我们使用环境变量
            NULL,
            jsonb_build_object(
                'steamId', '76561198795431974',
                'apiKeyEnv', 'STEAM_API_KEY',
                'description', 'Steam API credential for gaming data sync'
            ),
            false,
            true,
            NOW(),
            NOW(),
            0,
            0
        );

        RAISE NOTICE 'Steam credential created successfully';
    ELSE
        RAISE NOTICE 'Steam credential already exists, skipping creation';
    END IF;
END $$;

-- 查询创建的凭据
SELECT
    id,
    platform,
    type,
    metadata,
    "isValid",
    "createdAt"
FROM "ExternalCredential"
WHERE platform = 'STEAM';
