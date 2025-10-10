import { PrismaClient, UserRole } from "@prisma/client";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

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
  await db.dailyStats.deleteMany({});
  await db.pageView.deleteMany({});
  await db.visitor.deleteMany({});
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
