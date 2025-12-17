const { test } = require('@playwright/test');
const { BrowserManager } = require('../helpers/BrowserManager');
const testConfig = require('../config/test.config');

/**
 * Seed Test for Playwright Test Agents
 * 
 * This test sets up the Chrome extension environment for the AI agents.
 * The Planner, Generator, and Healer agents use this as a starting point
 * to explore and generate tests for the extension.
 */
test.describe('Extension Seed', () => {
  test('seed - navigate to extension side panel', async () => {
    // Launch browser with extension using BrowserManager
    const browserManager = new BrowserManager();
    await browserManager.launch();

    try {
      const extensionId = browserManager.getExtensionId();
      console.log(`✅ Extension loaded with ID: ${extensionId}`);

      // Create page and navigate to side panel
      const page = await browserManager.newPage();
      const sidePanelUrl = browserManager.getSidePanelUrl();
      
      console.log(`📍 Navigating to: ${sidePanelUrl}`);
      
      await page.goto(sidePanelUrl);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('#root', { state: 'attached' });

      console.log('✅ Side panel loaded successfully');
      console.log('🤖 Browser ready for AI agents to explore');

      // Keep browser open for agents to explore
      // The agents will take over from here to plan/generate tests
    } finally {
      await browserManager.close();
    }
  });
});
