/**
 * Setup Steam Credential and Trigger Sync
 *
 * This script:
 * 1. Creates a Steam credential in the database
 * 2. Triggers Steam data sync
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("🎮 Steam 凭据设置和数据同步");
  console.log("=".repeat(60));
  console.log();

  try {
    // Step 1: Check if Steam credential already exists
    console.log("📋 检查现有 Steam 凭据...");
    const existingCredential = await prisma.externalCredential.findFirst({
      where: { platform: "STEAM" },
    });

    let credentialId;

    if (existingCredential) {
      console.log("✅ Steam 凭据已存在");
      console.log(`   ID: ${existingCredential.id}`);
      console.log(`   Steam ID: ${existingCredential.metadata?.steamId || "N/A"}`);
      credentialId = existingCredential.id;
    } else {
      // Step 2: Create Steam credential
      console.log("📝 创建 Steam 凭据...");

      const steamId = process.env.STEAM_USER_ID;
      const apiKey = process.env.STEAM_API_KEY;

      if (!steamId || !apiKey) {
        console.error("❌ 错误：未找到必要的环境变量");
        console.error("   请确保 .env 文件中配置了：");
        console.error("   - STEAM_API_KEY");
        console.error("   - STEAM_USER_ID");
        process.exit(1);
      }

      const credential = await prisma.externalCredential.create({
        data: {
          platform: "STEAM",
          type: "API_KEY",
          value: apiKey,
          isEncrypted: false,
          isValid: true,
          metadata: {
            steamId: steamId,
            description: "Steam API credential for gaming data sync",
          },
          usageCount: 0,
          failureCount: 0,
        },
      });

      console.log("✅ Steam 凭据创建成功");
      console.log(`   ID: ${credential.id}`);
      console.log(`   Steam ID: ${steamId}`);
      credentialId = credential.id;
    }

    console.log();
    console.log("🚀 准备触发 Steam 数据同步...");
    console.log(`   凭据 ID: ${credentialId}`);
    console.log(`   API 端点: POST /api/admin/credentials/${credentialId}/sync`);
    console.log();
    console.log("💡 你可以通过以下方式触发同步：");
    console.log(`   1. 访问: http://localhost:3000/admin/credentials`);
    console.log(`   2. 点击 Steam 凭据的"同步"按钮`);
    console.log(
      `   3. 或运行: curl -X POST http://localhost:3000/api/admin/credentials/${credentialId}/sync`
    );
    console.log();
    console.log("=".repeat(60));
    console.log("✅ 设置完成！");
    console.log("=".repeat(60));
  } catch (error) {
    console.error();
    console.error("=".repeat(60));
    console.error("❌ 发生错误");
    console.error("=".repeat(60));
    console.error();
    console.error(error);
    console.error();
    console.error("=".repeat(60));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
