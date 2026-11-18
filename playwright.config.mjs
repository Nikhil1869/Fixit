import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
    ...(process.env.FIXIT_TEST_CHROME === "true"
      ? [{ name: "chrome", use: { browserName: "chromium", channel: "chrome" } }]
      : []),
  ],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/start-test-server.mjs",
    url: "http://127.0.0.1:3100/api/health",
    timeout: 180000,
    reuseExistingServer: false,
  },
});
