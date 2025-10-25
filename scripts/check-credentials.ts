/**
 * 凭据数据诊断脚本
 * 检查数据库中的 ExternalCredential 数据
 */

import prisma from "../src/lib/prisma";

async function checkCredentials() {
  console.log("🔍 开始检查数据库中的凭据数据...\n");

  try {
    // 获取所有凭据
    const credentials = await prisma.externalCredential.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`📊 总共找到 ${credentials.length} 条凭据记录\n`);

    if (credentials.length === 0) {
      console.log("⚠️  数据库中没有任何凭据记录!");
      console.log("   可能原因:");
      console.log("   1. 凭据从未被创建");
      console.log("   2. 凭据被删除了");
      console.log("   3. 数据库迁移丢失了数据\n");
      return;
    }

    // 按平台统计
    const platformStats = credentials.reduce(
      (acc, cred) => {
        acc[cred.platform] = (acc[cred.platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📈 按平台统计:");
    Object.entries(platformStats).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} 条`);
    });
    console.log("");

    // 按状态统计
    const validCount = credentials.filter((c) => c.isValid).length;
    const invalidCount = credentials.filter((c) => !c.isValid).length;

    console.log("✅ 有效凭据: ", validCount);
    console.log("❌ 无效凭据: ", invalidCount);
    console.log("");

    // 显示每条凭据的详细信息（不显示敏感值）
    console.log("📋 凭据详细信息:");
    console.log("─".repeat(100));

    credentials.forEach((cred, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`  平台 (Platform):     ${cred.platform}`);
      console.log(`  类型 (Type):         ${cred.type}`);
      console.log(`  状态 (Valid):        ${cred.isValid ? "✅ 有效" : "❌ 无效"}`);
      console.log(`  创建时间:            ${cred.createdAt.toLocaleString("zh-CN")}`);
      console.log(`  更新时间:            ${cred.updatedAt.toLocaleString("zh-CN")}`);
      console.log(
        `  上次验证:            ${cred.lastValidatedAt ? cred.lastValidatedAt.toLocaleString("zh-CN") : "从未验证"}`
      );
      console.log(`  失败次数:            ${cred.failureCount}`);
      console.log(`  使用次数:            ${cred.usageCount}`);
      console.log(
        `  上次使用:            ${cred.lastUsedAt ? cred.lastUsedAt.toLocaleString("zh-CN") : "从未使用"}`
      );
      console.log(`  自动同步:            ${cred.autoSync ? "✅ 是" : "❌ 否"}`);
      console.log(`  同步频率:            ${cred.syncFrequency || "未设置"}`);
      console.log(
        `  下次检查:            ${cred.nextCheckAt ? cred.nextCheckAt.toLocaleString("zh-CN") : "未设置"}`
      );

      if (cred.lastError) {
        console.log(`  ⚠️  最后错误:        ${cred.lastError}`);
      }

      if (cred.metadata) {
        console.log(
          `  元数据:              ${JSON.stringify(cred.metadata, null, 2).split("\n").join("\n                       ")}`
        );
      }

      // 检查加密值格式（不解密）
      const valuePreview = cred.value.substring(0, 50) + "...";
      const isEncryptedFormat = cred.value.split(":").length === 3;
      console.log(
        `  值格式:              ${isEncryptedFormat ? "✅ 加密格式正确" : "❌ 格式异常"}`
      );
      console.log(`  值预览:              ${valuePreview}`);
    });

    console.log("\n" + "─".repeat(100));
    console.log("\n✅ 检查完成!");

    // 检查环境变量
    console.log("\n🔐 检查加密密钥配置:");
    if (process.env.CREDENTIAL_ENCRYPTION_KEY) {
      const keyLength = process.env.CREDENTIAL_ENCRYPTION_KEY.length;
      console.log(`   ✅ CREDENTIAL_ENCRYPTION_KEY 已配置 (长度: ${keyLength})`);
      if (keyLength === 64) {
        console.log(`   ✅ 密钥长度正确 (64位十六进制 = 32字节)`);
      } else {
        console.log(`   ⚠️  密钥长度不正确! 应该是 64 个字符,当前是 ${keyLength}`);
      }
    } else {
      console.log("   ❌ CREDENTIAL_ENCRYPTION_KEY 未配置!");
      console.log("   ⚠️  这会导致凭据无法解密,虽然数据库有数据但无法使用!");
      console.log("   💡 解决方法: 运行 node scripts/generate-encryption-key.ts 生成密钥");
    }
  } catch (error) {
    console.error("❌ 检查失败:", error);
    if (error instanceof Error) {
      console.error("   错误详情:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkCredentials();
