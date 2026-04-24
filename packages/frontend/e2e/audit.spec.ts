import { test, expect } from '@playwright/test';

test('Audit App for console errors and failed requests', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`);
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait a bit for dynamic content
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'audit_screenshot.png', fullPage: true });

  const agentsCount = await page.locator('[class*="agent-card"], [class*="AgentCard"]').count();
  console.log(`Found ${agentsCount} agent cards.`);

  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
