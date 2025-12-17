const { chromium } = require('@playwright/test');
const path = require('path');

async function debugExtension() {
  const extensionPath = path.resolve(__dirname, 'chrome-mv3');
  console.log('Extension path:', extensionPath);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    channel: 'chrome',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
    ],
    slowMo: 500, // Slow down to see what's happening
  });

  console.log('Browser launched, waiting 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n--- Service Workers ---');
  const sws = context.serviceWorkers();
  console.log('Count:', sws.length);
  for (const sw of sws) {
    console.log('SW URL:', sw.url());
  }

  console.log('\n--- Background Pages ---');
  const bgPages = context.backgroundPages();
  console.log('Count:', bgPages.length);
  for (const bp of bgPages) {
    console.log('BG URL:', bp.url());
  }

  console.log('\n--- All Pages ---');
  const pages = context.pages();
  console.log('Count:', pages.length);
  for (const p of pages) {
    console.log('Page URL:', p.url());
  }

  // Try navigating to the side panel directly with a guessed ID
  console.log('\n--- Trying to find extension ---');
  const page = await context.newPage();
  
  // Navigate to extensions page
  await page.goto('chrome://extensions/');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-extensions-page.png' });
  console.log('Screenshot saved to debug-extensions-page.png');

  // Keep browser open for manual inspection
  console.log('\nBrowser is open. Press Ctrl+C to close.');
  await new Promise(() => {}); // Keep running
}

debugExtension().catch(console.error);
