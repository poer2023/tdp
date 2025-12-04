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
  "lumina_source/**",
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
    },
  },
  {
    ...ignoreConfig,
    ignores: Array.from(new Set([...(ignoreConfig.ignores ?? []), ...customIgnores])),
  },
  {
    files: ["src/**/__tests__/**", "e2e/**", "scripts/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
