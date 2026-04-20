import {defineConfig, devices} from '@playwright/test';

const PORT = 3000;
const BASE_URL = process.env.PREVIEW_URL ?? `http://localhost:${PORT}`;

// Allow CI / `test:a11y` / `test:visual` to override testDir without
// maintaining a second config file. Default stays on tests/e2e so the
// common `playwright test` invocation works locally.
const TEST_DIR = process.env.PLAYWRIGHT_TEST_DIR ?? 'tests/e2e';

export default defineConfig({
  testDir: TEST_DIR,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', {outputFolder: 'playwright-report', open: 'never'}],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Dev-store password gate — set via env in CI.
    extraHTTPHeaders: process.env.SHOPIFY_STORE_PASSWORD
      ? {
          'X-Shopify-Storefront-Password': process.env
            .SHOPIFY_STORE_PASSWORD as string,
        }
      : undefined,
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'mobile-chrome', use: {...devices['Pixel 7']}},
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev -- --port=3000',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
