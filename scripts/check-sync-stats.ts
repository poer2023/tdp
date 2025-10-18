#!/usr/bin/env tsx
import { prisma } from "../src/lib/prisma";

async function checkStats() {
  console.log("\n📊 数据库统计:\n");

  const stats = await prisma.mediaWatch.groupBy({
    by: ["platform"],
    _count: true,
  });

  stats.forEach((s) => {
    console.log(`  ${s.platform}: ${s._count} 条记录`);
  });

  const total = await prisma.mediaWatch.count();
  console.log(`\n  总计: ${total} 条记录\n`);

  // 最新记录
  const recent = await prisma.mediaWatch.findMany({
    orderBy: { watchedAt: "desc" },
    take: 5,
    select: { platform, title, watchedAt: true },
  });

  console.log("📋 最近观看 (前5条):\n");
  recent.forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.platform}] ${item.title}`);
    console.log(`     观看时间: ${item.watchedAt.toLocaleDateString("zh-CN")}\n`);
  });

  await prisma.$disconnect();
}

checkStats();
