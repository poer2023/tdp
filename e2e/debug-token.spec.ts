import { test } from "@playwright/test";
import { loginAsUser, logout } from "./utils/auth";
import { decode } from "next-auth/jwt";

test("debug regular token role", async ({ page }) => {
  await loginAsUser(page, "regular");
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === "next-auth.session-token");
  if (!sessionCookie) {
    throw new Error("Session cookie not found");
  }
  const decoded = await decode({
    token: sessionCookie.value,
    secret: process.env.NEXTAUTH_SECRET || "test-secret-key-for-e2e-testing-only",
  });
  console.log("decoded role", decoded?.role);
  await logout(page);
});
