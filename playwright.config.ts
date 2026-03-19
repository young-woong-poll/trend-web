import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.CI ? 3002 : 3099;

export default defineConfig({
  testDir: './qa',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    permissions: ['clipboard-write', 'clipboard-read'],
  },

  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  webServer: {
    command: `NEXT_PUBLIC_ENABLE_MSW=true ENABLE_MSW=true pnpm next dev --turbo --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
