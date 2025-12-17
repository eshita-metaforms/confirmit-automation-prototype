const { BasePage } = require('./BasePage');
const testConfig = require('../config/test.config');

/**
 * External Site Page Object
 * Handles login on the external site (e.g., Confirmit/Forsta Plus)
 * Follows Page Object Model - only contains elements and methods, no test logic
 * 
 * @extends BasePage
 */
class ExternalSitePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    super(page);
    this.config = testConfig.externalSite;
    this.selectors = this.config.selectors;
    
    this._initLocators();
  }

  /**
   * Initialize locators for external site login form
   * @private
   */
  _initLocators() {
    this.usernameInput = this.page.locator(this.selectors.usernameInput);
    this.passwordInput = this.page.locator(this.selectors.passwordInput);
    this.loginButton = this.page.locator(this.selectors.loginButton);
    this.loginForm = this.page.locator(this.selectors.loginForm);
    this.errorMessage = this.page.locator(this.selectors.errorMessage);
    this.successIndicator = this.page.locator(this.selectors.successIndicator);
  }

  /**
   * Navigate to the external site login page
   * @returns {Promise<void>}
   */
  async goto() {
    await this.page.goto(this.config.url, {
      waitUntil: 'domcontentloaded',
      timeout: this.timeouts.pageLoad,
    });
  }

  /**
   * Fill username input
   * @param {string} username
   * @returns {Promise<void>}
   */
  async fillUsername(username) {
    await this.safeFill(this.usernameInput, username);
  }

  /**
   * Fill password input
   * @param {string} password
   * @returns {Promise<void>}
   */
  async fillPassword(password) {
    await this.safeFill(this.passwordInput, password);
  }

  /**
   * Click login button
   * @returns {Promise<void>}
   */
  async clickLogin() {
    await this.safeClick(this.loginButton);
  }

  /**
   * Perform complete login on external site
   * Handles both single-step and multi-step login forms
   * @param {string} username - Optional, uses config if not provided
   * @param {string} password - Optional, uses config if not provided
   * @returns {Promise<boolean>} True if login successful
   */
  async login(username = null, password = null) {
    const user = username || this.config.credentials.username;
    const pass = password || this.config.credentials.password;

    try {
      if (this.config.isMultiStep) {
        // Step 1: Enter username and click Next
        await this.fillUsername(user);
        await this.clickLogin();
        
        // Wait for password field to appear
        await this.page.waitForTimeout(2000);
        
        // Step 2: Enter password and submit
        await this.fillPassword(pass);
        await this.clickLogin();
      } else {
        // Single-step login
        await this.fillUsername(user);
        await this.fillPassword(pass);
        await this.clickLogin();
      }

      // Wait for login success
      return await this.waitForLoginSuccess();
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for successful login redirect
   * @returns {Promise<boolean>}
   */
  async waitForLoginSuccess() {
    const urlChanged = await this.waitForUrlContains(
      this.config.redirectAfterLogin.urlContains,
      this.timeouts.loginRedirect
    );
    
    if (urlChanged) return true;

    // Fallback: Check if success indicator is visible
    try {
      await this.waitForVisible(this.successIndicator, 3000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if currently logged in
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    const currentUrl = this.getCurrentUrl();
    if (currentUrl.includes(this.config.redirectAfterLogin.urlContains)) {
      return true;
    }

    try {
      await this.waitForVisible(this.successIndicator, 2000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if error message is visible
   * @returns {Promise<boolean>}
   */
  async isErrorVisible() {
    try {
      await this.waitForVisible(this.errorMessage, 2000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   * @returns {Promise<string>}
   */
  async getErrorText() {
    return await this.getText(this.errorMessage);
  }
}

module.exports = { ExternalSitePage };
