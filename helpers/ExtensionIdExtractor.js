/**
 * ExtensionIdExtractor - Single source of truth for Chrome extension ID extraction
 * Follows Single Responsibility Principle (SRP)
 * 
 * This utility consolidates all extension ID extraction logic that was previously
 * duplicated across ExtensionHelper, SidePanelHelper, and BrowserManager.
 */
class ExtensionIdExtractor {
  /**
   * Extract extension ID from a Chrome extension URL
   * @param {string} url - URL starting with chrome-extension://
   * @returns {string|null} Extension ID or null if not valid
   */
  static extractIdFromUrl(url) {
    if (url && url.startsWith('chrome-extension://')) {
      return url.split('/')[2];
    }
    return null;
  }

  /**
   * Get extension ID from existing service workers
   * @param {import('@playwright/test').BrowserContext} context - Browser context
   * @returns {string|null} Extension ID or null if not found
   */
  static getFromServiceWorkers(context) {
    const workers = context.serviceWorkers();
    for (const sw of workers) {
      const id = this.extractIdFromUrl(sw.url());
      if (id) return id;
    }
    return null;
  }

  /**
   * Get extension ID from background pages (MV2 fallback)
   * @param {import('@playwright/test').BrowserContext} context - Browser context
   * @returns {string|null} Extension ID or null if not found
   */
  static getFromBackgroundPages(context) {
    const bgPages = context.backgroundPages();
    for (const bp of bgPages) {
      const id = this.extractIdFromUrl(bp.url());
      if (id) return id;
    }
    return null;
  }

  /**
   * Get extension ID from open pages
   * @param {import('@playwright/test').BrowserContext} context - Browser context
   * @returns {string|null} Extension ID or null if not found
   */
  static getFromPages(context) {
    const pages = context.pages();
    for (const page of pages) {
      const id = this.extractIdFromUrl(page.url());
      if (id) return id;
    }
    return null;
  }

  /**
   * Try all methods to get extension ID (synchronous check)
   * @param {import('@playwright/test').BrowserContext} context - Browser context
   * @returns {string|null} Extension ID or null if not found
   */
  static getExtensionId(context) {
    // Try service workers first (MV3)
    let extensionId = this.getFromServiceWorkers(context);
    if (extensionId) return extensionId;

    // Try background pages (MV2)
    extensionId = this.getFromBackgroundPages(context);
    if (extensionId) return extensionId;

    // Try extension pages
    extensionId = this.getFromPages(context);
    return extensionId;
  }

  /**
   * Wait for extension ID with polling and event listening
   * This is the primary method to use when launching a browser with extension
   * 
   * @param {import('@playwright/test').BrowserContext} context - Browser context
   * @param {Object} options - Configuration options
   * @param {number} options.timeout - Maximum wait time in ms (default: 30000)
   * @param {number} options.pollInterval - Polling interval in ms (default: 200)
   * @returns {Promise<string|null>} Extension ID or null if not found within timeout
   */
  static async waitForExtensionId(context, options = {}) {
    const { timeout = 30000, pollInterval = 200 } = options;
    const startTime = Date.now();

    // Set up event listener for new service workers
    let resolveFromEvent = null;
    const eventPromise = new Promise((resolve) => {
      resolveFromEvent = resolve;
      const handler = (sw) => {
        const id = this.extractIdFromUrl(sw.url());
        if (id) {
          context.off('serviceworker', handler);
          resolve(id);
        }
      };
      context.on('serviceworker', handler);
    });

    // Polling check
    const pollingPromise = (async () => {
      while (Date.now() - startTime < timeout) {
        const extensionId = this.getExtensionId(context);
        if (extensionId) return extensionId;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      return null;
    })();

    // Race between event and polling, with timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(null), timeout);
    });

    const extensionId = await Promise.race([
      eventPromise,
      pollingPromise,
      timeoutPromise,
    ]);

    // Clean up event listener
    if (resolveFromEvent) {
      resolveFromEvent(null);
    }

    return extensionId;
  }

  /**
   * Wait for extension ID with fallback navigation trigger
   * Use this when extension may not load immediately
   * 
   * @param {import('@playwright/test').BrowserContext} context - Browser context
   * @param {Object} options - Configuration options
   * @param {number} options.timeout - Maximum wait time in ms (default: 30000)
   * @param {string} options.triggerUrl - URL to navigate to trigger extension (default: google.com)
   * @returns {Promise<string>} Extension ID
   * @throws {Error} If extension ID cannot be extracted
   */
  static async waitForExtensionIdWithFallback(context, options = {}) {
    const { timeout = 30000, triggerUrl = 'https://www.google.com' } = options;

    // First attempt: wait for extension ID
    let extensionId = await this.waitForExtensionId(context, { timeout: timeout / 2 });

    if (!extensionId) {
      // Fallback: Navigate to trigger extension loading
      const tempPage = await context.newPage();
      try {
        await tempPage.goto(triggerUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await tempPage.waitForTimeout(2000);

        // Try again after navigation
        extensionId = await this.waitForExtensionId(context, { timeout: timeout / 2 });
      } finally {
        await tempPage.close();
      }
    }

    if (!extensionId) {
      throw new Error('Failed to extract extension ID. Verify extension path and manifest.json.');
    }

    return extensionId;
  }
}

module.exports = { ExtensionIdExtractor };

