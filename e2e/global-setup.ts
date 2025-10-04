import { chromium, FullConfig } from "@playwright/test";
import { seedTestData } from "./fixtures/test-data";

async function globalSetup(config: FullConfig) {
  console.log("\n🚀 Running global E2E setup...\n");

  try {
    // 1. Seed deterministic test data
    await seedTestData();

    // 2. 预热应用 (可选，确保服务器已启动)
    console.log("\n🔥 Warming up application...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const baseURL = config.use?.baseURL || "http://localhost:3000";
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60000 });

    await browser.close();
    console.log("✅ Application warmed up");

    console.log("\n✅ Global setup complete\n");
  } catch (error) {
    console.error("\n❌ Global setup failed:", error);
    throw error;
  }
}

export default globalSetup;
