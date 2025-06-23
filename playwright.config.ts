import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
    ...(process.env.CI ? [['github']] : [['list']]),
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/accessibility/**/*.spec.ts',
    },

    // Performance testing
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/performance/**/*.spec.ts',
    },

    // Visual regression testing
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/visual/**/*.spec.ts',
    },
  ],

  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

  // Test timeout configuration
  timeout: 30000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled',
    },
    toMatchSnapshot: {
      maxDiffPixels: 1000,
    },
  },

  // Output configuration
  outputDir: 'test-results/',
  
  // Metadata
  metadata: {
    'test-type': 'e2e',
    'app-name': 'Strike Shop',
    'app-version': process.env.npm_package_version || '0.1.0',
  },
});