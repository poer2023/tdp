import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
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
      "**/*.integration.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/lib/**", "src/components/**", "src/app/**"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.integration.test.ts",
        "**/node_modules/**",
        "**/test/**",
        "**/tests/**",
        "**/__tests__/**",
      ],
      thresholds: {
        lines: 75,
        functions: 70,
        branches: 70,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
