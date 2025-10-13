#!/usr/bin/env tsx
/**
 * 认证状态保存脚本
 *
 * 用途：手动登录一次，保存浏览器状态供后续自动化使用
 *
 * 使用方法：
 *   npm run save-auth
 *
 * 或直接运行：
 *   npx tsx scripts/save-auth.ts
 */

import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const STATE_FILE = path.join(process.cwd(), ".auth", "state.json");
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function saveAuthState() {
  console.log("\n🚀 启动认证保存流程...\n");
  console.log("📋 说明：");
  console.log("   1. 浏览器将自动打开");
  console.log("   2. 请手动完成 Google 登录");
  console.log("   3. 登录成功后，在终端按 Enter 键");
  console.log("   4. 脚本将自动保存登录状态\n");

  const browser = await chromium.launch({
    headless: false, // 可见模式，方便手动登录
    slowMo: 100, // 稍微放慢操作，便于观察
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    // 导航到首页
    console.log(`📍 导航到 ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // 等待页面加载并点击登录按钮
    console.log("🔍 查找登录按钮...");

    // 尝试多个可能的登录按钮选择器
    const loginSelectors = [
      "text=Sign in",
      "text=登录",
      'a[href*="signin"]',
      'button:has-text("Sign in")',
      'button:has-text("登录")',
    ];

    let loginButtonFound = false;
    for (const selector of loginSelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`✅ 找到登录按钮: ${selector}`);
          await button.click();
          loginButtonFound = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!loginButtonFound) {
      console.log("⚠️  未找到登录按钮，请手动点击登录");
    }

    // 等待用户完成登录
    console.log("\n⏳ 请在浏览器中完成 Google 登录...");
    console.log("   登录成功后，请返回终端并按 Enter 键继续\n");

    // 暂停等待用户输入
    await new Promise<void>((resolve) => {
      process.stdin.once("data", () => {
        resolve();
      });
    });

    // 验证登录状态
    console.log("\n🔍 验证登录状态...");
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // 检查是否有管理员菜单或用户信息
    const isLoggedIn = await page.evaluate(() => {
      // 检查是否有用户相关的元素
      const hasUserMenu = document.querySelector('[data-testid="user-menu"]') !== null;
      const hasAdminLink = document.querySelector('a[href*="admin"]') !== null;
      const hasSignOut =
        document.querySelector("text=Sign out") !== null ||
        document.querySelector("text=登出") !== null;
      return hasUserMenu || hasAdminLink || hasSignOut;
    });

    if (!isLoggedIn) {
      console.log("⚠️  警告：未检测到登录状态，但仍将保存当前浏览器状态");
    } else {
      console.log("✅ 登录状态验证成功！");
    }

    // 保存浏览器状态
    console.log("\n💾 保存认证状态...");
    await context.storageState({ path: STATE_FILE });

    console.log(`✅ 认证状态已保存到: ${STATE_FILE}`);
    console.log("\n🎉 完成！现在可以运行自动化脚本了：");
    console.log("   npm run auto-publish\n");
  } catch (error) {
    console.error("\n❌ 保存认证状态失败:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 主函数
(async () => {
  try {
    // 确保 .auth 目录存在
    const authDir = path.dirname(STATE_FILE);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    await saveAuthState();
    process.exit(0);
  } catch (error) {
    console.error("脚本执行失败:", error);
    process.exit(1);
  }
})();
