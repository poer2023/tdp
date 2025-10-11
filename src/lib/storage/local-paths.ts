import os from "os";
import path from "path";

const CONFIGURED_ROOT = (() => {
  const explicit = process.env.LOCAL_UPLOAD_DIR || process.env.LOCAL_UPLOAD_ROOT || null;
  return explicit ? path.resolve(explicit) : path.join(process.cwd(), "public", "uploads");
})();

let currentRoot = CONFIGURED_ROOT;

export function getLocalUploadRoot(): string {
  return currentRoot;
}

export function setLocalUploadRoot(nextRoot: string) {
  currentRoot = path.resolve(nextRoot);
}

export function getFallbackUploadRoot(): string {
  return path.join(os.tmpdir(), "tdp-uploads");
}

export function resolveLocalUploadPath(...segments: string[]): string {
  return path.join(getLocalUploadRoot(), ...segments);
}

export function resolveLocalPathFromPublicUrl(relativePath: string): string {
  const sanitized = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;

  if (sanitized.startsWith("http://") || sanitized.startsWith("https://")) {
    return sanitized;
  }

  const parts = sanitized.split("/").filter(Boolean);

  if (parts[0] === "api" && parts[1] === "uploads") {
    return path.join(getLocalUploadRoot(), ...parts.slice(2));
  }

  return path.join(getLocalUploadRoot(), sanitized);
}

export function isPermissionError(error: unknown): error is NodeJS.ErrnoException {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as NodeJS.ErrnoException).code;
  return code === "EACCES" || code === "EPERM";
}
