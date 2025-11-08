import { beforeAll, afterAll, beforeEach } from "vitest";
import { cleanDatabase, closeDatabase } from "./test-db";

// 全局测试环境设置
beforeAll(async () => {
  // 验证测试数据库配置
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("❌ DATABASE_URL or TEST_DATABASE_URL not configured!");
  }

  // 严格验证：必须是测试数据库
  if (!dbUrl.includes("test") && !dbUrl.includes("TEST")) {
    console.error("🚨 数据库保护: 禁止在非测试数据库上运行集成测试！");
    console.error(`🚨 当前数据库: ${dbUrl.replace(/:[^:]*@/, ":***@")}`);
    console.error("🚨 解决方案:");
    console.error("   1. 设置 TEST_DATABASE_URL 环境变量，数据库名必须包含 'test'");
    console.error("   2. 或在 .env.test 中配置测试数据库");
    console.error("   3. 示例: TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/tdp_test");
    throw new Error("数据库保护: 禁止在非测试数据库上运行集成测试");
  }

  console.log("🧪 Setting up integration test environment...");
  console.log(`📊 Database: ${dbUrl.replace(/:[^:]*@/, ":***@")}`); // 隐藏密码
});

// 每个测试前清理数据库
beforeEach(async () => {
  await cleanDatabase();
});

// 全局测试清理
afterAll(async () => {
  console.log("🧹 Cleaning up integration test environment...");
  await cleanDatabase();
  await closeDatabase();
});
