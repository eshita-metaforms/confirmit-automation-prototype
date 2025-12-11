const { chromium } = require('@playwright/test');
const testConfig = require('../config/test.config');

/**
 * Extension Helper - Reusable utilities for Chrome extension testing
 * Provides methods for launching browser with extension, getting extension ID,
 * and navigating to extension side panel
 */
class ExtensionHelper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.extensionId = null;
  }

  /**
   * Launch browser with the Chrome extension loaded
   * @returns {Promise<{browser: Browser, context: BrowserContext}>}
   */
  async launchBrowserWithExtension() {
    const pathToExtension = testConfig.extensionPath;

    this.context = await chromium.launchPersistentContext('', {
      headless: false, // Extensions require headed mode
      channel: 'chrome',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-first-run',
        '--disable-default-apps',
        '--disable-popup-blocking',
      ],
    });

    // Wait for extension to load
    await this.waitForExtensionLoad();

    return {
      browser: this.browser,
      context: this.context,
    };
  }

  /**
   * Wait for the extension service worker to be ready
   */
  async waitForExtensionLoad() {
    // Wait for service worker (Manifest V3)
    let serviceWorker;
    const timeout = testConfig.timeouts.extensionLoad;
    const startTime = Date.now();

    while (!serviceWorker && Date.now() - startTime < timeout) {
      [serviceWorker] = this.context.serviceWorkers();
      if (!serviceWorker) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (serviceWorker) {
      this.extensionId = serviceWorker.url().split('/')[2];
    } else {
      // Fallback: Try to get extension ID from background page (MV2) or pages
      const pages = this.context.pages();
      for (const page of pages) {
        const url = page.url();
        if (url.startsWith('chrome-extension://')) {
          this.extensionId = url.split('/')[2];
          break;
        }
      }
    }

    if (!this.extensionId) {
      throw new Error('Failed to get extension ID. Ensure the extension path is correct.');
    }

    return this.extensionId;
  }

  /**
   * Get the extension ID
   * @returns {string} The Chrome extension ID
   */
  getExtensionId() {
    if (!this.extensionId) {
      throw new Error('Extension ID not available. Call launchBrowserWithExtension first.');
    }
    return this.extensionId;
  }

  /**
   * Get the URL for the extension side panel
   * @returns {string} The side panel URL
   */
  getSidePanelUrl() {
    return `chrome-extension://${this.getExtensionId()}/${testConfig.sidePanelFile}`;
  }

  /**
   * Navigate to the extension side panel in a new page
   * Note: Side panels in extensions open via clicking the icon,
   * but for testing we can directly navigate to the side panel URL
   * @param {Page} page - Optional existing page to use
   * @returns {Promise<Page>} The page with side panel loaded
   */
  async navigateToSidePanel(page = null) {
    if (!page) {
      page = await this.context.newPage();
    }
    
    const sidePanelUrl = this.getSidePanelUrl();
    await page.goto(sidePanelUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for React app to mount (has #root div)
    await page.waitForSelector('#root', { state: 'attached' });
    
    return page;
  }

  /**
   * Get URL for any extension page
   * @param {string} pagePath - Path to the page (e.g., 'options.html', 'settings.html')
   * @returns {string} The full extension page URL
   */
  getExtensionPageUrl(pagePath) {
    return `chrome-extension://${this.getExtensionId()}/${pagePath}`;
  }

  /**
   * Close the browser context
   */
  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.extensionId = null;
    }
  }

  /**
   * Create a new page in the extension context
   * @returns {Promise<Page>}
   */
  async newPage() {
    if (!this.context) {
      throw new Error('Browser context not available. Call launchBrowserWithExtension first.');
    }
    return await this.context.newPage();
  }
}

// Export singleton instance for easy reuse
const extensionHelper = new ExtensionHelper();

module.exports = {
  ExtensionHelper,
  extensionHelper,
};


