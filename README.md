# Playwright Chrome Extension Test Suite

Test suite for testing a WXT Chrome extension (with side panel) login functionality using Playwright.

## Project Structure

```
├── chrome-mv3/                   # WXT extension build output
├── config/
│   └── test.config.js            # Test configuration and selectors
├── helpers/
│   └── extensionHelper.js        # Extension loading utilities
├── pages/
│   └── ExtensionSidePanelPage.js # Page Object for extension side panel
├── tests/
│   └── extension-login.spec.js   # Login test specifications
├── package.json
├── playwright.config.js
└── README.md
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
   
   Update the `selectors` object in `config/test.config.js` to match your extension's `data-test-id` attributes:
   ```javascript
   selectors: {
     usernameInput: '[data-test-id="username-input"]',
     passwordInput: '[data-test-id="password-input"]',
     loginButton: '[data-test-id="login-button"]',
     // ... other selectors
   }
   ```

5. **Configure test credentials:**
   
   Set via environment variables (recommended):
   ```bash
   export TEST_USERNAME=your-test-username
   export TEST_PASSWORD=your-test-password
   ```

## Running Tests

**Run all tests:**
```bash
npm test
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

## Important Notes

1. **Headed Mode Required:** Chrome extensions cannot be tested in headless mode. Tests automatically run with a visible browser.

2. **Single Worker:** Tests run sequentially (1 worker) since extensions require persistent browser context.

3. **Extension ID:** The extension ID is dynamically extracted after loading. No manual configuration needed.

4. **Side Panel URL:** Tests navigate to `chrome-extension://{extensionId}/sidepanel.html`. The extension uses a side panel (not popup) which opens when clicking the extension icon.

## Customization

### Adding New Page Objects

Create new page objects in `pages/` directory following the pattern:

```javascript
class YourPage {
  constructor(page, extensionId) {
    this.page = page;
    this.extensionId = extensionId;
    // Initialize locators
  }

  // Add methods for interactions
}

module.exports = { YourPage };
```

### Adding New Tests

Add test files in `tests/` directory with `.spec.js` extension. Follow the existing pattern for setup/teardown.

## Troubleshooting

- **Extension not loading:** Verify the extension path is correct and points to the built output directory.
- **Selectors not found:** Ensure `data-test-id` attributes in your extension match the selectors in config.
- **Timeout errors:** Increase timeout values in `config/test.config.js`.


