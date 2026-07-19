// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  expect: { timeout: process.env.CI ? 30000 : 5000 },
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8765',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npx vite docs --port 8765',
    url: 'http://localhost:8765',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
