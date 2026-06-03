import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Define environment variables globally for the Playwright runner and specs
process.env.SHARE_TEST_BUDGET_ID = '00000000-0000-0000-0000-000000000002';

export default defineConfig({
  testDir: '../e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '../reports/playwright-report' }],
    ['json', { outputFile: '../reports/playwright-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on', // Capturar trace en TODOS los tests para evidencia
    screenshot: 'on', // Capturar screenshot en TODOS los tests
    video: 'on', // Grabar video de TODOS los tests
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npx next dev --webpack',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: path.resolve(__dirname, '../..'),
    env: {
      NEXT_PUBLIC_PLAYWRIGHT_TEST: 'true',
      PLAYWRIGHT_TEST: 'true',
      SHARE_TEST_BUDGET_ID: '00000000-0000-0000-0000-000000000002',
    },
  },
});
