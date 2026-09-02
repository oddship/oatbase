import { defineConfig, devices } from '@playwright/test';

const requestedWorkers = Number.parseInt(process.env.OATBASE_PLAYWRIGHT_WORKERS || '', 10);
const localWorkers = Number.isInteger(requestedWorkers) && requestedWorkers > 0 ? requestedWorkers : 1;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.pw.js',
  outputDir: './test-results',
  fullyParallel: Boolean(process.env.CI),
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : localWorkers,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:43127',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'bun scripts/test-server.js',
    url: 'http://127.0.0.1:43127/tests/harness.html',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
