import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始数据库初始化...");

  // 1. 创建管理员用户
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()) || [];

  if (adminEmails.length === 0) {
    console.log("⚠️  警告: ADMIN_EMAILS 未配置,跳过管理员用户创建");
  } else {
    for (const email of adminEmails) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log(`✓ 管理员用户已存在: ${email}`);

        // 确保角色是 ADMIN
        if (existingUser.role !== UserRole.ADMIN) {
          await prisma.user.update({
            where: { email },
            data: { role: UserRole.ADMIN },
          });
          console.log(`  ↳ 已更新为管理员角色`);
        }
      } else {
        await prisma.user.create({
          data: {
            email,
            name: email.split("@")[0], // 使用邮箱前缀作为名称
            role: UserRole.ADMIN,
            emailVerified: new Date(), // 自动验证
          },
        });
        console.log(`✓ 已创建管理员用户: ${email}`);
      }
    }
  }

  // 2. 创建示例文章 (仅在开发环境)
  if (process.env.NODE_ENV !== "production") {
    const adminUser = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (adminUser) {
      const existingPost = await prisma.post.findFirst({
        where: { slug: "welcome" },
      });

      if (!existingPost) {
        await prisma.post.create({
          data: {
            title: "欢迎使用 TDP",
            slug: "welcome",
            excerpt: "这是一篇示例文章,用于测试博客功能",
            content: `# 欢迎使用 TDP

这是一篇示例文章,展示了 TDP 博客的基本功能。

## 功能特性

- ✅ Markdown 支持
- ✅ 代码高亮
- ✅ 图片上传
- ✅ 标签管理
- ✅ 多语言支持

## 开始使用

1. 访问 \`/admin\` 进入管理后台
2. 创建新文章
3. 上传图片到相册
4. 配置第三方平台同步

祝你使用愉快! 🎉`,
            status: "PUBLISHED",
            publishedAt: new Date(),
            locale: "ZH",
            authorId: adminUser.id,
            tags: "welcome,tutorial",
          },
        });
        console.log("✓ 已创建示例文章");
      } else {
        console.log("✓ 示例文章已存在");
      }
    }
  }

  console.log("🎉 数据库初始化完成!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 数据库初始化失败:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
