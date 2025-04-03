import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // setupFiles: ["/src/tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        ...configDefaults.exclude,
        "**/dist/**",
        "src/server.ts",
        "src/db.ts",
        "src/types.ts",
        "src/utils/logger.ts",
        "src/middleware/**",
        "src/models/**",
        "src/routes/**",
        "src/stores/**",
        "src/oauth/**",
        "**/__tests__/**",
        "**/*.test.ts",
        "vitest.config.ts",
      ],
    },
  },
});
