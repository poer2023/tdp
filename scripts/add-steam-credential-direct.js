/**
 * Directly add Steam credential to database
 * This script bypasses Prisma client and uses raw SQL
 */

const { Client } = require("pg");

async function main() {
  console.log("=".repeat(60));
  console.log("🎮 直接添加 Steam 凭据到数据库");
  console.log("=".repeat(60));
  console.log();

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL 未配置");
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log("✅ 数据库连接成功");
    console.log();

    // Check if Steam credential already exists
    const checkResult = await client.query(
      `SELECT id, platform, metadata FROM "ExternalCredential" WHERE platform = 'STEAM'`
    );

    if (checkResult.rows.length > 0) {
      console.log("✅ Steam 凭据已存在：");
      checkResult.rows.forEach((row) => {
        console.log(`   ID: ${row.id}`);
        console.log(`   Platform: ${row.platform}`);
        console.log(`   Metadata: ${JSON.stringify(row.metadata, null, 2)}`);
      });
      console.log();
      console.log("💡 你可以在管理后台访问：");
      console.log(`   http://localhost:3000/admin/credentials`);
      console.log();
      return;
    }

    // Get Steam credentials from environment
    const steamApiKey = process.env.STEAM_API_KEY;
    const steamUserId = process.env.STEAM_USER_ID;

    if (!steamApiKey || !steamUserId) {
      console.error("❌ Steam 凭据未在 .env 中配置");
      console.error("   需要: STEAM_API_KEY 和 STEAM_USER_ID");
      process.exit(1);
    }

    console.log("📝 准备插入 Steam 凭据...");
    console.log(`   Steam API Key: ${steamApiKey.substring(0, 8)}...`);
    console.log(`   Steam User ID: ${steamUserId}`);
    console.log();

    // Insert Steam credential
    const insertResult = await client.query(
      `INSERT INTO "ExternalCredential" (
        id,
        platform,
        type,
        value,
        metadata,
        "isEncrypted",
        "isValid",
        "usageCount",
        "failureCount",
        "autoSync",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        'STEAM',
        'API_KEY',
        $1,
        $2,
        false,
        true,
        0,
        0,
        false,
        NOW(),
        NOW()
      ) RETURNING id, platform, metadata`,
      [
        steamApiKey,
        JSON.stringify({
          steamId: steamUserId,
          description: "Steam API credential for gaming data sync",
        }),
      ]
    );

    console.log("✅ Steam 凭据创建成功！");
    console.log();
    console.log("📋 凭据详情：");
    const credential = insertResult.rows[0];
    console.log(`   ID: ${credential.id}`);
    console.log(`   Platform: ${credential.platform}`);
    console.log(`   Metadata: ${JSON.stringify(credential.metadata, null, 2)}`);
    console.log();
    console.log("🎯 下一步操作：");
    console.log(`   1. 访问管理后台: http://localhost:3000/admin/credentials`);
    console.log(`   2. 找到 Steam 凭据并点击"同步"按钮`);
    console.log(`   3. 等待同步完成后访问: http://localhost:3000/about/live/gaming`);
    console.log();
    console.log("=".repeat(60));
  } catch (error) {
    console.error();
    console.error("=".repeat(60));
    console.error("❌ 发生错误");
    console.error("=".repeat(60));
    console.error();
    console.error(error);
    console.error();
    process.exit(1);
  } finally {
    await client.end();
    console.log("✅ 数据库连接已关闭");
  }
}

main();
