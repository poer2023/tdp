import { chromium, FullConfig } from "@playwright/test";
import { seedTestData } from "./fixtures/test-data";

async function globalSetup(config: FullConfig) {
  console.log("\n🚀 Running global E2E setup...\n");

  try {
    const skipDb = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";
    // 1. Seed deterministic test data (unless skipped)
    if (!skipDb) {
      await seedTestData();
    } else {
      console.log("Skipping DB seeding (E2E_SKIP_DB=1)");
    }

    // 2. 预热应用 (可选，确保服务器已启动)
    console.log("\n🔥 Warming up application...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const baseURL = config.use?.baseURL || "http://localhost:3000";
    try {
      await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60000 });
      console.log("✅ Application warmed up");
    } catch (err) {
      console.log(
        `⚠️  Warm-up skipped. Server not reachable at ${baseURL} yet; webServer will start it.`
      );
    }
    await browser.close();

    console.log("\n✅ Global setup complete\n");
  } catch (error) {
    console.error("\n❌ Global setup failed:", error);
    throw error;
  }
}

export default globalSetup;
