import nextConfig from "eslint-config-next";
import tseslint from "@typescript-eslint/eslint-plugin";

const [baseConfig, tsConfig, ignoreConfig] = nextConfig;

const customIgnores = [
  "node_modules/**",
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  "*.config.js",
  "*.config.mjs",
  "*.config.ts",
  "prisma/migrations/**",
  "public/uploads/**",
  "e2e/**",
  "playwright-report/**",
  "test-results/**",
  "coverage/**",
  "Zhi_source/**",
  "lumina_source/**", // Exclude lumina_source from linting (legacy code)
];

export default [
  {
    ...baseConfig,
    plugins: {
      ...(baseConfig.plugins ?? {}),
      "@typescript-eslint": tseslint,
    },
  },
  {
    ...tsConfig,
    rules: {
      ...tsConfig.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // 生产环境禁止使用 console.log/debug/info（保留 error/warn 用于错误监控）
      "no-console": ["error", { allow: ["error", "warn"] }],
    },
  },
  {
    ...ignoreConfig,
    ignores: Array.from(new Set([...(ignoreConfig.ignores ?? []), ...customIgnores])),
  },
  {
    files: ["src/**/__tests__/**", "e2e/**", "scripts/**", "prisma/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "no-console": "off",
    },
  },
];
