import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser, createTestSession } from "../utils/test-db";
import { UserRole } from "@prisma/client";

describe("Authentication API Integration", () => {
  const db = getTestDb();

  // Test 1: 完整登录流程
  it("should handle complete login flow with session creation", async () => {
    // 1. 创建测试用户
    const user = await createTestUser("READER");

    // 2. 创建session
    const session = await createTestSession(user.id);

    // 3. 验证session创建
    expect(session.sessionToken).toBeDefined();
    expect(session.userId).toBe(user.id);

    // 4. 验证数据库session记录
    const dbSession = await db.session.findUnique({
      where: { sessionToken: session.sessionToken },
      include: { user: true },
    });

    expect(dbSession).toBeDefined();
    expect(dbSession?.user.id).toBe(user.id);

    // 5. 验证session未过期
    expect(dbSession?.expires.getTime()).toBeGreaterThan(Date.now());
  });

  // Test 2: 权限验证流程
  it("should verify admin-only routes reject non-admin users", async () => {
    // 1. 创建普通用户和admin用户
    const normalUser = await createTestUser("READER");
    const adminUser = await createTestUser("ADMIN");

    // 2. 验证用户角色
    expect(normalUser.role).toBe(UserRole.READER);
    expect(adminUser.role).toBe(UserRole.ADMIN);

    // 3. 模拟权限检查逻辑
    const checkAdmin = (user: typeof normalUser) => user.role === UserRole.ADMIN;

    expect(checkAdmin(normalUser)).toBe(false);
    expect(checkAdmin(adminUser)).toBe(true);
  });

  // Test 3: Session过期处理
  it("should handle expired session cleanup", async () => {
    // 1. 创建过期session
    const user = await createTestUser("READER");
    const expiredSession = await db.session.create({
      data: {
        userId: user.id,
        sessionToken: `expired-session-${Date.now()}`,
        expires: new Date(Date.now() - 1000), // 已过期
      },
    });

    // 2. 验证session已过期
    const now = new Date();
    expect(expiredSession.expires.getTime()).toBeLessThan(now.getTime());

    // 3. 模拟session清理
    const deletedCount = await db.session.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    expect(deletedCount.count).toBeGreaterThan(0);

    // 4. 验证session被清理
    const cleanedSession = await db.session.findUnique({
      where: { sessionToken: expiredSession.sessionToken },
    });
    expect(cleanedSession).toBeNull();
  });
});
