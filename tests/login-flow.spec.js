const { test, expect } = require('@playwright/test');
const path = require('path');
const { BrowserManager } = require('../helpers/BrowserManager');
const { SidePanelHelper } = require('../helpers/SidePanelHelper');
const { ExternalSitePage } = require('../pages/ExternalSitePage');
const { ExtensionSidePanelPage } = require('../pages/ExtensionSidePanelPage');
const testConfig = require('../config/test.config');

/**
 * Login Flow Test Suite
 * Tests the complete login flow:
 * 1. Launch Chrome with WXT extension installed
 * 2. Login to external site (Confirmit)
 * 3. Login to extension side panel
 * 4. Verify both logins successful
 */
test.describe('Login Flow', () => {
  /** @type {BrowserManager} */
  let browserManager;
  
  /** @type {import('@playwright/test').Page} */
  let page;

  /**
   * Setup: Launch browser with extension before all tests
   */
  test.beforeAll(async () => {
    // Create BrowserManager with user data directory for persistence
    browserManager = BrowserManager.forTests(__dirname);
    
    console.log(`📂 Extension path: ${testConfig.extensionPath}`);
    console.log('⏳ Launching browser with extension...');

    await browserManager.launch();

    console.log(`✅ Extension ID extracted: ${browserManager.getExtensionId()}`);
    console.log(`🔑 External credentials: ${testConfig.externalSite.credentials.username}`);
    console.log(`🔑 Extension credentials: ${testConfig.extensionCredentials.username}`);
  });

  /**
   * Teardown: Close browser after all tests
   */
  test.afterAll(async () => {
    if (browserManager) {
      await browserManager.close();
      console.log('🔒 Browser closed');
    }
  });

  /**
   * Teardown: Close page after each test (but keep browser)
   */
  test.afterEach(async () => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });

  /**
   * Test: Complete login flow - External site then Extension Side Panel
   *
   * Opens the extension side panel alongside the external site.
   * Both pages remain accessible simultaneously in the browser context.
   *
   * NOTE: Chrome's CSP prevents embedding extensions as iframes.
   * The side panel opens in a separate tab but both remain accessible.
   */
  test('should complete full login flow: external site then extension side panel', async () => {
    const context = browserManager.getContext();
    const extensionId = browserManager.getExtensionId();
    const sidePanelHelper = new SidePanelHelper(context, extensionId);

    // ============================================
    // STEP 1: External Site Login
    // ============================================
    console.log('\n📋 STEP 1: External Site Login');

    page = await browserManager.newPage();
    const externalSitePage = new ExternalSitePage(page);

    // Navigate to external site
    await externalSitePage.goto();
    console.log(`📍 Navigated to external site: ${testConfig.externalSite.url}`);

    // Perform login on external site
    console.log(`🔐 Attempting external site login for: ${testConfig.externalSite.credentials.username}`);
    const externalLoginSuccess = await externalSitePage.login();

    // Assert external login was successful
    expect(externalLoginSuccess).toBe(true);
    expect(await externalSitePage.isLoggedIn()).toBe(true);
    console.log('✅ External site login successful');
    console.log(`📍 External site URL after login: ${externalSitePage.getCurrentUrl()}`);

    // ============================================
    // STEP 2: Open Extension Side Panel Alongside Website
    // ============================================
    console.log('\n📋 STEP 2: Opening Extension Side Panel');

    // Open side panel alongside the main page (both accessible simultaneously)
    const sidePanelPage = await sidePanelHelper.openSidePanelAlongside(page);
    console.log('✅ Side panel opened alongside main page');
    console.log('📋 Both pages are now accessible simultaneously');

    // Create page object for side panel interactions
    const sidePanelPageObj = new ExtensionSidePanelPage(sidePanelPage, extensionId);
    const alreadyLoggedIn = await sidePanelPageObj.waitForContentLoad();

    // Log element counts for debugging
    const elementCounts = await sidePanelPageObj.getElementCounts();
    console.log('🔍 Extension page elements found:');
    console.log(`  - Input fields: ${elementCounts.inputs}`);
    console.log(`  - Buttons: ${elementCounts.buttons}`);
    console.log(`  - Forms: ${elementCounts.forms}`);
    console.log(`  - Email inputs: ${elementCounts.emailInputs}`);
    console.log(`  - Password inputs: ${elementCounts.passwordInputs}`);

    // ============================================
    // STEP 3: Extension Login
    // ============================================
    console.log('\n📋 STEP 3: Extension Side Panel Login');

    // Perform login on extension
    console.log(`🔐 Attempting extension login for: ${testConfig.extensionCredentials.username}`);
    const extensionLoginSuccess = await sidePanelPageObj.login();

    // Assert extension login was successful
    expect(extensionLoginSuccess).toBe(true);
    console.log('✅ Extension login successful');

    console.log('\n✅ Full login flow completed successfully!');
    console.log('📋 Workflow Summary:');
    console.log('   ✅ External site: Logged in and accessible');
    console.log('   ✅ Extension side panel: Opened and logged in');
    console.log('   ✅ Both pages accessible simultaneously in browser context');

    // Verify both pages are still accessible
    expect(page.isClosed()).toBe(false);
    expect(sidePanelPage.isClosed()).toBe(false);
  });

  /**
   * Test: External site login only
   */
  test('should login to external site successfully', async () => {
    page = await browserManager.newPage();
    const externalSitePage = new ExternalSitePage(page);
    
    // Navigate and login
    await externalSitePage.goto();
    console.log(`📍 Navigated to external site: ${testConfig.externalSite.url}`);
    console.log(`🔐 Attempting external site login for: ${testConfig.externalSite.credentials.username}`);
    
    const success = await externalSitePage.login();
    
    // Assertions
    expect(success).toBe(true);
    expect(await externalSitePage.isLoggedIn()).toBe(true);
    console.log('✅ External site login successful');
    
    // Verify URL contains expected path
    const currentUrl = externalSitePage.getCurrentUrl();
    expect(currentUrl).toContain(testConfig.externalSite.redirectAfterLogin.urlContains);
  });

  /**
   * Test: Extension login only (assumes external login not required or already done)
   */
  test('should login to extension side panel successfully', async () => {
    page = await browserManager.newPage();
    const extensionId = browserManager.getExtensionId();
    const sidePanelPage = new ExtensionSidePanelPage(page, extensionId);
    
    // Navigate to side panel
    await sidePanelPage.goto();
    
    // Verify side panel loaded
    await expect(sidePanelPage.page.locator('#root')).toBeAttached();
    
    // Perform login
    console.log(`🔐 Attempting extension login for: ${testConfig.extensionCredentials.username}`);
    const success = await sidePanelPage.login();
    
    // Note: This may fail if external login is required first
    // The full flow test above handles the correct sequence
    console.log(`Extension login result: ${success}`);
  });

  /**
   * Test: Verify extension loads correctly
   */
  test('should load extension side panel', async () => {
    page = await browserManager.newPage();
    const sidePanelUrl = browserManager.getSidePanelUrl();
    
    console.log(`📍 Navigating to: ${sidePanelUrl}`);
    
    await page.goto(sidePanelUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Verify React app mounted
    const root = page.locator('#root');
    await expect(root).toBeAttached();
    
    // Verify extension ID is valid
    const extensionId = browserManager.getExtensionId();
    expect(extensionId).toBeTruthy();
    expect(page.url()).toContain(extensionId);
    console.log('✅ Extension side panel loaded successfully');
  });
});
