const testConfig = require('../config/test.config');

/**
 * Extension Side Panel Page Object
 * Contains locators and interaction methods for the extension side panel login page
 * Following Page Object Model - only contains elements and methods, no test logic
 */
class ExtensionSidePanelPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {string} extensionId - Chrome extension ID
   */
  constructor(page, extensionId) {
    this.page = page;
    this.extensionId = extensionId;
    this.selectors = testConfig.selectors;
    
    // Initialize locators using data-test-id selectors
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
  }

  /**
   * Navigate to the extension side panel
   */
  async goto() {
    const sidePanelUrl = `chrome-extension://${this.extensionId}/${testConfig.sidePanelFile}`;
    await this.page.goto(sidePanelUrl);
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for React app to mount
    await this.page.waitForSelector('#root', { state: 'attached' });
  }

  /**
   * Wait for the side panel content to be fully loaded
   * Useful when the React app takes time to render
   */
  async waitForContentLoad() {
    // Wait for either the login form or success indicator to be visible
    await this.page.waitForSelector(`${this.selectors.loginForm}, ${this.selectors.successIndicator}`, {
      state: 'visible',
      timeout: testConfig.timeouts.elementVisible,
    });
  }

  /**
   * Fill the username input field
   * @param {string} username - Username to enter
   */
  async fillUsername(username) {
    await this.usernameInput.waitFor({ state: 'visible', timeout: testConfig.timeouts.elementVisible });
    await this.usernameInput.fill(username);
  }

  /**
   * Fill the password input field
   * @param {string} password - Password to enter
   */
  async fillPassword(password) {
    await this.passwordInput.waitFor({ state: 'visible', timeout: testConfig.timeouts.elementVisible });
    await this.passwordInput.fill(password);
  }

  /**
   * Click the login button
   */
  async clickLogin() {
    await this.loginButton.waitFor({ state: 'visible', timeout: testConfig.timeouts.elementVisible });
    await this.loginButton.click();
  }

  /**
   * Perform complete login flow
   * @param {string} username - Username to enter
   * @param {string} password - Password to enter
   */
  async login(username, password) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Wait for redirect after successful login
   * @returns {Promise<boolean>} True if redirect occurred
   */
  async waitForRedirect() {
    const { redirectAfterLogin, timeouts } = testConfig;
    
    try {
      await this.page.waitForURL(
        url => url.href.includes(redirectAfterLogin.urlContains),
        { timeout: timeouts.loginRedirect }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if redirect has occurred (current URL contains expected string)
   * @returns {boolean} True if current URL indicates successful redirect
   */
  isRedirected() {
    const currentUrl = this.page.url();
    return currentUrl.includes(testConfig.redirectAfterLogin.urlContains);
  }

  /**
   * Get the current page URL
   * @returns {string} Current URL
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Check if login form is visible
   * @returns {Promise<boolean>}
   */
  async isLoginFormVisible() {
    return await this.loginForm.isVisible();
  }

  /**
   * Check if error message is displayed
   * @returns {Promise<boolean>}
   */
  async isErrorMessageVisible() {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   * @returns {Promise<string>}
   */
  async getErrorMessageText() {
    if (await this.isErrorMessageVisible()) {
      return await this.errorMessage.textContent();
    }
    return '';
  }

  /**
   * Check if success indicator is visible (post-login)
   * @returns {Promise<boolean>}
   */
  async isSuccessIndicatorVisible() {
    try {
      await this.successIndicator.waitFor({ 
        state: 'visible', 
        timeout: testConfig.timeouts.elementVisible 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all input fields
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
    return await this.usernameInput.inputValue();
  }

  /**
   * Get the value of the password input
   * @returns {Promise<string>}
   */
  async getPasswordValue() {
    return await this.passwordInput.inputValue();
  }
}

module.exports = { ExtensionSidePanelPage };
