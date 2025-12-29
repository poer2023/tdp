/**
 * Steam 数据同步测试脚本
 *
 * 使用方法：
 * npx ts-node scripts/test-steam-sync.ts
 */

import { getGamingSyncService } from "../src/lib/gaming/sync-service";

async function testSteamSync() {
  console.log("=".repeat(60));
  console.log("🎮 开始测试 Steam 数据同步");
  console.log("=".repeat(60));
  console.log();

  try {
    // 检查环境变量
    const steamApiKey = process.env.STEAM_API_KEY;
    const steamUserId = process.env.STEAM_USER_ID;

    if (!steamApiKey || !steamUserId) {
      console.error("❌ 错误：缺少必要的环境变量");
      console.error("   请确保 .env 文件中配置了：");
      console.error("   - STEAM_API_KEY");
      console.error("   - STEAM_USER_ID");
      process.exit(1);
    }

    console.log("✅ 环境变量检查通过");
    console.log(`   Steam API Key: ${steamApiKey.substring(0, 8)}...`);
    console.log(`   Steam User ID: ${steamUserId}`);
    console.log();

    // 获取同步服务
    const syncService = getGamingSyncService();

    console.log("🚀 开始同步 Steam 数据...");
    console.log();

    const startTime = Date.now();

    // 执行同步
    const result = await syncService.syncSteamData(steamUserId);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log();
    console.log("=".repeat(60));
    console.log("📊 同步结果");
    console.log("=".repeat(60));
    console.log();

    if (result.success) {
      console.log("✅ 同步成功！");
      console.log(`⏱️  用时: ${duration} 秒`);
      if (result.syncedAt) {
        console.log(`📅 同步时间: ${result.syncedAt.toLocaleString("zh-CN")}`);
      }

      if (result.gamesCount !== undefined) {
        console.log(`🎮 同步游戏数: ${result.gamesCount}`);
      }
      if (result.sessionsCount !== undefined) {
        console.log(`📝 游戏会话数: ${result.sessionsCount}`);
      }
      if (result.achievementsCount !== undefined) {
        console.log(`🏆 成就数: ${result.achievementsCount}`);
      }

      console.log();
      console.log("🔍 你可以通过以下方式查看数据：");
      console.log("   1. 访问: http://localhost:3000/about/gaming");
      console.log(
        "   2. 查询数据库: npx prisma studio (然后查看 Game, GameSession, SteamProfile 表)"
      );
    } else {
      console.log("❌ 同步失败");
      console.log(`⏱️  用时: ${duration} 秒`);

      if (result.error) {
        console.log();
        console.log("错误信息:");
        console.log(result.error);
      }

      console.log();
      console.log("💡 故障排除建议：");
      console.log("   1. 确认 Steam API Key 是否正确 (https://steamcommunity.com/dev/apikey)");
      console.log("   2. 确认 Steam ID (64位) 是否正确 (https://steamid.io/)");
      console.log("   3. 确认 Steam 个人资料设置为公开（个人资料 → 隐私设置 → 公开）");
      console.log("   4. 检查网络连接和 Steam API 状态");
    }

    console.log();
    console.log("=".repeat(60));
  } catch (error) {
    console.error();
    console.error("=".repeat(60));
    console.error("❌ 发生错误");
    console.error("=".repeat(60));
    console.error();

    if (error instanceof Error) {
      console.error("错误类型:", error.name);
      console.error("错误信息:", error.message);
      if (error.stack) {
        console.error();
        console.error("调用栈:");
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }

    console.error();
    console.error("=".repeat(60));
    process.exit(1);
  }
}

// 运行测试
testSteamSync().catch((error) => {
  console.error("未捕获的错误:", error);
  process.exit(1);
});
