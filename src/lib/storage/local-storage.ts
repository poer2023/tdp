import { mkdir, writeFile, unlink, stat } from "fs/promises";
import path from "path";
import {
  getFallbackUploadRoot,
  getLocalUploadRoot,
  isPermissionError,
  resolveLocalPathFromPublicUrl,
  resolveLocalUploadPath,
  setLocalUploadRoot,
} from "./local-paths";
import type { StorageProvider } from "./types";

export class LocalStorage implements StorageProvider {
  private uploadRoot: string;

  constructor() {
    this.uploadRoot = getLocalUploadRoot();
  }

  async upload(buffer: Buffer, filename: string, _mimeType: string): Promise<string> {
    let dir = await this.ensureGalleryDir();
    let filePath = path.join(dir, filename);

    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      if (!isPermissionError(error)) {
        throw error;
      }

      dir = await this.switchToFallback();
      filePath = path.join(dir, filename);
      await writeFile(filePath, buffer);
    }

    return `/api/uploads/gallery/${filename}`;
  }

  async uploadBatch(
    files: { buffer: Buffer; filename: string; mimeType: string }[]
  ): Promise<string[]> {
    let dir = await this.ensureGalleryDir();

    try {
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dir, file.filename);
          await writeFile(filePath, file.buffer);
        })
      );
    } catch (error) {
      if (!isPermissionError(error)) {
        throw error;
      }

      dir = await this.switchToFallback();
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dir, file.filename);
          await writeFile(filePath, file.buffer);
        })
      );
    }

    return files.map((file) => `/api/uploads/gallery/${file.filename}`);
  }

  async delete(relativePath: string): Promise<void> {
    const localPath = resolveLocalPathFromPublicUrl(relativePath);

    try {
      await stat(localPath);
      await unlink(localPath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  getPublicUrl(path: string): string {
    return path;
  }

  private async ensureGalleryDir(): Promise<string> {
    const dir = resolveLocalUploadPath("gallery");

    try {
      await mkdir(dir, { recursive: true });
      this.uploadRoot = getLocalUploadRoot();
      return dir;
    } catch (error) {
      if (!isPermissionError(error)) {
        throw error;
      }
      return this.switchToFallback();
    }
  }

  private async switchToFallback(): Promise<string> {
    const fallbackRoot = getFallbackUploadRoot();
    const fallbackDir = path.join(fallbackRoot, "gallery");
    await mkdir(fallbackDir, { recursive: true });
    setLocalUploadRoot(fallbackRoot);
    this.uploadRoot = fallbackRoot;
    return fallbackDir;
  }
}
