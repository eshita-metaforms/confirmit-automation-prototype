# Extension Login Test Plan

## Overview
Test plan for the Chrome extension side panel login functionality.

## Application Under Test
- **Type**: Chrome Extension (WXT Framework)
- **UI Entry Point**: Side Panel (opens when clicking extension icon)
- **URL Pattern**: `chrome-extension://{extensionId}/sidepanel.html`

## Pre-requisites
1. Extension is loaded from `chrome-mv3` directory
2. Browser launched with extension flags
3. Extension ID is dynamically obtained from service worker

---

## Test Scenarios

### 1. Login Form Display
**Priority**: High

**Steps**:
1. Launch browser with extension loaded
2. Navigate to extension side panel URL
3. Wait for React app to mount (#root element)

**Expected Results**:
- Username input field is visible
- Password input field is visible
- Login button is visible
- Login form container is displayed

---

### 2. Valid Login
**Priority**: High

**Steps**:
1. Navigate to extension side panel
2. Enter valid username in username field
3. Enter valid password in password field
4. Click the login button
5. Wait for redirect/response

**Expected Results**:
- User is redirected to dashboard/home view
- URL contains expected path after login
- Login form is no longer visible
- User session is established

**Test Data**:
- Username: Use TEST_USERNAME environment variable
- Password: Use TEST_PASSWORD environment variable

---

### 3. Invalid Login
**Priority**: High

**Steps**:
1. Navigate to extension side panel
2. Enter invalid username
3. Enter invalid password
4. Click the login button

**Expected Results**:
- Error message is displayed
- User remains on login form
- No redirect occurs

**Test Data**:
- Username: `invalid@example.com`
- Password: `wrongpassword`

---

### 4. Form Input Validation
**Priority**: Medium

**Steps**:
1. Navigate to extension side panel
2. Enter text in username field
3. Verify input value
4. Enter text in password field
5. Verify input value

**Expected Results**:
- Username field accepts and displays input
- Password field accepts and displays input (masked)

---

### 5. Form Clear
**Priority**: Low

**Steps**:
1. Navigate to extension side panel
2. Fill username and password fields
3. Clear both fields

**Expected Results**:
- Both fields are empty after clearing
- Form is ready for new input

---

## Selectors (data-test-id)
Update these selectors to match your extension's actual attributes:

| Element | Selector |
|---------|----------|
| Username Input | `[data-test-id="username-input"]` |
| Password Input | `[data-test-id="password-input"]` |
| Login Button | `[data-test-id="login-button"]` |
| Login Form | `[data-test-id="login-form"]` |
| Error Message | `[data-test-id="error-message"]` |
| Success Indicator | `[data-test-id="success-indicator"]` |

---

## Notes
- Extension requires headed mode (headless: false)
- Extension ID is dynamically assigned by Chrome
- Side panel is a React application with #root container
- Tests should run sequentially (single worker)
