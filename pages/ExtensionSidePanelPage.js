const { BasePage } = require('./BasePage');
const testConfig = require('../config/test.config');

/**
 * Extension Side Panel Page Object
 * Contains locators and interaction methods for the extension side panel
 * Follows Page Object Model - only contains elements and methods, no test logic
 * 
 * @extends BasePage
 */
class ExtensionSidePanelPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {string} extensionId - Chrome extension ID
   */
  constructor(page, extensionId) {
    super(page);
    this.extensionId = extensionId;
    this.selectors = testConfig.extensionSelectors;
    this.credentials = testConfig.extensionCredentials;
    
    this._initLocators();
  }

  /**
   * Initialize all locators for the page
   * @private
   */
  _initLocators() {
    this.usernameInput = this.page.locator(this.selectors.usernameInput);
    this.passwordInput = this.page.locator(this.selectors.passwordInput);
    this.loginButton = this.page.locator(this.selectors.loginButton);
    this.loginForm = this.page.locator(this.selectors.loginForm);
    this.errorMessage = this.page.locator(this.selectors.errorMessage);
    this.successIndicator = this.page.locator(this.selectors.successIndicator);
    this.rootElement = this.page.locator('#root');
  }

  /**
   * Get the side panel URL for this extension
   * @returns {string}
   */
  getSidePanelUrl() {
    return `chrome-extension://${this.extensionId}/${testConfig.sidePanelFile}`;
  }

  /**
   * Navigate to the extension side panel
   * @returns {Promise<void>}
   */
  async goto() {
    await this.page.goto(this.getSidePanelUrl());
    await this.waitForLoadState('domcontentloaded');
    await this.waitForAttached(this.rootElement);
  }

  /**
   * Wait for the side panel content to be fully loaded
   * @returns {Promise<boolean>} True if already logged in, false otherwise
   */
  async waitForContentLoad() {
    // Wait for either the login form or success indicator to be visible
    await this.page.waitForSelector(
      `${this.selectors.loginForm}, ${this.selectors.successIndicator}, input, button`,
      { state: 'visible', timeout: this.timeouts.elementVisible }
    );

    // Check if already logged in
    return await this.isSuccessIndicatorVisible();
  }

  /**
   * Fill the username input field
   * @param {string} username - Username to enter
   * @returns {Promise<void>}
   */
  async fillUsername(username) {
    await this.safeFill(this.usernameInput, username);
  }

  /**
   * Fill the password input field
   * @param {string} password - Password to enter
   * @returns {Promise<void>}
   */
  async fillPassword(password) {
    await this.safeFill(this.passwordInput, password);
  }

  /**
   * Click the login button
   * @returns {Promise<void>}
   */
  async clickLogin() {
    await this.safeClick(this.loginButton);
  }

  /**
   * Perform complete login flow
   * @param {string} username - Optional, uses config if not provided
   * @param {string} password - Optional, uses config if not provided
   * @returns {Promise<boolean>} True if login successful
   */
  async login(username = null, password = null) {
    const user = username || this.credentials.username;
    const pass = password || this.credentials.password;

    try {
      await this.fillUsername(user);
      await this.fillPassword(pass);
      await this.clickLogin();

      // Wait a moment for response
      await this.page.waitForTimeout(2000);

      // Check for successful login
      return await this.waitForLoginSuccess();
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for successful login (redirect, success indicator, or form disappearance)
   * @returns {Promise<boolean>} True if login appears successful
   */
  async waitForLoginSuccess() {
    const { extensionRedirectAfterLogin } = testConfig;

    // Method 1: Check for URL change
    const urlChanged = await this.waitForUrlContains(
      extensionRedirectAfterLogin.urlContains,
      3000
    );
    if (urlChanged) return true;

    // Method 2: Check if success indicator appears
    try {
      await this.waitForVisible(this.successIndicator, 2000);
      return true;
    } catch {
      // Continue to next method
    }

    // Method 3: Check if login form is hidden
    try {
      await this.waitForHidden(this.loginForm, 2000);
      return true;
    } catch {
      // Continue to next method
    }

    // Method 4: Check if form inputs are cleared
    const usernameValue = await this.getUsernameValue();
    const passwordValue = await this.getPasswordValue();
    if (usernameValue === '' && passwordValue === '') {
      return true;
    }

    return false;
  }

  /**
   * Check if redirect has occurred
   * @returns {boolean}
   */
  isRedirected() {
    return this.getCurrentUrl().includes(testConfig.extensionRedirectAfterLogin.urlContains);
  }

  /**
   * Check if login form is visible
   * @returns {Promise<boolean>}
   */
  async isLoginFormVisible() {
    return await this.isVisible(this.loginForm);
  }

  /**
   * Check if error message is displayed
   * @returns {Promise<boolean>}
   */
  async isErrorMessageVisible() {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Get error message text
   * @returns {Promise<string>}
   */
  async getErrorMessageText() {
    return await this.getText(this.errorMessage);
  }

  /**
   * Check if success indicator is visible (post-login)
   * @returns {Promise<boolean>}
   */
  async isSuccessIndicatorVisible() {
    try {
      await this.waitForVisible(this.successIndicator, this.timeouts.elementVisible);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all input fields
   * @returns {Promise<void>}
   */
  async clearForm() {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Get the value of the username input
   * @returns {Promise<string>}
   */
  async getUsernameValue() {
    return await this.getInputValue(this.usernameInput);
  }

  /**
   * Get the value of the password input
   * @returns {Promise<string>}
   */
  async getPasswordValue() {
    return await this.getInputValue(this.passwordInput);
  }

  /**
   * Get element counts for debugging
   * @returns {Promise<Object>} Object with element counts
   */
  async getElementCounts() {
    return {
      inputs: await this.page.locator('input').count(),
      buttons: await this.page.locator('button').count(),
      forms: await this.page.locator('form').count(),
      emailInputs: await this.page.locator('input[type="email"]').count(),
      passwordInputs: await this.page.locator('input[type="password"]').count(),
    };
  }
}

module.exports = { ExtensionSidePanelPage };
