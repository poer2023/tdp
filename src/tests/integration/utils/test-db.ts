import { PrismaClient, UserRole } from "@prisma/client";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// 🔒 安全检查: 强制验证测试数据库
function validateTestDatabaseUrl(url: string | undefined): void {
  if (!url) {
    throw new Error(
      "🚨 数据库保护: 未配置数据库URL\n" + "请设置 TEST_DATABASE_URL 或 DATABASE_URL 环境变量"
    );
  }

  // 检查URL是否包含测试标识
  const isTestDatabase =
    url.includes("test") || url.includes("TEST") || url.includes("_test") || url.includes("-test");

  // 如果不是测试数据库，拒绝执行
  if (!isTestDatabase) {
    throw new Error(
      "🚨 数据库保护: 禁止在非测试数据库上运行集成测试！\n\n" +
      "当前数据库URL: " +
      url.replace(/:[^:@]+@/, ":***@") +
      "\n\n" +
      "解决方案:\n" +
      '1. 使用独立的测试数据库，URL必须包含 "test" 关键字\n' +
      '2. 在 .env.test 文件中配置: TEST_DATABASE_URL="postgresql://...test..."\n' +
      "3. 或者在数据库名称中添加 test 标识: database_name_test\n\n" +
      "⚠️  集成测试会清空数据库所有数据！\n" +
      "⚠️  绝不能在生产或开发数据库上运行！"
    );
  }
}

// 执行安全检查
validateTestDatabaseUrl(TEST_DATABASE_URL);

let prisma: PrismaClient;

/**
 * 获取测试数据库连接
 * Get test database connection
 */
export function getTestDb(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

/**
 * 清理所有测试数据
 * Clean all test data
 */
export async function cleanDatabase() {
  const db = getTestDb();

  // 按照依赖顺序删除
  await db.reaction.deleteMany({});
  await db.reactionAggregate.deleteMany({});
  await db.postAlias.deleteMany({});
  await db.post.deleteMany({});
  await db.galleryImage.deleteMany({});
  await db.moment.deleteMany({});
  await db.rateLimitHit.deleteMany({});
  // Analytics tables removed - using Cloudflare Web Analytics
  await db.session.deleteMany({});
  await db.account.deleteMany({});
  await db.verificationToken.deleteMany({});
  await db.user.deleteMany({});
}

/**
 * 关闭数据库连接
 * Close database connection
 */
export async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

/**
 * 创建测试用户
 * Create test user
 */
export async function createTestUser(role: keyof typeof UserRole = "READER") {
  const db = getTestDb();
  return db.user.create({
    data: {
      name: `Test ${role}`,
      email: `test-${role.toLowerCase()}-${Date.now()}@example.com`,
      role: UserRole[role],
    },
  });
}

/**
 * 创建测试Session
 * Create test session
 */
export async function createTestSession(userId: string) {
  const db = getTestDb();
  return db.session.create({
    data: {
      userId,
      sessionToken: `test-session-${Date.now()}`,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
    },
  });
}
