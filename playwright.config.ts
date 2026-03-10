import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for DemoShop Mobile QA Automation
 *
 * Strategy:
 * - Mobile-first: Primary testing targets mobile viewports (iPhone, Pixel)
 * - Desktop coverage: Secondary validation on desktop Chrome
 * - Tablet coverage: iPad viewport for responsive breakpoint testing
 *
 * The app is web-accessible (React Native for Web), so Playwright provides
 * fast, reliable automation with native mobile viewport emulation.
 * See docs/mobile-native-strategy.md for Appium migration plan.
 */

const BASE_URL = process.env.BASE_URL || 'https://qa-mobile-automation.vercel.app';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests — more retries in CI for flake tolerance */
  retries: process.env.CI ? 2 : 0,

  /* Parallel execution — limited on CI to avoid resource contention */
  workers: process.env.CI ? 2 : undefined,

  /* Reporter configuration */
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]]
    : [['html', { open: 'on-failure' }], ['list']],

  /* Shared settings for all projects */
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    /* Default timeouts */
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  /* Timeout per test */
  timeout: 30_000,

  /* Expect timeout */
  expect: {
    timeout: 5_000,
  },

  projects: [
    // ═══════════════════════════════════════════
    // MOBILE DEVICES (Primary targets)
    // ═══════════════════════════════════════════
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        // Touch-enabled mobile viewport
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'Mobile Safari Mini',
      use: {
        ...devices['iPhone SE'],
        // Small screen — validates 320px-class layouts
      },
    },

    // ═══════════════════════════════════════════
    // TABLET
    // ═══════════════════════════════════════════
    {
      name: 'Tablet',
      use: {
        ...devices['iPad (gen 7)'],
      },
    },

    // ═══════════════════════════════════════════
    // DESKTOP (Secondary validation)
    // ═══════════════════════════════════════════
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
