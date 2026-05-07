import { chromium } from 'playwright';
import path from 'path';

async function auditApp() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const failedRequests: string[] = [];
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`);
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Take a screenshot to verify visual state
  const screenshotPath = path.join(process.cwd(), 'audit_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);

  // Check for specific content
  const agents = await page.locator('.agent-card, [class*="AgentCard"]').count();
  console.log(`Found ${agents} agent cards.`);

  // Log any errors found
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  } else {
    console.log('No console errors detected.');
  }

  if (failedRequests.length > 0) {
    console.log('Failed Requests:', failedRequests);
  } else {
    console.log('No failed network requests detected.');
  }

  await browser.close();
}

auditApp().catch(console.error);
