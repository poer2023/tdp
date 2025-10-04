import { FullConfig } from "@playwright/test";
import { cleanupTestData } from "./fixtures/test-data";

async function globalTeardown(config: FullConfig) {
  console.log("\n🧹 Running global E2E teardown...");

  try {
    // Cleanup test data
    await cleanupTestData();

    console.log("✅ Global teardown complete\n");
  } catch (error) {
    console.error("\n❌ Global teardown failed:", error);
    // 不抛出错误，避免影响测试结果报告
  }
}

export default globalTeardown;
