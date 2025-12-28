import { mkdir, writeFile, unlink, stat, chmod, access, constants } from "fs/promises";
import path from "path";
import type { StorageProvider } from "./types";

export class LocalStorage implements StorageProvider {
  private uploadRoot: string;

  constructor() {
    this.uploadRoot = path.join(process.cwd(), "public", "uploads");
  }

  /**
   * 检查并确保目录存在且可写
   * 修复 EACCES 权限错误
   */
  private async ensureDirectoryWritable(dirPath: string): Promise<void> {
    try {
      // 创建目录（如果不存在）
      await mkdir(dirPath, { recursive: true });

      // 检查目录是否可写
      await access(dirPath, constants.W_OK | constants.R_OK);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const nodeError = error as NodeJS.ErrnoException;

        // 如果是权限错误，尝试修复
        if (nodeError.code === "EACCES" || nodeError.code === "EPERM") {
          console.log(`尝试修复目录权限: ${dirPath}`);
          try {
            // 尝试更改目录权限为 755
            await chmod(dirPath, 0o755);
            console.log(`已修复目录权限: ${dirPath}`);
          } catch (chmodError) {
            console.error(`无法修复目录权限: ${dirPath}`, chmodError);
            throw new Error(
              `上传目录权限不足: ${dirPath}\n` +
              `请确保应用有权限写入此目录，或手动执行: chmod 755 ${dirPath}`
            );
          }
        } else if (nodeError.code === "ENOENT") {
          // 目录不存在，重新创建
          await mkdir(dirPath, { recursive: true, mode: 0o755 });
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * 上传文件并确保权限正确
   */
  async upload(buffer: Buffer, filename: string, _mimeType: string): Promise<string> {
    const dir = path.join(this.uploadRoot, "gallery");

    try {
      // 确保目录存在且可写
      await this.ensureDirectoryWritable(dir);

      const filePath = path.join(dir, filename);

      // 写入文件
      await writeFile(filePath, buffer, { mode: 0o644 });

      console.log(`文件上传成功: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);

      return `/api/uploads/gallery/${filename}`;
    } catch (error) {
      console.error(`文件上传失败: ${filename}`, error);

      // 提供更友好的错误信息
      if (error && typeof error === "object" && "code" in error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === "EACCES" || nodeError.code === "EPERM") {
          throw new Error(
            `上传失败：文件权限不足。请检查服务器目录权限设置。\n` +
            `目录: ${dir}\n` +
            `建议执行: chmod -R 755 ${this.uploadRoot}`
          );
        } else if (nodeError.code === "ENOSPC") {
          throw new Error("上传失败：服务器存储空间不足");
        } else if (nodeError.code === "EROFS") {
          throw new Error("上传失败：文件系统为只读模式");
        }
      }

      throw new Error(`文件上传失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  async uploadBatch(
    files: { buffer: Buffer; filename: string; mimeType: string }[]
  ): Promise<string[]> {
    const dir = path.join(this.uploadRoot, "gallery");

    try {
      // 确保目录存在且可写
      await this.ensureDirectoryWritable(dir);

      const results = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dir, file.filename);
          await writeFile(filePath, file.buffer, { mode: 0o644 });
          console.log(`批量上传: ${file.filename} (${(file.buffer.length / 1024).toFixed(2)} KB)`);
          return `/api/uploads/gallery/${file.filename}`;
        })
      );

      return results;
    } catch (error) {
      console.error("批量上传失败:", error);
      throw new Error(`批量上传失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  async delete(relativePath: string): Promise<void> {
    // Strip leading slash
    let sanitized = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;

    // Handle /api/uploads/... paths by stripping the api/ prefix
    if (sanitized.startsWith("api/uploads/")) {
      sanitized = sanitized.slice(4); // Remove "api/" prefix -> "uploads/..."
    }

    const fullPath = path.resolve(process.cwd(), "public", sanitized);
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");

    // Security: only allow deletion within public/uploads
    if (!fullPath.startsWith(uploadsRoot + path.sep) && fullPath !== uploadsRoot) {
      console.warn(`[LocalStorage] Blocked delete attempt outside uploads: ${relativePath}`);
      return;
    }

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
