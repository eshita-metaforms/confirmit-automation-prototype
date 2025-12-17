const testConfig = require('../config/test.config');

/**
 * BasePage - Abstract base class for all Page Objects
 * Implements shared functionality following DRY principle
 * All page objects should extend this class
 * 
 * @abstract
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    if (new.target === BasePage) {
      throw new Error('BasePage is abstract and cannot be instantiated directly');
    }
    this.page = page;
    this.timeouts = testConfig.timeouts;
  }

  /**
   * Wait for an element to be visible
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {number} timeout - Optional timeout override
   * @returns {Promise<void>}
   */
  async waitForVisible(locator, timeout = null) {
    await locator.waitFor({
      state: 'visible',
      timeout: timeout || this.timeouts.elementVisible,
    });
  }

  /**
   * Wait for an element to be hidden
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {number} timeout - Optional timeout override
   * @returns {Promise<void>}
   */
  async waitForHidden(locator, timeout = null) {
    await locator.waitFor({
      state: 'hidden',
      timeout: timeout || this.timeouts.elementVisible,
    });
  }

  /**
   * Wait for an element to be attached to DOM
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {number} timeout - Optional timeout override
   * @returns {Promise<void>}
   */
  async waitForAttached(locator, timeout = null) {
    await locator.waitFor({
      state: 'attached',
      timeout: timeout || this.timeouts.elementVisible,
    });
  }

  /**
   * Safe fill - waits for element then fills
   * @param {import('@playwright/test').Locator} locator - Input locator
   * @param {string} value - Value to fill
   * @returns {Promise<void>}
   */
  async safeFill(locator, value) {
    await this.waitForVisible(locator);
    await locator.fill(value);
  }

  /**
   * Safe click - waits for element then clicks
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @returns {Promise<void>}
   */
  async safeClick(locator) {
    await this.waitForVisible(locator);
    await locator.click();
  }

  /**
   * Check if element is visible (non-blocking)
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @returns {Promise<boolean>}
   */
  async isVisible(locator) {
    return await locator.isVisible();
  }

  /**
   * Get element text content safely
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @returns {Promise<string>}
   */
  async getText(locator) {
    if (await this.isVisible(locator)) {
      return await locator.textContent() || '';
    }
    return '';
  }

  /**
   * Get input value safely
   * @param {import('@playwright/test').Locator} locator - Input locator
   * @returns {Promise<string>}
   */
  async getInputValue(locator) {
    return await locator.inputValue();
  }

  /**
   * Wait for URL to contain a specific string
   * @param {string} urlPart - Part of URL to match
   * @param {number} timeout - Optional timeout override
   * @returns {Promise<boolean>}
   */
  async waitForUrlContains(urlPart, timeout = null) {
    try {
      await this.page.waitForURL(
        url => url.href.includes(urlPart),
        { timeout: timeout || this.timeouts.loginRedirect }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current page URL
   * @returns {string}
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Wait for page load state
   * @param {'load'|'domcontentloaded'|'networkidle'} state - Load state to wait for
   * @returns {Promise<void>}
   */
  async waitForLoadState(state = 'domcontentloaded') {
    await this.page.waitForLoadState(state);
  }

  /**
   * Take a screenshot
   * @param {string} name - Screenshot file name
   * @returns {Promise<Buffer>}
   */
  async screenshot(name) {
    return await this.page.screenshot({ path: `${name}.png` });
  }
}

module.exports = { BasePage };

