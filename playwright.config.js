import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: { command: "node tests/server.mjs", url: "http://127.0.0.1:4173", reuseExistingServer: !process.env.CI },
  reporter: process.env.CI ? "github" : "list",
});
