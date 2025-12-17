# Playwright Chrome Extension Test Suite

Test suite for testing a WXT Chrome extension (with side panel) login functionality using Playwright with AI Test Agents.

## Architecture

This project follows **SOLID principles** and **Page Object Model (POM)** design patterns for maintainable, scalable test automation.

### Design Principles Applied

| Principle | Implementation |
|-----------|----------------|
| **Single Responsibility (SRP)** | Each class has one job: `BrowserManager` manages browser lifecycle, `ExtensionIdExtractor` extracts IDs, Page Objects handle UI interactions |
| **Open/Closed (OCP)** | `BasePage` class allows extension without modification |
| **Liskov Substitution (LSP)** | All page objects extend `BasePage` and can be used interchangeably |
| **Interface Segregation (ISP)** | Helpers provide focused, minimal interfaces |
| **Dependency Inversion (DIP)** | Test files depend on abstractions (Page Objects, Helpers) not concrete implementations |
| **DRY** | Shared functionality in `BasePage`, single `ExtensionIdExtractor` used everywhere |

## Project Structure

```
├── chrome-mv3/                      # WXT extension build output
├── config/
│   └── test.config.js               # Test configuration, selectors, credentials
├── helpers/                         # Reusable utilities (SRP-focused)
│   ├── BrowserManager.js            # Browser lifecycle management
│   ├── ExtensionIdExtractor.js      # Extension ID extraction (single source of truth)
│   └── SidePanelHelper.js           # Side panel management alongside websites
├── pages/                           # Page Object Model implementation
│   ├── BasePage.js                  # Abstract base class for all page objects
│   ├── ExtensionSidePanelPage.js    # Extension side panel login page object
│   └── ExternalSitePage.js          # External site login page object
├── tests/                           # Test specifications
│   ├── seed.spec.js                 # Seed test for AI agents
│   ├── extension-login.spec.js      # Extension-only login tests
│   └── login-flow.spec.js           # Full flow tests (external + extension)
├── specs/                           # AI test planning documents
│   └── extension-login.md           # Test plan for login functionality
├── package.json
├── playwright.config.js
└── README.md
```

### Class Hierarchy

```
BasePage (Abstract)
├── ExtensionSidePanelPage    # Extension UI interactions
└── ExternalSitePage          # External site UI interactions

BrowserManager                # Browser lifecycle & extension loading
├── uses → ExtensionIdExtractor  # Single source of truth for ID extraction

SidePanelHelper               # Side panel alongside website management
├── uses → ExtensionIdExtractor  # Delegates ID extraction (DRY)
```

## Prerequisites

- Node.js 20.x, 22.x, or 24.x
- Google Chrome browser installed
- Your WXT extension built (`chrome-mv3` directory)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install chrome
   ```

3. **Extension path:**
   
   The extension path is already configured to use `./chrome-mv3` in the workspace.
   
   To override, set via environment variable:
   ```bash
   export EXTENSION_PATH=/path/to/your-extension/.output/chrome-mv3
   ```

4. **Configure test selectors:**
   
   Update the `extensionSelectors` object in `config/test.config.js` to match your extension's `data-test-id` attributes:
   ```javascript
   extensionSelectors: {
     usernameInput: '[data-test-id="username-input"]',
     passwordInput: '[data-test-id="password-input"]',
     loginButton: '[data-test-id="login-button"]',
     // ... other selectors
   }
   ```

5. **Configure test credentials:**
   
   Create a `.env` file or set via environment variables:
   ```bash
   # External site credentials
   export External_USERNAME=your-external-username
   export External_PASSWORD=your-external-password
   
   # Extension credentials
   export Extension_USERNAME=your-extension-username
   export Extension_PASSWORD=your-extension-password
   ```

## Running Tests

**Run all tests:**
```bash
npm test
```

**Run full login flow test:**
```bash
npx playwright test tests/login-flow.spec.js --project=extension-tests --grep "should complete full login flow"
```

**Run tests in headed mode (visible browser):**
```bash
npm run test:headed
```

**Run tests in debug mode:**
```bash
npm run test:debug
```

**Run tests with UI:**
```bash
npm run test:ui
```

**View test report:**
```bash
npm run report
```

---

## Helpers Reference

### BrowserManager

Central manager for browser lifecycle with Chrome extension support.

```javascript
const { BrowserManager } = require('./helpers/BrowserManager');

// Create instance with user data directory
const browserManager = BrowserManager.forTests(__dirname);

// Or create with custom options
const browserManager = new BrowserManager({ userDataDir: '/path/to/data' });

// Launch browser with extension
await browserManager.launch();

// Get extension ID
const extensionId = browserManager.getExtensionId();

// Get side panel URL
const sidePanelUrl = browserManager.getSidePanelUrl();

// Create new page
const page = await browserManager.newPage();

// Cleanup
await browserManager.close();
```

### ExtensionIdExtractor

Single source of truth for Chrome extension ID extraction. Used internally by `BrowserManager` and `SidePanelHelper`.

```javascript
const { ExtensionIdExtractor } = require('./helpers/ExtensionIdExtractor');

// Quick check for extension ID
const id = ExtensionIdExtractor.getExtensionId(context);

// Wait for extension to load with timeout
const id = await ExtensionIdExtractor.waitForExtensionId(context, { timeout: 30000 });

// Wait with fallback navigation trigger
const id = await ExtensionIdExtractor.waitForExtensionIdWithFallback(context);
```

### SidePanelHelper

Manages extension side panel alongside main website pages.

```javascript
const { SidePanelHelper } = require('./helpers/SidePanelHelper');

const helper = new SidePanelHelper(context, extensionId);

