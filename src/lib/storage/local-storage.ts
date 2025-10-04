import { mkdir, writeFile, unlink, stat } from "fs/promises";
import path from "path";
import type { StorageProvider } from "./types";

export class LocalStorage implements StorageProvider {
  private uploadRoot: string;

  constructor() {
    this.uploadRoot = path.join(process.cwd(), "public", "uploads");
  }

  async upload(buffer: Buffer, filename: string): Promise<string> {
    const dir = path.join(this.uploadRoot, "gallery");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await writeFile(filePath, buffer);
    return `/api/uploads/gallery/${filename}`;
  }

  async delete(relativePath: string): Promise<void> {
    const sanitized = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
    const fullPath = path.join(process.cwd(), "public", sanitized);

    try {
      await stat(fullPath);
      await unlink(fullPath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  getPublicUrl(path: string): string {
    return path;
  }
}
