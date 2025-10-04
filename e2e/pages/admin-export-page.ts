import { Page, Locator, Download } from "@playwright/test";
import { BasePage } from "./base-page";

/**
 * Page Object for /admin/export - Content Export functionality
 */
export class AdminExportPage extends BasePage {
  // Export form elements
  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /export|导出/i });
  }

  get downloadButton(): Locator {
    return this.page.getByRole("button", { name: /download|下载/i });
  }

  // Filter controls
  get localeFilter(): Locator {
    // Match either a <select name="locale"> or the EN/ZH checkboxes under the Language section
    return this.page
      .locator('select[name="locale"]')
      .or(this.page.locator('label:has-text("English") input'))
      .or(this.page.locator('label:has-text("Chinese") input'))
      .or(this.page.getByLabel(/locale|语言/i));
  }

  get statusFilter(): Locator {
    // Match either a <select name="status"> or the Published/Draft checkboxes under the Status section
    return this.page
      .locator('select[name="status"]')
      .or(this.page.locator('label:has-text("Published") input'))
      .or(this.page.locator('label:has-text("Draft") input'))
      .or(this.page.getByLabel(/status|状态/i));
  }

  get dateFromInput(): Locator {
    return this.page
      .locator('input[name="dateFrom"]')
      .or(this.page.getByLabel(/from date|开始日期/i));
  }

  get dateToInput(): Locator {
    return this.page.locator('input[name="dateTo"]').or(this.page.getByLabel(/to date|结束日期/i));
  }

  // Loading state
  get loadingIndicator(): Locator {
    return this.page
      .locator(".loading, .spinner, [data-testid='loading']")
      .or(this.page.getByText(/exporting|导出中/i));
  }

  // Stats and info
  get exportStats(): Locator {
    return this.page.locator("[data-testid='export-stats']").or(this.page.getByText(/\d+ posts?/i));
  }

  /**
   * Navigate to export page
   */
  async gotoExport(): Promise<void> {
    await this.page.goto("/admin/export");
    await this.waitForLoad();
  }

  /**
   * Select locale filter
   */
  async selectLocale(locale: "EN" | "ZH" | "ALL"): Promise<void> {
    // Prefer a <select> when available
    const select = this.page.locator('select[name="locale"]');
    if ((await select.count()) > 0) {
      await select.selectOption(locale);
      return;
    }

    // Fallback to checkboxes
    const enCheckbox = this.page.getByLabel(/english/i);
    const zhCheckbox = this.page.getByLabel(/chinese|中文/i);

    if (locale === "EN") {
      if (!(await enCheckbox.isChecked())) await enCheckbox.check();
      if (await zhCheckbox.isChecked()) await zhCheckbox.uncheck();
    } else if (locale === "ZH") {
      if (!(await zhCheckbox.isChecked())) await zhCheckbox.check();
      if (await enCheckbox.isChecked()) await enCheckbox.uncheck();
    } else {
      // ALL: ensure both checked
      if (!(await enCheckbox.isChecked())) await enCheckbox.check();
      if (!(await zhCheckbox.isChecked())) await zhCheckbox.check();
    }
  }

  /**
   * Select status filter
   */
  async selectStatus(status: "PUBLISHED" | "DRAFT" | "ALL"): Promise<void> {
    // Prefer a <select> when available
    const select = this.page.locator('select[name="status"]');
    if ((await select.count()) > 0) {
      await select.selectOption(status);
      return;
    }

    // Fallback to checkboxes
    const published = this.page.getByLabel(/published/i);
    const draft = this.page.getByLabel(/draft/i);

    if (status === "PUBLISHED") {
      if (!(await published.isChecked())) await published.check();
      if (await draft.isChecked()) await draft.uncheck();
    } else if (status === "DRAFT") {
      if (!(await draft.isChecked())) await draft.check();
      if (await published.isChecked()) await published.uncheck();
    } else {
      // ALL: ensure both checked
      if (!(await published.isChecked())) await published.check();
      if (!(await draft.isChecked())) await draft.check();
    }
  }

  /**
   * Set date range filter
   */
  async setDateRange(from: string, to: string): Promise<void> {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
  }

  /**
   * Click export button and wait for download
   */
  async exportAndDownload(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.exportButton.click();
    return await downloadPromise;
  }

  /**
   * Check if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    return this.loadingIndicator.isVisible();
  }

  /**
   * Get export stats text
   */
  async getExportStats(): Promise<string | null> {
    return this.exportStats.textContent();
  }

  /**
   * Check if export form is visible
   */
  async hasExportForm(): Promise<boolean> {
    return (await this.exportButton.count()) > 0;
  }

  /**
   * Wait for export to complete
   */
  async waitForExportComplete(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 30000 });
  }
}
