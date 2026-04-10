import { test, expect } from '@playwright/test';

test.describe('Crucible Arena E2E Verification', () => {
  test('should load the arena dashboard successfully and display core UI components', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');

    // 1. Verify Page Metadata & Headers
    await expect(page).toHaveTitle(/Crucible Arena/i); 
    await expect(page.locator('h1')).toContainText('Swarm Arena', { ignoreCase: true });
    
    // 2. Verify Spec Alignment text
    await expect(page.getByText('0G Galileo Testnet')).toBeVisible();

    // 3. Verify the empty state or loading state of the Agent Grid is present
    const isScanningTextVisible = await page.getByText(/Scanning 0G Network/i).isVisible();
    const isAgentsVisible = await page.locator('.grid').getByText('Active Agent Network').isVisible();
    
    // Either the scanning text is present, or the active agents section loaded. 
    // This allows the test to pass even if wagmi fails to connect to a live RPC.
    expect(isScanningTextVisible || isAgentsVisible).toBeTruthy();

    // 4. Verify Metric Cards are rendered
    await expect(page.getByText('Value Secured', { exact: true })).toBeVisible();
    await expect(page.getByText('Active Agents', { exact: true })).toBeVisible();
    await expect(page.getByText('Tasks Pipeline', { exact: true })).toBeVisible();

    // 5. Verify task open/live feeds exist
    await expect(page.getByText(/Live Verification/i)).toBeVisible();
    await expect(page.getByText(/Open Tasks/i)).toBeVisible();
  });
});
