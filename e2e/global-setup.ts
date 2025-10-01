import { readdir, mkdir, copyFile } from "fs/promises";
import path from "path";

async function globalSetup() {
  console.log("Setting up E2E test environment...");

  const fixturesDir = path.resolve(__dirname, "fixtures");
  const uploadsDir = path.resolve(__dirname, "..", "public", "uploads");

  // Create uploads directory structure
  await mkdir(path.join(uploadsDir, "covers"), { recursive: true });
  await mkdir(path.join(uploadsDir, "gallery"), { recursive: true });

  // Copy fixture files to uploads directory
  const directories = ["covers", "gallery"];

  for (const dir of directories) {
    const sourcePath = path.join(fixturesDir, dir);
    const targetPath = path.join(uploadsDir, dir);

    try {
      const files = await readdir(sourcePath);

      for (const file of files) {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);

        await copyFile(sourceFile, targetFile);
        console.log(`✓ Copied ${dir}/${file} to uploads`);
      }
    } catch (error) {
      console.error(`Failed to copy files from ${dir}:`, error);
      throw error;
    }
  }

  console.log("E2E test environment setup complete!");
}

export default globalSetup;
