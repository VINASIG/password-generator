import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["line"], ["json", { outputFile: "output/browser-results.json" }]],
  use: {
    locale: "vi-VN",
    baseURL: "http://127.0.0.1:4179",
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",
  },
  outputDir: "output/playwright",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "node scripts/serve.ts",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: false,
    timeout: 15000,
  },
});
