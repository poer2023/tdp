import { FullConfig } from "@playwright/test";
import { cleanupTestData } from "./fixtures/test-data";

async function globalTeardown(config: FullConfig) {
  console.log("\n🧹 Running global E2E teardown...");

  try {
    const skipDb = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";
    if (!skipDb) {
      // Cleanup test data
      await cleanupTestData();
    } else {
      console.log("Skipping DB cleanup (E2E_SKIP_DB=1)");
    }

    console.log("✅ Global teardown complete\n");
  } catch (error) {
    console.error("\n❌ Global teardown failed:", error);
    // 不抛出错误，避免影响测试结果报告
  }
}

export default globalTeardown;
