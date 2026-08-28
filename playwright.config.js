const { defineConfig } = require('@playwright/test');

const PORT = Number(process.env.E2E_PORT || 4174);
const BASE = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node tools/e2e-serve.mjs',
    url: `${BASE}/app.html`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: { E2E_PORT: String(PORT) }
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
