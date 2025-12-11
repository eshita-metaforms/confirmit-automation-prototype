const { test, expect } = require('@playwright/test');
const { ExtensionHelper } = require('../helpers/extensionHelper');
const { ExtensionSidePanelPage } = require('../pages/ExtensionSidePanelPage');
const testConfig = require('../config/test.config');

/**
 * Extension Login Test Suite
 * Tests login functionality via Chrome extension side panel
 */
test.describe('Extension Login', () => {
  /** @type {ExtensionHelper} */
  let extensionHelper;
  
  /** @type {ExtensionSidePanelPage} */
  let sidePanelPage;
  
  /** @type {import('@playwright/test').Page} */
  let page;

  /**
   * Setup: Launch browser with extension before all tests
   */
  test.beforeAll(async () => {
    extensionHelper = new ExtensionHelper();
    await extensionHelper.launchBrowserWithExtension();
  });

  /**
   * Setup: Create new page and navigate to side panel before each test
   */
  test.beforeEach(async () => {
    page = await extensionHelper.newPage();
    const extensionId = extensionHelper.getExtensionId();
    sidePanelPage = new ExtensionSidePanelPage(page, extensionId);
    await sidePanelPage.goto();
  });

  /**
   * Teardown: Close page after each test
   */
  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  /**
   * Teardown: Close browser context after all tests
   */
  test.afterAll(async () => {
    if (extensionHelper) {
      await extensionHelper.close();
    }
  });

  /**
   * Test: Verify login form is displayed on side panel load
   */
  test('should display login form on side panel', async () => {
    // Assert - Login form elements should be visible
    await expect(sidePanelPage.usernameInput).toBeVisible();
    await expect(sidePanelPage.passwordInput).toBeVisible();
    await expect(sidePanelPage.loginButton).toBeVisible();
  });

  /**
   * Test: Successfully login via extension side panel
   */
  test('should successfully login via extension side panel', async () => {
    // Arrange - Get test credentials
    const { username, password } = testConfig.testCredentials;

    // Act - Perform login
    await sidePanelPage.login(username, password);

    // Assert - Wait for and verify redirect
    const redirected = await sidePanelPage.waitForRedirect();
    expect(redirected).toBe(true);
    
    // Additional assertion - verify URL contains expected path
    const currentUrl = sidePanelPage.getCurrentUrl();
    expect(currentUrl).toContain(testConfig.redirectAfterLogin.urlContains);
  });

  /**
   * Test: Show error message with invalid credentials
   */
  test('should show error message with invalid credentials', async () => {
    // Arrange - Use invalid credentials
    const invalidCredentials = {
      username: 'invalid@example.com',
      password: 'wrongpassword',
    };

    // Act - Attempt login with invalid credentials
    await sidePanelPage.login(invalidCredentials.username, invalidCredentials.password);

    // Assert - Error message should be displayed
    // Wait a moment for the error to appear
    await page.waitForTimeout(1000);
    
    const isErrorVisible = await sidePanelPage.isErrorMessageVisible();
    expect(isErrorVisible).toBe(true);
  });

  /**
   * Test: Verify username field accepts input
   */
  test('should have username field accept input', async () => {
    // Arrange
    const testUsername = 'test@example.com';

    // Act
    await sidePanelPage.fillUsername(testUsername);

    // Assert
    const usernameValue = await sidePanelPage.getUsernameValue();
    expect(usernameValue).toBe(testUsername);
  });

  /**
   * Test: Verify password field accepts input
   */
  test('should have password field accept input', async () => {
    // Arrange
    const testPassword = 'testpassword';

    // Act
    await sidePanelPage.fillPassword(testPassword);

    // Assert
    const passwordValue = await sidePanelPage.getPasswordValue();
    expect(passwordValue).toBe(testPassword);
  });

  /**
   * Test: Verify form can be cleared
   */
  test('should clear form fields', async () => {
    // Arrange - Fill form first
    await sidePanelPage.fillUsername('test@example.com');
    await sidePanelPage.fillPassword('testpassword');

    // Act - Clear the form
    await sidePanelPage.clearForm();

    // Assert - Fields should be empty
    const usernameValue = await sidePanelPage.getUsernameValue();
    const passwordValue = await sidePanelPage.getPasswordValue();
    expect(usernameValue).toBe('');
    expect(passwordValue).toBe('');
  });
});


