import { test, expect } from "@playwright/test";

test.describe("Email OTP Login Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    await page.route("**/api/auth/email/send", async (route) => {
      const request = route.request();
      expect(request.method()).toBe("POST");
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true }),
        headers: { "content-type": "application/json" },
      });
    });

    await page.route("**/api/auth/providers", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: {
            id: "email",
            type: "email",
            name: "Email",
            signinUrl: "/api/auth/signin/email",
            callbackUrl: "/api/auth/callback/email",
          },
        }),
      });
    });

    await page.route("**/api/auth/csrf", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csrfToken: "csrf-token" }),
      });
    });

    await page.route("**/api/auth/signin/email", async (route) => {
      await route.fulfill({
        status: 401,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "http://localhost:3000/login?error=AccessDenied" }),
      });
    });
  });

  test("should request OTP and surface verification errors", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "使用邮箱登录" }).click();

    const emailInput = page.getByLabel("邮箱地址");
    await emailInput.fill("test@example.com");

    const [request] = await Promise.all([
      page.waitForRequest("**/api/auth/email/send"),
      page.getByRole("button", { name: "发送验证码" }).click(),
    ]);

    await expect(page.getByText("验证码已发送，请查收邮箱。")).toBeVisible();

    expect(request.postDataJSON()).toMatchObject({
      email: "test@example.com",
      callbackUrl: "/admin",
    });

    const codeInput = page.getByLabel("输入验证码");
    await codeInput.fill("000000");

    await page.getByRole("button", { name: "验证并登录" }).click();

    await expect(page.getByText("验证码错误或已过期，请重新输入")).toBeVisible();
  });
});
