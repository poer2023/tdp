import { Page } from "@playwright/test";
import { encode } from "next-auth/jwt";

// 测试用户配置
export const TEST_USERS = {
  regular: {
    id: "test-user-e2e-1",
    name: "Test User",
    email: "test-e2e@example.com",
    image: "https://avatars.githubusercontent.com/u/1?v=4",
  },
  admin: {
    id: "test-admin-e2e-1",
    name: "Admin User",
    email: "admin-e2e@example.com",
    image: "https://avatars.githubusercontent.com/u/2?v=4",
  },
};

/**
 * 生成 NextAuth.js session token
 * 使用NextAuth的encode函数确保与生产环境完全兼容
 */
async function generateSessionToken(
  user: (typeof TEST_USERS)["regular"],
  userType: "regular" | "admin"
) {
  // 直接使用NextAuth的encode函数
  // 这确保了HKDF密钥派生、JTI添加等与NextAuth内部完全一致
  const token = await encode({
    token: {
      name: user.name,
      email: user.email,
      picture: user.image,
      sub: user.id,
      id: user.id,
      role: userType === "admin" ? "ADMIN" : "AUTHOR",
    },
    secret: process.env.NEXTAUTH_SECRET || "test-secret-key-for-e2e-testing-only",
  });

  return token;
}

/**
 * 为页面设置认证会话
 * @param page - Playwright page 对象
 * @param userType - 用户类型: 'regular' 或 'admin'
 */
export async function loginAsUser(page: Page, userType: "regular" | "admin" = "regular") {
  const user = TEST_USERS[userType];
  const token = await generateSessionToken(user, userType);

  // 设置 NextAuth session cookie
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    },
  ]);
}

/**
 * 清除认证状态
 */
export async function logout(page: Page) {
  await page.context().clearCookies();
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((c) => c.name === "next-auth.session-token");
}
