const { chromium } = require('@playwright/test');
const path = require('path');
const testConfig = require('../config/test.config');
const { ExtensionIdExtractor } = require('./ExtensionIdExtractor');

/**
 * BrowserManager - Single source of truth for browser lifecycle management
 * Follows Single Responsibility Principle (SRP) - manages browser only
 * 
 * Responsibilities:
 * - Launch Chrome browser with extension loaded
 * - Manage browser context lifecycle
 * - Provide extension ID via ExtensionIdExtractor
 * - Create new pages
 */
class BrowserManager {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.userDataDir - User data directory (empty string for temp)
   * @param {boolean} options.persistentContext - Whether to use persistent context
   */
  constructor(options = {}) {
    this.options = {
      userDataDir: options.userDataDir || '',
      persistentContext: options.persistentContext !== false,
      ...options,
    };
    this.context = null;
    this.extensionId = null;
    this.isInitialized = false;
  }

  /**
   * Get default Chrome launch arguments for extension testing
   * @returns {string[]} Array of Chrome arguments
   * @private
   */
  _getDefaultArgs() {
    const pathToExtension = testConfig.extensionPath;
    return [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-first-run',
      '--disable-default-apps',
      '--disable-popup-blocking',
    ];
  }

  /**
   * Get arguments that should be ignored (prevent Playwright from disabling extensions)
   * @returns {string[]} Array of arguments to ignore
   * @private
   */
  _getIgnoredArgs() {
    return [
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages',
    ];
  }

  /**
   * Launch browser with the Chrome extension loaded
   * @param {Object} launchOptions - Additional launch options
   * @returns {Promise<BrowserManager>} Returns this instance for chaining
   */
  async launch(launchOptions = {}) {
    if (this.isInitialized) {
      return this;
    }

    const args = [...this._getDefaultArgs(), ...(launchOptions.args || [])];
    
    const contextOptions = {
      headless: false, // Extensions require headed mode
      args,
      ignoreDefaultArgs: this._getIgnoredArgs(),
      viewport: launchOptions.viewport || null,
      ...launchOptions,
    };

    // Remove args from launchOptions to avoid duplication
    delete contextOptions.args;
    contextOptions.args = args;

    this.context = await chromium.launchPersistentContext(
      this.options.userDataDir,
      contextOptions
    );

    // Extract extension ID using the dedicated extractor
    this.extensionId = await ExtensionIdExtractor.waitForExtensionIdWithFallback(
      this.context,
      { timeout: 30000 }
    );

    this.isInitialized = true;
    return this;
  }

  /**
   * Get the browser context
   * @returns {import('@playwright/test').BrowserContext}
   * @throws {Error} If browser not initialized
   */
  getContext() {
    this._ensureInitialized();
    return this.context;
  }

  /**
   * Get the extension ID
   * @returns {string}
   * @throws {Error} If browser not initialized
   */
  getExtensionId() {
    this._ensureInitialized();
    return this.extensionId;
  }

  /**
   * Get URL for the extension side panel
   * @returns {string}
   */
  getSidePanelUrl() {
    return `chrome-extension://${this.getExtensionId()}/${testConfig.sidePanelFile}`;
  }

  /**
   * Get URL for any extension page
   * @param {string} pagePath - Path to the page (e.g., 'options.html')
   * @returns {string}
   */
  getExtensionPageUrl(pagePath) {
    return `chrome-extension://${this.getExtensionId()}/${pagePath}`;
  }

  /**
   * Create a new page in the browser context
   * @returns {Promise<import('@playwright/test').Page>}
   */
  async newPage() {
    this._ensureInitialized();
    return await this.context.newPage();
  }

  /**
   * Get all pages in the context
   * @returns {import('@playwright/test').Page[]}
   */
  getPages() {
    this._ensureInitialized();
    return this.context.pages();
  }

  /**
   * Close a specific page
   * @param {import('@playwright/test').Page} page - Page to close
   */
  async closePage(page) {
    if (page && !page.isClosed()) {
      await page.close();
    }
  }

  /**
   * Close browser context and cleanup
   */
  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.extensionId = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if browser is initialized
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Ensure browser is initialized before operations
   * @private
   * @throws {Error} If browser not initialized
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('BrowserManager not initialized. Call launch() first.');
    }
  }

  /**
   * Create a BrowserManager instance for test use with user data directory
   * @param {string} testDir - Test directory path (for resolving user data dir)
   * @returns {BrowserManager}
   */
  static forTests(testDir) {
    const userDataDir = path.resolve(testDir, '..', 'test-user-data');
    return new BrowserManager({ userDataDir });
  }
}

module.exports = { BrowserManager };
