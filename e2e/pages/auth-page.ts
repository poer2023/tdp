import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base-page";

/**
 * Page Object for authentication-related UI elements and interactions
 */
export class AuthPage extends BasePage {
  // Sign-in button
  get signInButton(): Locator {
    return this.page
      .getByRole("button", { name: /sign in|登录/i })
      .or(this.page.getByRole("link", { name: /sign in|登录/i }));
  }

  get googleSignInButton(): Locator {
    return this.page.getByRole("button", { name: /sign in with google/i });
  }

  get mobileSignInButton(): Locator {
    return this.page.getByRole("button", { name: /^sign in$/i });
  }

  // User menu (when authenticated)
  get userMenuButton(): Locator {
    return this.page
      .getByLabel("User menu")
      .or(this.page.locator("button").filter({ hasText: /test user/i }));
  }

  get userAvatar(): Locator {
    return this.page
      .locator('[data-testid="user-avatar"]')
      .or(this.page.locator("img[alt*='avatar']"));
  }

  get userName(): Locator {
    return this.page.getByText("Test User").or(this.page.getByText(/test.*user/i));
  }

  // Dropdown menu items
  get dashboardMenuItem(): Locator {
    return this.page.getByText(/dashboard|控制台/i);
  }

  get signOutMenuItem(): Locator {
    return this.page.getByText(/sign out|退出|登出/i);
  }

  get dropdownMenu(): Locator {
    return this.page.getByRole("menu");
  }

  /**
   * Check if user is currently signed in
   */
  async isSignedIn(): Promise<boolean> {
    return (await this.userMenuButton.count()) > 0;
  }

  /**
   * Check if sign-in button is visible
   */
  async hasSignInButton(): Promise<boolean> {
    return (await this.signInButton.count()) > 0;
  }

  /**
   * Open user dropdown menu
   */
  async openUserMenu(): Promise<void> {
    const menuButton = this.userMenuButton.first();
    await menuButton.click();
    await this.dropdownMenu.waitFor({ state: "visible" });
  }

  /**
   * Close user dropdown menu via Escape key
   */
  async closeUserMenuWithEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(300); // Wait for animation
  }

  /**
   * Close user dropdown menu via outside click
   */
  async closeUserMenuWithOutsideClick(): Promise<void> {
    await this.page.locator("body").click({ position: { x: 10, y: 10 } });
    await this.page.waitForTimeout(300); // Wait for animation
  }

  /**
   * Sign out by clicking sign out menu item
   */
  async signOut(): Promise<void> {
    await this.openUserMenu();
    const signOutButton = this.signOutMenuItem.first();
    await signOutButton.click();
    await this.page.waitForTimeout(1000); // Wait for sign out
  }

  /**
   * Navigate to dashboard via user menu
   */
  async gotoDashboard(): Promise<void> {
    await this.openUserMenu();
    const dashboardLink = this.dashboardMenuItem.first();
    await dashboardLink.click();
    await this.waitForLoad();
  }

  /**
   * Check if user menu is currently open
   */
  async isUserMenuOpen(): Promise<boolean> {
    return this.dropdownMenu.isVisible();
  }

  /**
   * Get aria-expanded attribute value
   */
  async getAriaExpanded(): Promise<string | null> {
    return this.userMenuButton.getAttribute("aria-expanded");
  }

  /**
   * Get aria-haspopup attribute value
   */
  async getAriaHasPopup(): Promise<string | null> {
    return this.userMenuButton.getAttribute("aria-haspopup");
  }

  /**
   * Focus on sign-in button
   */
  async focusSignInButton(): Promise<void> {
    await this.signInButton.first().focus();
  }

  /**
   * Check if sign-in button has focus
   */
  async isSignInButtonFocused(): Promise<boolean> {
    return this.signInButton.first().evaluate((el) => document.activeElement === el);
  }

  /**
   * Navigate keyboard through menu items
   */
  async navigateMenuWithArrowKeys(direction: "down" | "up"): Promise<void> {
    const key = direction === "down" ? "ArrowDown" : "ArrowUp";
    await this.page.keyboard.press(key);
  }

  /**
   * Check if Google icon is present in sign-in button
   */
  async hasGoogleIcon(): Promise<boolean> {
    const svg = this.signInButton.locator("svg").first();
    return (await svg.count()) > 0;
  }

  /**
   * Set viewport to mobile size
   */
  async switchToMobileView(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Set viewport to desktop size
   */
  async switchToDesktopView(): Promise<void> {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Check if desktop-specific text is visible
   */
  async hasDesktopSignInText(): Promise<boolean> {
    const desktopButton = this.page.getByRole("button", { name: /sign in with google/i });
    return (await desktopButton.count()) > 0;
  }

  /**
   * Check if mobile-specific text is visible
   */
  async hasMobileSignInText(): Promise<boolean> {
    const mobileButton = this.page.getByRole("button", { name: /^sign in$/i });
    return (await mobileButton.count()) > 0 && (await mobileButton.isVisible());
  }
}
