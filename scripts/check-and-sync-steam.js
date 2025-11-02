/**
 * Check Steam credential and trigger sync
 */

const { PrismaClient } = require("@prisma/client");
const { getGamingSyncService } = require("../src/lib/gaming/sync-service");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("🎮 Steam 凭据检查和同步");
  console.log("=".repeat(60));
  console.log();

  try {
    // Find Steam credential
    console.log("📋 查找 Steam 凭据...");
    const credential = await prisma.externalCredential.findFirst({
      where: { platform: "STEAM" },
    });

    if (!credential) {
      console.error("❌ 未找到 Steam 凭据");
      console.log("   请运行: npx prisma db execute --file scripts/insert-steam-credential.sql");
      process.exit(1);
    }

    console.log("✅ 找到 Steam 凭据");
    console.log(`   ID: ${credential.id}`);
    console.log(`   Platform: ${credential.platform}`);
    console.log(`   Steam ID: ${credential.metadata?.steamId || "N/A"}`);
    console.log(`   Valid: ${credential.isValid}`);
    console.log();

    // Trigger sync
    console.log("🚀 开始同步 Steam 数据...");
    console.log();

    const steamId = credential.metadata?.steamId || process.env.STEAM_USER_ID;

    if (!steamId) {
      console.error("❌ Steam ID 未找到");
      process.exit(1);
    }

    const syncService = getGamingSyncService();
    const startTime = Date.now();

    const result = await syncService.syncSteamData(steamId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log();
    console.log("=".repeat(60));
    console.log("📊 同步结果");
    console.log("=".repeat(60));
    console.log();

    if (result.success) {
      console.log("✅ 同步成功！");
      console.log(`⏱️  用时: ${duration} 秒`);

      if (result.gamesCount !== undefined) {
        console.log(`🎮 同步游戏数: ${result.gamesCount}`);
      }
      if (result.sessionsCount !== undefined) {
        console.log(`📝 游戏会话数: ${result.sessionsCount}`);
      }
      if (result.achievementsCount !== undefined) {
        console.log(`🏆 成就数: ${result.achievementsCount}`);
      }

      // Update credential usage
      await prisma.externalCredential.update({
        where: { id: credential.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          failureCount: 0,
        },
      });

      console.log();
      console.log("🎯 访问以下页面查看数据：");
      console.log("   http://localhost:3000/about/live/gaming");
      console.log("   http://localhost:3000/admin/credentials");
      console.log();
    } else {
      console.log("❌ 同步失败");
      console.log(`⏱️  用时: ${duration} 秒`);

      if (result.error) {
        console.log();
        console.log("错误信息:");
        console.log(result.error);
      }

      // Update failure count
      await prisma.externalCredential.update({
        where: { id: credential.id },
        data: {
          failureCount: { increment: 1 },
        },
      });
    }

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
    await prisma.$disconnect();
  }
}

main();
