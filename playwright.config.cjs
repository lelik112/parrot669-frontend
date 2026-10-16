const {defineConfig, devices} = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 20_000,
  expect: {timeout: 5_000},
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', {open:'never'}]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    {name:'chromium-desktop', use:{...devices['Desktop Chrome']}},
    {name:'webkit-desktop', use:{...devices['Desktop Safari']}},
    {name:'mobile-emulation', use:{...devices['iPhone 13']}}
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory public',
    url: 'http://127.0.0.1:4173/search.html',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
