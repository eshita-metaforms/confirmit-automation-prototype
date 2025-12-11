const path = require('path');

/**
 * Test configuration for Chrome Extension testing
 * Update these values according to your extension setup
 */
module.exports = {
  /**
   * Path to the WXT extension build output directory
   * Points to the chrome-mv3 folder in the workspace
   */
  extensionPath: process.env.EXTENSION_PATH || path.resolve(__dirname, '../chrome-mv3'),

  /**
   * Extension side panel file name (as defined in your WXT manifest)
   * This extension uses side_panel instead of popup
   */
  sidePanelFile: 'sidepanel.html',

  /**
   * Test credentials for login
   * IMPORTANT: For production, use environment variables
   */
  testCredentials: {
    username: process.env.TEST_USERNAME || 'testuser@example.com',
    password: process.env.TEST_PASSWORD || 'testpassword123',
  },

  /**
   * Expected URL or path after successful login redirect
   */
  redirectAfterLogin: {
    urlContains: 'dashboard', // URL should contain this string after redirect
    // Alternatively, you can specify an exact path
    // exactPath: '/dashboard',
  },

  /**
   * Timeouts (in milliseconds)
   */
  timeouts: {
    extensionLoad: 5000,      // Time to wait for extension to load
    loginRedirect: 10000,     // Time to wait for login redirect
    elementVisible: 5000,     // Time to wait for elements to be visible
  },

  /**
   * Data-test-id selectors for extension popup elements
   * Update these to match the actual data-test-id attributes in your extension
   */
  selectors: {
    usernameInput: '[data-test-id="username-input"]',
    passwordInput: '[data-test-id="password-input"]',
    loginButton: '[data-test-id="login-button"]',
    loginForm: '[data-test-id="login-form"]',
    errorMessage: '[data-test-id="error-message"]',
    successIndicator: '[data-test-id="success-indicator"]',
  },
};


