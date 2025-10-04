import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base-page";

export enum ImportAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  SKIP = "SKIP",
  ERROR = "ERROR",
}

/**
 * Page Object for /admin/import - Content Import functionality
 */
export class AdminImportPage extends BasePage {
  // Upload controls
  get fileInput(): Locator {
    // Prefer stable test id selector
    return this.page
      .locator("[data-testid='zip-file-input']")
      .or(this.page.locator('input[type="file"]'));
  }

  get uploadButton(): Locator {
    return this.page.getByRole("button", { name: /upload|选择|上传/i });
  }

  get selectFileButton(): Locator {
    return this.page.getByRole("button", { name: /select file|选择文件/i });
  }

  // Import process
  get dryRunButton(): Locator {
    return this.page
      .locator("[data-testid='preview-import-button']")
      .or(this.page.getByRole("button", { name: /preview|dry.?run|预览/i }));
  }

  get applyButton(): Locator {
    return this.page.getByRole("button", { name: /apply|confirm|应用|确认/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole("button", { name: /cancel|取消/i });
  }

  // Results and stats
  get importStats(): Locator {
    return this.page.locator("[data-testid='import-stats']");
  }

  get createdCount(): Locator {
    return this.page.getByTestId("created-count");
  }

  get updatedCount(): Locator {
    return this.page.getByTestId("updated-count");
  }

  get skippedCount(): Locator {
    return this.page.getByTestId("skipped-count");
  }

  get errorCount(): Locator {
    return this.page.getByTestId("error-count");
  }

  // File list and actions
  get fileList(): Locator {
    return this.page
      .locator("[data-testid='file-list']")
      .or(this.page.locator("ul").filter({ hasText: /\.md/ }));
  }

  get validationErrors(): Locator {
    return this.page.locator(".error, .validation-error, [data-testid='error']");
  }

  // Loading state
  get loadingIndicator(): Locator {
    return this.page
      .locator(".loading, .spinner")
      .or(this.page.getByText(/importing|processing|导入中|处理中/i));
  }

  /**
   * Navigate to import page
   */
  async gotoImport(): Promise<void> {
    await this.page.goto("/admin/import");
    await this.waitForLoad();
  }

  /**
   * Upload a file for import
   */
  async uploadFile(filePath: string): Promise<void> {
    // File upload operations need longer timeout for processing
    await this.fileInput.setInputFiles(filePath, { timeout: 30000 });
  }

  /**
   * Run dry-run preview
   */
  async runDryRun(): Promise<void> {
    const { waitForApiResponse } = await import("../helpers/wait-helpers");
    const responsePromise = waitForApiResponse(this.page, /\/api\/admin\/content\/import/);
    await this.dryRunButton.click();
    await responsePromise;
    await this.waitForLoad();
  }

  /**
   * Apply import after dry-run
   */
  async applyImport(): Promise<void> {
    const { waitForApiResponse } = await import("../helpers/wait-helpers");
    const responsePromise = waitForApiResponse(this.page, /\/api\/admin\/content\/import/);
    await this.applyButton.click();
    await responsePromise;
    await this.waitForLoad();
  }

  /**
   * Cancel import
   */
  async cancelImport(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  }> {
    const created = await this.getCountFromText(await this.createdCount.textContent());
    const updated = await this.getCountFromText(await this.updatedCount.textContent());
    const skipped = await this.getCountFromText(await this.skippedCount.textContent());
    const errors = await this.getCountFromText(await this.errorCount.textContent());

    return { created, updated, skipped, errors };
  }

  /**
   * Extract number from text
   */
  private async getCountFromText(text: string | null): Promise<number> {
    if (!text) return 0;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get validation errors
   */
  async getValidationErrors(): Promise<string[]> {
    const errorElements = await this.validationErrors.all();
    return Promise.all(errorElements.map((el) => el.textContent())).then((texts) =>
      texts.filter((t): t is string => t !== null)
    );
  }

  /**
   * Check if dry-run preview is visible
   */
  async hasDryRunPreview(): Promise<boolean> {
    // Check for Preview heading instead of file list (which may be empty)
    const previewHeading = this.page.getByRole("heading", { name: /preview|预览/i });
    return (await previewHeading.count()) > 0;
  }

  /**
   * Get file action badge for a specific file
   */
  async getFileAction(fileName: string): Promise<string | null> {
    const fileRow = this.page.locator(`text=${fileName}`).locator("..");
    const badge = fileRow.locator(".badge, .action-badge, [data-testid='action']");

    if ((await badge.count()) === 0) {
      return null;
    }

    return badge.textContent();
  }

  /**
   * Check if file has validation error
   */
  async hasFileError(fileName: string): Promise<boolean> {
    const fileRow = this.page.locator(`text=${fileName}`).locator("..");
    const error = fileRow.locator(".error, .text-red");

    return (await error.count()) > 0;
  }

  /**
   * Wait for import to complete
   */
  async waitForImportComplete(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 60000 });
  }

  /**
   * Check if confirmation dialog is visible
   */
  async hasConfirmationDialog(): Promise<boolean> {
    const confirmDialog = this.page.getByText(/are you sure|确认|confirm/i);
    return (await confirmDialog.count()) > 0;
  }
}
