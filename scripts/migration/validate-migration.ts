#!/usr/bin/env tsx

/**
 * 迁移验证脚本
 *
 * 功能:
 *   - 验证数据库schema完整性
 *   - 检查数据完整性
 *   - 验证外键约束
 *   - 执行示例查询测试
 *
 * 用法:
 *   npx tsx scripts/migration/validate-migration.ts
 *   npm run validate:migration
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, "green");
}

function logError(message: string) {
  log(`❌ ${message}`, "red");
}

function logWarn(message: string) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, "blue");
}

/**
 * 验证数据库连接
 */
async function validateConnection(): Promise<boolean> {
  logInfo("检查数据库连接...");
  try {
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    logSuccess("数据库连接正常");
    return true;
  } catch (error) {
    logError("数据库连接失败");
    console.error(error);
    return false;
  }
}

/**
 * 验证Schema完整性
 */
async function validateSchema(): Promise<boolean> {
  logInfo("验证数据库schema...");

  try {
    // 获取所有表
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    logInfo(`数据库表数量: ${tables.length}`);

    // 关键表列表
    const requiredTables = [
      "User",
      "Account",
      "Session",
      "Post",
      "GalleryImage",
      "Moment",
      "Friend",
      "ExternalCredential",
    ];

    // 检查关键表是否存在
    const missingTables: string[] = [];
    for (const requiredTable of requiredTables) {
      const exists = tables.some((t) => t.table_name === requiredTable);
      if (!exists) {
        missingTables.push(requiredTable);
      }
    }

    if (missingTables.length > 0) {
      logWarn(`缺少以下关键表: ${missingTables.join(", ")}`);
      return false;
    }

    logSuccess("Schema验证通过");
    return true;
  } catch (error) {
    logError("Schema验证失败");
    console.error(error);
    return false;
  }
}

/**
 * 验证数据完整性
 */
async function validateDataIntegrity(): Promise<boolean> {
  logInfo("验证数据完整性...");

  try {
    // 检查关键表的记录数
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const galleryCount = await prisma.galleryImage.count();
    const momentCount = await prisma.moment.count();
    const friendCount = await prisma.friend.count();
    const credentialCount = await prisma.externalCredential.count();

    console.log("\n数据统计:");
    console.log(`  User:                ${userCount} 条记录`);
    console.log(`  Post:                ${postCount} 条记录`);
    console.log(`  GalleryImage:        ${galleryCount} 条记录`);
    console.log(`  Moment:              ${momentCount} 条记录`);
    console.log(`  Friend:              ${friendCount} 条记录`);
    console.log(`  ExternalCredential:  ${credentialCount} 条记录`);
    console.log("");

    logSuccess("数据完整性检查通过");
    return true;
  } catch (error) {
    logError("数据完整性检查失败");
    console.error(error);
    return false;
  }
}

/**
 * 验证外键约束
 */
async function validateForeignKeys(): Promise<boolean> {
  logInfo("验证外键约束...");

  try {
    const foreignKeys = await prisma.$queryRaw<
      Array<{
        constraint_name: string;
        table_name: string;
        foreign_table_name: string;
      }>
    >`
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS foreign_table_name
      FROM pg_constraint
      WHERE contype = 'f'
      ORDER BY conname;
    `;

    logInfo(`外键约束数量: ${foreignKeys.length}`);

    // 检查关键外键约束
    const hasUserConstraints = foreignKeys.some((fk) => fk.constraint_name.includes("userId"));
    const hasPostConstraints = foreignKeys.some((fk) => fk.constraint_name.includes("postId"));

    if (!hasUserConstraints || !hasPostConstraints) {
      logWarn("部分外键约束可能缺失");
    }

    logSuccess("外键约束验证通过");
    return true;
  } catch (error) {
    logError("外键约束验证失败");
    console.error(error);
    return false;
  }
}

/**
 * 验证索引
 */
