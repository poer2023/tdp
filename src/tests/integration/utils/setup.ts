import { beforeAll, afterAll, beforeEach } from "vitest";
import { cleanDatabase, closeDatabase } from "./test-db";

// 全局测试环境设置
beforeAll(async () => {
  // 验证测试数据库配置
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("❌ DATABASE_URL or TEST_DATABASE_URL not configured!");
  }

  // 警告：如果使用生产数据库
  if (!dbUrl.includes("test") && !dbUrl.includes("localhost")) {
    console.warn("⚠️  WARNING: Running integration tests without 'test' in DATABASE_URL!");
    console.warn("⚠️  Make sure you're not using production database!");
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
