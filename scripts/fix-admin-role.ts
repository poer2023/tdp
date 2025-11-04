import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * 修复管理员角色和邮箱验证状态
 *
 * 功能：
 * 1. 从 ADMIN_EMAILS 环境变量读取管理员邮箱列表
 * 2. 更新所有管理员用户的 role 为 ADMIN
 * 3. 同时设置 emailVerified 为当前时间（确保邮箱已验证）
 * 4. 清除所有 Session，强制用户重新登录以刷新 JWT token
 *
 * 使用场景：
 * - 生产环境 admin 用户无法访问 /admin 页面（403 错误）
 * - JWT token 中的 role 字段不正确
 * - 手动修改数据库后需要刷新 Session
 */
async function fixAdminRole() {
  console.log("🔧 开始修复管理员角色...\n");

  // 1. 读取环境变量中的管理员邮箱列表
  const adminEmailsStr = process.env.ADMIN_EMAILS || "";
  if (!adminEmailsStr) {
    console.error("❌ 错误：ADMIN_EMAILS 环境变量未设置");
    console.error("请在 .env 文件中设置：ADMIN_EMAILS=your-email@example.com");
    process.exit(1);
  }

  const adminEmails = adminEmailsStr
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => email.toLowerCase());

  console.log("📧 管理员邮箱列表：", adminEmails.join(", "));
  console.log("");

  // 2. 更新所有管理员用户的角色和邮箱验证状态
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const email of adminEmails) {
    try {
      // 检查用户是否存在
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, emailVerified: true },
      });

      if (!existingUser) {
        console.log(`⚠️  用户不存在：${email}`);
        notFoundCount++;
        continue;
      }

      // 更新用户角色和邮箱验证状态
      const result = await prisma.user.update({
        where: { email },
        data: {
          role: UserRole.ADMIN,
          emailVerified: new Date(), // 设置为当前时间
        },
      });

      console.log(`✅ 已更新：${email}`);
      console.log(`   - ID: ${result.id}`);
      console.log(`   - 角色：${existingUser.role} → ${result.role}`);
      console.log(
        `   - 邮箱验证：${existingUser.emailVerified ? "已验证" : "未验证"} → 已验证`
      );
      console.log("");

      updatedCount++;
    } catch (error) {
      console.error(`❌ 更新失败：${email}`);
      console.error(`   错误：${error instanceof Error ? error.message : String(error)}`);
      console.log("");
    }
  }

  // 3. 清除所有 Session，强制用户重新登录
  console.log("🧹 清除所有 Session（强制重新登录）...");
  try {
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ 已清除 ${deletedSessions.count} 个 Session`);
    console.log("");
  } catch (error) {
    console.error(`❌ 清除 Session 失败：${error instanceof Error ? error.message : String(error)}`);
    console.log("");
  }

  // 4. 显示修复结果摘要
  console.log("📊 修复结果摘要：");
  console.log(`   - 成功更新：${updatedCount} 个用户`);
  console.log(`   - 用户不存在：${notFoundCount} 个`);
  console.log("");

  if (updatedCount > 0) {
    console.log("✅ 管理员角色修复完成！");
    console.log("");
    console.log("📝 后续步骤：");
    console.log("   1. 清除浏览器 Cookie（或使用无痕模式）");
    console.log("   2. 重新登录管理员账号");
    console.log("   3. 访问 /admin 页面验证是否可以正常访问");
  } else {
    console.log("⚠️  没有用户被更新");
    console.log("请检查 ADMIN_EMAILS 环境变量中的邮箱是否已注册");
  }
}

// 执行修复
fixAdminRole()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 修复过程中发生错误：", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
