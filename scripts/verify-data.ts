/**
 * 验证数据库中的 Steam 数据
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log("=".repeat(60));
    console.log("🔍 验证数据库中的 Steam 数据");
    console.log("=".repeat(60));
    console.log();

    // 查询 Steam 个人资料
    const profiles = await prisma.steamProfile.findMany();
    console.log(`📋 SteamProfile 表: ${profiles.length} 条记录`);
    if (profiles.length > 0) {
      console.log(`   └─ 用户: ${profiles[0].personaName} (Steam ID: ${profiles[0].steamId})`);
    }
    console.log();

    // 查询游戏
    const games = await prisma.game.findMany({
      where: { platform: "STEAM" },
    });
    console.log(`🎮 Game 表 (Steam): ${games.length} 条记录`);
    if (games.length > 0) {
      console.log(`   前 3 款游戏:`);
      games.slice(0, 3).forEach((game) => {
        console.log(`   └─ ${game.name || game.nameZh}`);
      });
    }
    console.log();

    // 查询游戏会话
    const sessions = await prisma.gameSession.findMany({
      where: { platform: "STEAM" },
      include: { game: true },
    });
    console.log(`📝 GameSession 表 (Steam): ${sessions.length} 条记录`);
    if (sessions.length > 0) {
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);
      console.log(`   └─ 总游戏时长: ${totalHours} 小时`);
    }
    console.log();

    // 查询成就
    const achievements = await prisma.gameAchievement.findMany();
    console.log(`🏆 GameAchievement 表: ${achievements.length} 条记录`);
    if (achievements.length > 0) {
      const unlocked = achievements.filter((a) => a.isUnlocked).length;
      console.log(`   └─ 已解锁: ${unlocked} / ${achievements.length}`);
    }
    console.log();

    // 查询同步日志
    const logs = await prisma.gamingSyncLog.findMany({
      orderBy: { syncedAt: "desc" },
      take: 5,
    });
    console.log(`📊 GamingSyncLog 表: ${logs.length} 条最近记录`);
    if (logs.length > 0) {
      logs.forEach((log) => {
        const status = log.status === "SUCCESS" ? "✅" : "❌";
        const duration = log.duration ? `(${(log.duration / 1000).toFixed(1)}s)` : "";
        console.log(
          `   ${status} ${log.platform} - ${log.syncedAt.toLocaleString("zh-CN")} ${duration}`
        );
      });
    }
    console.log();

    console.log("=".repeat(60));
    console.log("✅ 数据验证完成");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ 验证失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
