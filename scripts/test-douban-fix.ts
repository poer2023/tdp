/**
 * Test script for Douban credential validation and sync fixes
 * Tests the compatibility fix for user_id vs userId field naming
 */

import { PrismaClient } from "@prisma/client";
import { validateCredential } from "../src/lib/credential-validation";

const prisma = new PrismaClient();

async function testDoubanCredential() {
  console.log("🧪 测试豆瓣凭据验证和同步修复...\n");

  try {
    // 1. 获取豆瓣凭据
    const credential = await prisma.externalCredential.findFirst({
      where: { platform: "DOUBAN" },
    });

    if (!credential) {
      console.error("❌ 未找到豆瓣凭据");
      return;
    }

    console.log("📋 豆瓣凭据信息:");
    console.log(`   ID: ${credential.id}`);
    console.log(`   平台: ${credential.platform}`);
    console.log(`   类型: ${credential.type}`);
    console.log(`   Metadata:`, credential.metadata);
    console.log("");

    // 2. 测试字段名兼容性修复
    const metadata = credential.metadata as { userId?: string; user_id?: string };
    const userId = metadata.userId || metadata.user_id;

    if (userId) {
      console.log(`✅ 字段名兼容性测试通过: userId = ${userId}`);
    } else {
      console.error("❌ 字段名兼容性测试失败: 无法获取 userId");
    }
    console.log("");

    // 3. 验证凭据
    console.log("🔍 开始验证豆瓣凭据...");
    const validationResult = await validateCredential(
      credential.platform,
      credential.type,
      credential.value
    );

    console.log("验证结果:");
    if (validationResult.isValid) {
      console.log(`   ✅ 凭据有效`);
    } else {
      console.log(`   ❌ 凭据无效`);
    }
    console.log(`   消息: ${validationResult.message || validationResult.error}`);
    if (validationResult.metadata) {
      console.log(`   元数据:`, validationResult.metadata);
    }
    console.log("");

    // 4. 测试同步配置
    if (userId) {
      console.log("✅ 同步配置检查通过:");
      console.log(`   用户 ID: ${userId}`);
      console.log(`   Cookie 长度: ${credential.value.length} 字符`);
      console.log(
        `   Cookie 包含必需字段: ${credential.value.includes("bid=") || credential.value.includes("dbcl2=") ? "✅" : "❌"}`
      );
    } else {
      console.error("❌ 同步配置检查失败: 无法获取用户 ID");
    }
    console.log("");

    console.log("🎉 测试完成！");
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDoubanCredential();
