const path = require('path');
const fs = require('fs');

// Load environment variables from .env file manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};

      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }
            envVars[key.trim()] = value;
          }
        }
      });

      // Set environment variables
      Object.keys(envVars).forEach(key => {
        process.env[key] = envVars[key];
      });

      console.log('✅ Loaded environment variables from .env file');
    }
  } catch (error) {
    console.log('⚠️ Could not load .env file:', error.message);
  }
}

loadEnv();

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
   * External Site Configuration
   * Login to external site is required before extension login
   * Note: Forsta Plus uses a multi-step login form
   */
  externalSite: {
    url: process.env.External_BASE_URL || 'https://author.nordic.confirmit.com/home/',
    credentials: {
      username: process.env.External_USERNAME || 'akshat.tyagi',
      password: process.env.External_PASSWORD || 'R9@kF7!Qx2#LwA$M',
    },
    selectors: {
      // Forsta Plus login selectors
      usernameInput: 'input[placeholder*="Username"], input[placeholder*="Email"]',
      passwordInput: 'input[type="password"], input[placeholder*="Password"]',
      loginButton: 'button:has-text("Next"), button:has-text("Sign"), button[type="submit"]',
      loginForm: 'form',
      errorMessage: '.error, [role="alert"], .validation-error',
      successIndicator: '.dashboard, .home, .launchpad',
    },
    redirectAfterLogin: {
      urlContains: 'confirmit.com',
    },
    // Multi-step login: first enter username, click Next, then enter password
    isMultiStep: true,
  },

  /**
   * Extension Credentials
   * Used to login within the extension side panel
   */
  extensionCredentials: {
    username: process.env.Extension_USERNAME || 'eshita@metaforms.ai',
    password: process.env.Extension_PASSWORD || '8WzV7kBiMdVNfP4',
  },

  /**
   * Expected URL or path after successful extension login redirect
   */
  extensionRedirectAfterLogin: {
    urlContains: 'dashboard',
  },

  /**
   * Timeouts (in milliseconds)
   */
  timeouts: {
    extensionLoad: 5000,
    loginRedirect: 15000,
    elementVisible: 10000,
    pageLoad: 30000,
  },

  /**
   * Selectors for extension side panel elements
   * Updated based on actual extension UI
   */
  extensionSelectors: {
    usernameInput: 'input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'button[type="submit"], button:has-text("Sign"), button:has-text("Login"), button:has-text("Submit")',
    loginForm: 'form',
    errorMessage: '[role="alert"], .error, .error-message, .text-red-500',
    successIndicator: '.dashboard, .home, [data-logged-in="true"], .success',
  },
};