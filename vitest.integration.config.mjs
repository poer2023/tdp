import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "integration",
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/integration/utils/setup.ts"],
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules/**", "dist/**", ".next/**"],
    testTimeout: 30000, // 30秒超时
    hookTimeout: 30000,
    pool: "forks", // 隔离测试环境
    poolOptions: {
      forks: {
        singleFork: true, // 使用单个进程顺序执行，避免数据库竞争
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/app/api/**", "src/lib/**"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"],
      // Integration tests focus on functional testing, not code coverage
      // Unit tests already enforce 75% coverage thresholds
      enabled: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