// Open side panel alongside main page
const sidePanelPage = await helper.openSidePanelAlongside(mainPage);

// Get both pages
const { mainPage, sidePanelPage } = helper.getPages();

// Close side panel
await helper.closeSidePanel();
```

---

## Page Objects Reference

### BasePage

Abstract base class providing common functionality for all page objects.

**Methods:**
- `waitForVisible(locator, timeout)` - Wait for element visibility
- `waitForHidden(locator, timeout)` - Wait for element to hide
- `safeFill(locator, value)` - Wait and fill input
- `safeClick(locator)` - Wait and click element
- `isVisible(locator)` - Check visibility (non-blocking)
- `getText(locator)` - Get element text content
- `getInputValue(locator)` - Get input value
- `waitForUrlContains(urlPart, timeout)` - Wait for URL change
- `getCurrentUrl()` - Get current page URL

### ExtensionSidePanelPage

Page object for extension side panel login functionality.

```javascript
const { ExtensionSidePanelPage } = require('./pages/ExtensionSidePanelPage');

const sidePanelPage = new ExtensionSidePanelPage(page, extensionId);

// Navigate to side panel
await sidePanelPage.goto();

// Wait for content to load
await sidePanelPage.waitForContentLoad();

// Perform login
const success = await sidePanelPage.login(username, password);

// Individual actions
await sidePanelPage.fillUsername(username);
await sidePanelPage.fillPassword(password);
await sidePanelPage.clickLogin();

// Check states
const isLoggedIn = await sidePanelPage.waitForLoginSuccess();
const hasError = await sidePanelPage.isErrorMessageVisible();
```

### ExternalSitePage

Page object for external site login functionality.

```javascript
const { ExternalSitePage } = require('./pages/ExternalSitePage');

const externalPage = new ExternalSitePage(page);

// Navigate to external site
await externalPage.goto();

// Perform login (handles multi-step forms automatically)
const success = await externalPage.login(username, password);

// Check states
const isLoggedIn = await externalPage.isLoggedIn();
const hasError = await externalPage.isErrorVisible();
```

---

## Playwright Test Agents (AI-Powered)

This project supports Playwright's AI Test Agents: **Planner**, **Generator**, and **Healer**.

### Setup Agents

Initialize the agents for VS Code/Cursor:
```bash
npm run init-agents
```

This creates agent definition files that work with your AI assistant.

### Using the Agents

#### 1. Planner Agent
The Planner explores your extension and creates test plans in Markdown.

**Example prompt:**
```
Generate a test plan for the extension login flow and save it as specs/login.md
```

A sample test plan is already provided at `specs/extension-login.md`.

#### 2. Generator Agent
The Generator converts test plans into executable Playwright tests.

**Example prompt:**
```
Generate Playwright tests for the "Valid Login" section of specs/extension-login.md
```

#### 3. Healer Agent
The Healer fixes broken tests by inspecting the UI and updating selectors.

**Example prompt:**
```
Run the failing tests and fix them
```

### Seed Test

The `tests/seed.spec.js` provides a starting point for the agents:
- Launches Chrome with the extension loaded
- Navigates to the side panel
- Sets up the environment for agents to explore

---

## Important Notes

1. **Headed Mode Required:** Chrome extensions cannot be tested in headless mode. Tests automatically run with a visible browser.

2. **Single Worker:** Tests run sequentially (1 worker) since extensions require persistent browser context.

3. **Extension ID:** The extension ID is dynamically extracted after loading using `ExtensionIdExtractor`. No manual configuration needed.

4. **Side Panel Testing:** Extension side panels open as separate tabs in automated tests because Playwright cannot simulate clicking the extension icon in the browser toolbar. In real usage, side panels appear as overlays on the current page.

## Testing Approach

### Extension Side Panel Behavior

**In Real Browser Usage:**
- User clicks extension icon in toolbar
- Side panel opens as an overlay/sidebar on the current page
- Extension content appears alongside the main webpage

**In Automated Testing:**
- Tests open extension URL directly: `chrome-extension://{id}/sidepanel.html`
- Extension opens in a separate browser tab
- Login flow and functionality remain identical
- Both external site and extension remain accessible simultaneously

This approach ensures the login flow works correctly while accommodating Playwright's testing limitations.

## Adding New Page Objects

Create new page objects in `pages/` directory following the pattern:

```javascript
const { BasePage } = require('./BasePage');

class YourPage extends BasePage {
  constructor(page) {
    super(page);
    this._initLocators();
  }

  _initLocators() {
    this.someElement = this.page.locator('[data-test-id="some-element"]');
  }

  async someAction() {
    await this.safeClick(this.someElement);
  }
}

module.exports = { YourPage };
```

## Adding New Tests

Add test files in `tests/` directory with `.spec.js` extension. Follow the existing pattern for setup/teardown using `BrowserManager`.

```javascript
const { test, expect } = require('@playwright/test');
const { BrowserManager } = require('../helpers/BrowserManager');
const { YourPage } = require('../pages/YourPage');

test.describe('Your Test Suite', () => {
  let browserManager;
  let page;

  test.beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch();
  });

  test.afterAll(async () => {
    await browserManager.close();
  });

  test('should do something', async () => {
    page = await browserManager.newPage();
    const yourPage = new YourPage(page);
    // ... test logic
  });
});
```

## Troubleshooting

- **Extension not loading:** Verify the extension path is correct and points to the built output directory.
- **Selectors not found:** Ensure `data-test-id` attributes in your extension match the selectors in config.
- **Timeout errors:** Increase timeout values in `config/test.config.js`.
- **Extension ID extraction fails:** Check that your extension has a valid `manifest.json` and service worker.
