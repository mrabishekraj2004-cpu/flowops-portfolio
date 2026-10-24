import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: process.env.FLOWOPS_BROWSER_TEST_DIR ?? "./tests/browser",
  workers: 1,
  expect: { timeout: 30000 },
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    actionTimeout: 30000,
    trace: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