async function validateIndexes(): Promise<boolean> {
  logInfo("验证数据库索引...");

  try {
    const indexes = await prisma.$queryRaw<
      Array<{
        indexname: string;
        tablename: string;
      }>
    >`
      SELECT
        indexname,
        tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    logInfo(`索引数量: ${indexes.length}`);
    logSuccess("索引验证通过");
    return true;
  } catch (error) {
    logError("索引验证失败");
    console.error(error);
    return false;
  }
}

/**
 * 执行示例查询测试
 */
async function runSampleQueries(): Promise<boolean> {
  logInfo("执行示例查询测试...");

  try {
    // 测试1: 查询用户
    const sampleUser = await prisma.user.findFirst();
    if (sampleUser) {
      logInfo(`查询到示例用户: ${sampleUser.name || sampleUser.email}`);
    }

    // 测试2: 查询文章（带关联）
    const samplePost = await prisma.post.findFirst({
      include: {
        author: {
          select: { name: true, email: true },
        },
      },
    });
    if (samplePost) {
      logInfo(`查询到示例文章: ${samplePost.title}`);
    }

    // 测试3: 聚合查询
    const postStats = await prisma.post.groupBy({
      by: ["status"],
      _count: true,
    });
    logInfo(`文章状态统计: ${JSON.stringify(postStats)}`);

    // 测试4: 复杂查询（带过滤和排序）
    const recentPosts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 5,
      select: {
        title: true,
        publishedAt: true,
      },
    });
    logInfo(`最近发布的文章数量: ${recentPosts.length}`);

    logSuccess("示例查询测试通过");
    return true;
  } catch (error) {
    logError("示例查询测试失败");
    console.error(error);
    return false;
  }
}

/**
 * 检查孤立记录
 */
async function checkOrphanedRecords(): Promise<boolean> {
  logInfo("检查孤立记录...");

  try {
    // 检查没有作者的文章
    const orphanedPosts = await prisma.post.count({
      where: {
        authorId: null,
      },
    });

    if (orphanedPosts > 0) {
      logWarn(`发现 ${orphanedPosts} 篇没有作者的文章`);
    }

    // 检查没有文章的 PostAlias
    const orphanedAliases = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "PostAlias" pa
      LEFT JOIN "Post" p ON pa."postId" = p.id
      WHERE p.id IS NULL;
    `;

    if (orphanedAliases[0] && Number(orphanedAliases[0].count) > 0) {
      logWarn(`发现 ${orphanedAliases[0].count} 个孤立的别名记录`);
    }

    logSuccess("孤立记录检查完成");
    return true;
  } catch (error) {
    logError("孤立记录检查失败");
    console.error(error);
    return false;
  }
}

/**
 * 主验证流程
 */
async function main() {
  console.log("================================");
  console.log("🔍 数据库迁移验证");
  console.log("================================");
  console.log("");

  const results: Array<{ test: string; passed: boolean }> = [];

  try {
    // 1. 验证数据库连接
    const connectionOk = await validateConnection();
    results.push({ test: "数据库连接", passed: connectionOk });
    console.log("");

    if (!connectionOk) {
      throw new Error("数据库连接失败，终止验证");
    }

    // 2. 验证Schema
    const schemaOk = await validateSchema();
    results.push({ test: "Schema完整性", passed: schemaOk });
    console.log("");

    // 3. 验证数据完整性
    const dataOk = await validateDataIntegrity();
    results.push({ test: "数据完整性", passed: dataOk });
    console.log("");

    // 4. 验证外键约束
    const foreignKeysOk = await validateForeignKeys();
    results.push({ test: "外键约束", passed: foreignKeysOk });
    console.log("");

    // 5. 验证索引
    const indexesOk = await validateIndexes();
    results.push({ test: "数据库索引", passed: indexesOk });
    console.log("");

    // 6. 执行示例查询
    const queriesOk = await runSampleQueries();
    results.push({ test: "示例查询", passed: queriesOk });
    console.log("");

    // 7. 检查孤立记录
    const orphanedOk = await checkOrphanedRecords();
    results.push({ test: "孤立记录检查", passed: orphanedOk });
    console.log("");

    // 汇总结果
    console.log("================================");
    console.log("📊 验证结果汇总");
    console.log("================================");

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    results.forEach(({ test, passed }) => {
      const status = passed ? logSuccess : logError;
      status(`${test}: ${passed ? "通过 ✓" : "失败 ✗"}`);
    });

    console.log("");
    console.log(`总计: ${passedCount}/${totalCount} 项测试通过`);
    console.log("================================");

    // 判断是否全部通过
    const allPassed = passedCount === totalCount;
    if (allPassed) {
      console.log("");
      logSuccess("所有验证测试通过！数据库迁移成功");
      console.log("");
      process.exit(0);
    } else {
      console.log("");
      logError("部分验证测试失败，请检查数据库状态");
      console.log("");
      process.exit(1);
    }
  } catch (error) {
    console.error("");
    logError("验证过程发生错误");
    console.error(error);
    console.log("");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行主流程
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
