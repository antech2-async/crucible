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
    await expect(page.getByText(/Agents: \d+/i)).toBeVisible();

    // 4. Verify Metric Cards are rendered
    await expect(page.getByText('System Load', { exact: true })).toBeVisible();
    await expect(page.getByText('Active Nodes', { exact: true })).toBeVisible();
    await expect(page.getByText('Mesh Stability', { exact: true })).toBeVisible();

    // 5. Verify live operational panels exist
    await expect(page.getByText('Live Events Feed', { exact: true })).toBeVisible();
    await expect(page.getByText('Critical Agents', { exact: true })).toBeVisible();

    // 6. Verify latest task proof drill-down is wired.
    await expect(page.getByText('Latest Network Task', { exact: true })).toBeVisible();
    const proofLink = page.getByRole('link', { name: /View Full TEE Proof/i });
    await expect(proofLink).toHaveAttribute(
      'href',
      /\/tasks\?filter=(open|verifying|completed)&task=\d+#tee-proof/,
    );
  });

  test('should render an honest proof trail for tasks without TEE attestation', async ({
    page,
  }) => {
    await page.route('**/api/tasks', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          taskCount: 36,
          protocol: {
            protocolFeePercent: '2',
            defaultDisputeWindow: '86400',
            slashingJudge: '0x40918Ba7f132E0aCba2CE4de4c4baF9BD2D7D849',
            assignmentEngine: '0x0000000000000000000000000000000000000001',
          },
          tasks: [
            {
              id: 35,
              poster: '0x44Cc0000000000000000000000000000000092d1',
              totalPayment: '100000000000000',
              deadline: `${Math.floor(Date.now() / 1000) + 86400}`,
              status: 7,
              criteriaHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
              criteriaURI: '0g://criteria/35',
              isSequential: false,
              assignedAgents: ['0xbaD0000000000000000000000000000000000b07'],
              agentStakes: ['50000000000000000'],
              submittedCount: 1,
              auditReport: {
                taskId: 35,
                timestamp: Date.now(),
                results: [
                  {
                    agent: '0xbaD0000000000000000000000000000000000b07',
                    passed: false,
                    reasons: ['No TEE attestation recorded', 'Inadequate detail'],
                    outputHash: 'garbage_hash_defective',
                  },
                ],
              },
              proofs: [
                {
                  agent: '0xbaD0000000000000000000000000000000000b07',
                  agentClass: 'native',
                  submitted: true,
                  outputHash: 'garbage_hash_defective',
                  attestationHex: '0x',
                  verificationMode: 'hash-commitment',
                  auditPassed: false,
                  auditReasons: ['No TEE attestation recorded', 'Inadequate detail'],
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/tasks?filter=completed&task=35#tee-proof');

    await expect(page.getByText('TEE Proof Trail', { exact: true })).toBeVisible();
    await expect(page.getByText('Hash Commitment', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('No TEE attestation recorded').first()).toBeVisible();
    await expect(page.getByText('garbage_hash_defective')).toBeVisible();
    await expect(page.getByText('Slashing audit reasons', { exact: true })).toBeVisible();
  });
});
