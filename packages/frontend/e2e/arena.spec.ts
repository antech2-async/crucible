import { test, expect } from '@playwright/test';

test.describe('Crucible Arena E2E Verification', () => {
  test('should load the arena dashboard successfully and display core UI components', async ({
    page,
  }) => {
    // Navigate to the main page
    await page.goto('/');

    // 1. Verify Page Metadata & Headers
    await expect(page).toHaveTitle(/Crucible Arena/i);
    await expect(page.getByRole('heading', { name: /Arena_Overview/i })).toBeVisible();

    // 2. Verify the screen uses the tactical command copy from the Arena view
    await expect(page.getByText(/Crucible network coordination/i)).toBeVisible();

    // 3. Verify the coordination mesh panel is present.
    await expect(page.getByText('Coordination Mesh', { exact: true })).toBeVisible();
    await expect(page.getByText(/Active: .* Nodes/i)).toBeVisible();

    // 4. Verify Metric Cards are rendered
    await expect(page.getByText('System Load', { exact: true })).toBeVisible();
    await expect(page.getByText('Active Nodes', { exact: true })).toBeVisible();
    await expect(page.getByText('Mesh Stability', { exact: true })).toBeVisible();

    // 5. Verify live operational panels exist
    await expect(page.getByText('Live Events Feed', { exact: true })).toBeVisible();
    await expect(page.getByText('Critical Agents', { exact: true })).toBeVisible();
  });
});
