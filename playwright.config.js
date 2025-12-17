// @ts-check
const { defineConfig } = require('@playwright/test');
const path = require('path');
const testConfig = require('./config/test.config');

/**
 * Playwright configuration for Chrome Extension testing
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Extensions require sequential execution
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests - extensions need single browser instance */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['html'],
    ['list']
  ],
  
  /* Extended timeout for extension loading */
  timeout: 60000,
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording */
    video: 'retain-on-failure',
  },

  /* Configure projects - extension tests manage their own browser */
  projects: [
    {
      name: 'extension-tests',
      testMatch: /login-flow\.spec\.js/,
      use: {
        // These tests manage their own browser context with extension loaded
        headless: false,
      },
    },
    {
      name: 'chromium-extension',
      testIgnore: /login-flow\.spec\.js/,
      use: {
        // Chrome extensions require headed mode
        headless: false,

        // Use Chrome channel for extension support
        channel: 'chrome',

        // Launch options for extension loading
        launchOptions: {
          args: [
            `--disable-extensions-except=${testConfig.extensionPath}`,
            `--load-extension=${testConfig.extensionPath}`,
            '--no-first-run',
            '--disable-default-apps',
          ],
        },

        // Viewport settings
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});



