import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display hero section", async ({ page }) => {
    await page.goto("/");

    // Check hero section elements
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "清新简约的个人博客，记录代码与生活的灵感"
    );

    // Check navigation elements
    await expect(page.getByText("阅读文章")).toBeVisible();
    await expect(page.getByText("浏览相册")).toBeVisible();

    // Check sections
    await expect(page.getByText("最新文章")).toBeVisible();
    await expect(page.getByText("灵感相册")).toBeVisible();
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title).toBeTruthy();

    // Check if page loads without console errors
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    await page.waitForLoadState("networkidle");
    expect(logs.length).toBe(0);
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText("全栈日志")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText("全栈日志")).toBeVisible();
  });
});
