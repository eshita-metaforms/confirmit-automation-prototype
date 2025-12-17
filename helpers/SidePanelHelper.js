const { ExtensionIdExtractor } = require('./ExtensionIdExtractor');
const testConfig = require('../config/test.config');

/**
 * SidePanelHelper - Utilities for managing Chrome extension side panel
 * Follows Single Responsibility Principle - manages side panel alongside website
 * 
 * Uses ExtensionIdExtractor for extension ID extraction (DRY principle)
 */
class SidePanelHelper {
  /**
   * @param {import('@playwright/test').BrowserContext} context - Playwright browser context
   * @param {string} extensionId - Chrome extension ID
   */
  constructor(context, extensionId) {
    this.context = context;
    this.extensionId = extensionId;
    this.sidePanelPage = null;
    this.mainPage = null;
  }

  /**
   * Extract extension ID from service worker
   * Delegates to ExtensionIdExtractor for DRY compliance
   * 
   * @param {import('@playwright/test').BrowserContext} context
   * @param {number} timeout - Timeout in ms (default 30000)
   * @returns {Promise<string|null>} Extension ID or null if not found
   */
  static async getExtensionIdFromServiceWorker(context, timeout = 30000) {
    return await ExtensionIdExtractor.waitForExtensionId(context, { timeout });
  }

  /**
   * Get the side panel URL for this extension
   * @returns {string}
   */
  getSidePanelUrl() {
    return `chrome-extension://${this.extensionId}/${testConfig.sidePanelFile}`;
  }

  /**
   * Open side panel alongside the main page
   * Both pages remain accessible and can be used simultaneously
   *
   * @param {import('@playwright/test').Page} mainPage - The main website page
   * @returns {Promise<import('@playwright/test').Page>} The side panel page
   */
  async openSidePanelAlongside(mainPage) {
    this.mainPage = mainPage;
    this.sidePanelPage = await this.context.newPage();
    
    await this.sidePanelPage.goto(this.getSidePanelUrl());
    await this.sidePanelPage.waitForLoadState('domcontentloaded');
    await this.sidePanelPage.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    return this.sidePanelPage;
  }

  /**
   * Open side panel in a new page
   * @returns {Promise<import('@playwright/test').Page>}
   */
  async openSidePanelInNewPage() {
    this.sidePanelPage = await this.context.newPage();
    
    await this.sidePanelPage.goto(this.getSidePanelUrl());
    await this.sidePanelPage.waitForLoadState('domcontentloaded');
    await this.sidePanelPage.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    return this.sidePanelPage;
  }

  /**
   * Get both pages (main and side panel)
   * @returns {{mainPage: import('@playwright/test').Page, sidePanelPage: import('@playwright/test').Page}}
   */
  getPages() {
    return {
      mainPage: this.mainPage,
      sidePanelPage: this.sidePanelPage,
    };
  }

  /**
   * Get the side panel page
   * @returns {import('@playwright/test').Page|null}
   */
  getSidePanelPage() {
    return this.sidePanelPage;
  }

  /**
   * Get the main page
   * @returns {import('@playwright/test').Page|null}
   */
  getMainPage() {
    return this.mainPage;
  }

  /**
   * Close the side panel page
   * @returns {Promise<void>}
   */
  async closeSidePanel() {
    if (this.sidePanelPage && !this.sidePanelPage.isClosed()) {
      await this.sidePanelPage.close();
      this.sidePanelPage = null;
    }
  }

  /**
   * Check if side panel is open
   * @returns {boolean}
   */
  isSidePanelOpen() {
    return this.sidePanelPage !== null && !this.sidePanelPage.isClosed();
  }
}

module.exports = { SidePanelHelper };
