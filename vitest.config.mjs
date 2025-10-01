import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // 避免 Vitest 误执行 Playwright 的 e2e 用例
    exclude: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
      "**/components/__tests__/**", // Exclude React component tests (jsdom incompatible)
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
