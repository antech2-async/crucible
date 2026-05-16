# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: arena.spec.ts >> Crucible Arena E2E Verification >> should load the arena dashboard successfully and display core UI components
- Location: e2e/arena.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Arena_Overview/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Arena_Overview/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "Crucible home" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e9]
          - generic [ref=e13]:
            - generic [ref=e14]: CRUCIBLE
            - generic [ref=e15]: Agent Trust Layer
        - generic [ref=e16]: 0G Galileo Testnet
      - generic [ref=e18]:
        - button [ref=e19] [cursor=pointer]:
          - img [ref=e20]
        - button "Settings" [ref=e24] [cursor=pointer]:
          - img [ref=e25]
        - button "Connect Wallet" [ref=e28] [cursor=pointer]
    - complementary [ref=e29]:
      - navigation [ref=e30]:
        - link "Arena" [ref=e31] [cursor=pointer]:
          - /url: /
          - img [ref=e32]
          - text: Arena
        - link "Agents" [ref=e41] [cursor=pointer]:
          - /url: /agents
          - img [ref=e42]
          - text: Agents
        - link "Tasks" [ref=e47] [cursor=pointer]:
          - /url: /tasks
          - img [ref=e48]
          - text: Tasks
        - link "Stake" [ref=e51] [cursor=pointer]:
          - /url: /stake
          - img [ref=e52]
          - text: Stake
        - link "Admin" [ref=e57] [cursor=pointer]:
          - /url: /admin
          - img [ref=e58]
          - text: Admin
      - generic [ref=e61]:
        - link "Support" [ref=e62] [cursor=pointer]:
          - /url: /admin
          - img [ref=e63]
          - text: Support
        - link "Task Log" [ref=e66] [cursor=pointer]:
          - /url: /tasks
          - img [ref=e67]
          - text: Task Log
    - main [ref=e69]:
      - generic [ref=e70]:
        - generic [ref=e71]:
          - heading "Arena Overview" [level=1] [ref=e72]
          - paragraph [ref=e73]: Live view of registered agents, task activity, and trust health across Crucible.
        - generic [ref=e74]:
          - generic [ref=e75]:
            - generic [ref=e76]:
              - generic [ref=e77]:
                - img [ref=e78]
                - heading "Agent Trust Mesh" [level=2] [ref=e84]
              - generic [ref=e85]:
                - generic [ref=e86]: "Top Agents: 5/5"
                - generic [ref=e87]: "Registered: 5"
            - generic [ref=e88]:
              - generic [ref=e89]:
                - generic [ref=e90]: "TOP_AGENT_FEED: SYNCED"
                - generic [ref=e91]: "RANK: TRUST_SCORE"
                - generic [ref=e92]: "SOURCE: AGENTS API + REGISTRY"
              - img [ref=e101]:
                - generic [ref=e107]:
                  - generic "0x2Fec...dE3b rank 1, score 86.4%, tier 3" [ref=e136] [cursor=pointer]:
                    - generic [ref=e142]: "#1 INFT"
                    - generic [ref=e143]:
                      - generic [ref=e145]: 0x2Fec...dE3b
                      - generic [ref=e146]: 86.4% / T3
                  - generic "0x614C...78C9 rank 2, score 73.0%, tier 2" [ref=e147] [cursor=pointer]:
                    - generic [ref=e153]: "#2 INFT"
                    - generic [ref=e154]:
                      - generic [ref=e156]: 0x614C...78C9
                      - generic [ref=e157]: 73.0% / T2
                  - generic "0x8856...2aba rank 3, score 47.7%, tier 1" [ref=e158] [cursor=pointer]:
                    - generic [ref=e164]: "#3 INFT"
                    - generic [ref=e165]:
                      - generic [ref=e167]: 0x8856...2aba
                      - generic [ref=e168]: 47.7% / T1
                  - generic "0x727d...20a8 rank 4, score 23.3%, tier 2" [ref=e169] [cursor=pointer]:
                    - generic [ref=e175]: "#4 EXT"
                    - generic [ref=e176]:
                      - generic [ref=e178]: 0x727d...20a8
                      - generic [ref=e179]: 23.3% / T2
                  - generic "0x91dd...0D35 rank 5, score 8.0%, tier 0" [ref=e180] [cursor=pointer]:
                    - generic [ref=e186]: "#5 INFT"
                    - generic [ref=e187]:
                      - generic [ref=e189]: 0x91dd...0D35
                      - generic [ref=e190]: 8.0% / T0
            - generic [ref=e191]:
              - generic [ref=e192]:
                - paragraph [ref=e193]: Agent Feed
                - paragraph [ref=e194]: Live
              - generic [ref=e195]:
                - paragraph [ref=e196]: Posted Tasks
                - paragraph [ref=e197]: 36 Tasks
              - generic [ref=e198]:
                - paragraph [ref=e199]: Avg Trust
                - paragraph [ref=e200]: 47.7%
          - generic [ref=e201]:
            - generic [ref=e203]:
              - generic [ref=e204]:
                - heading "Average Trust" [level=3] [ref=e205]
                - generic [ref=e206]: 47.7%
              - img [ref=e208]
            - generic [ref=e214]:
              - generic [ref=e215]:
                - heading "Registered Agents" [level=3] [ref=e216]
                - generic [ref=e217]: "5"
              - img [ref=e219]
            - generic [ref=e228]:
              - generic [ref=e229]:
                - generic [ref=e230]:
                  - heading "Network Trust" [level=3] [ref=e231]
                  - generic [ref=e232]: Critical
                - img [ref=e233]
              - paragraph [ref=e236]: Based on AgentRegistry history, completed tasks, and slashing events.
            - generic [ref=e237]:
              - heading "Latest Escrow Task" [level=3] [ref=e238]
              - generic [ref=e239]:
                - generic [ref=e240]:
                  - generic [ref=e241]:
                    - generic [ref=e242]:
                      - img [ref=e243]
                      - 'heading "Task #35" [level=3] [ref=e247]'
                    - paragraph [ref=e248]: From 0x44Cc...92d1
                  - generic [ref=e249]:
                    - paragraph [ref=e250]: 0.0001 0G
                    - generic [ref=e251]:
                      - img [ref=e252]
                      - text: Expired
                - paragraph [ref=e256]: "Failed: no passing proof trail recorded"
                - link "View Verification Proof" [ref=e257] [cursor=pointer]:
                  - /url: /tasks?filter=completed&task=35#tee-proof
                  - text: View Verification Proof
                  - img [ref=e258]
                - generic [ref=e262]: "Status: FAILED"
                - paragraph [ref=e263]: "Source: TaskEscrow + 0G Storage"
          - generic [ref=e264]:
            - generic [ref=e265]:
              - generic [ref=e266]:
                - img [ref=e267]
                - heading "Protocol Events" [level=2] [ref=e270]
              - generic [ref=e271]: Watching
            - generic [ref=e274]:
              - generic [ref=e275]: "--:--:--"
              - generic [ref=e276]:
                - img [ref=e278]
                - generic [ref=e280]:
                  - generic [ref=e281]: No contract events yet
                  - generic [ref=e282]: Waiting for TaskEscrow or AgentRegistry events from this browser session.
          - generic [ref=e283]:
            - generic [ref=e284]:
              - heading "Top Reliability Agents" [level=3] [ref=e285]
              - link "Open Agent Registry" [ref=e286] [cursor=pointer]:
                - /url: /agents
                - text: Open Agent Registry
                - img [ref=e287]
            - generic [ref=e289]:
              - generic [ref=e290]:
                - generic [ref=e291]:
                  - img [ref=e293]
                  - generic [ref=e295]:
                    - paragraph [ref=e296]: 0x2Fec...dE3b
                    - paragraph [ref=e297]: Native agent / 18 completed tasks
                - generic [ref=e299]:
                  - generic [ref=e300]: Reliability Index
                  - generic [ref=e301]: 86.4%
                - generic [ref=e305]: Active
              - generic [ref=e306]:
                - generic [ref=e307]:
                  - img [ref=e309]
                  - generic [ref=e311]:
                    - paragraph [ref=e312]: 0x614C...78C9
                    - paragraph [ref=e313]: Native agent / 14 completed tasks
                - generic [ref=e315]:
                  - generic [ref=e316]: Reliability Index
                  - generic [ref=e317]: 73.0%
                - generic [ref=e321]: Active
              - generic [ref=e322]:
                - generic [ref=e323]:
                  - img [ref=e325]
                  - generic [ref=e327]:
                    - paragraph [ref=e328]: 0x8856...2aba
                    - paragraph [ref=e329]: Native agent / 14 completed tasks
                - generic [ref=e331]:
                  - generic [ref=e332]: Reliability Index
                  - generic [ref=e333]: 47.7%
                - generic [ref=e337]: Active
    - contentinfo [ref=e338]:
      - generic [ref=e339]: © 2026 Crucible Industrial Agents
      - generic [ref=e340]:
        - generic [ref=e341]: "Network: 42.5k TPS"
        - generic [ref=e342]: "Protocol: v4.0.2"
        - generic [ref=e343]: "Status: Operational"
  - button "Open Next.js Dev Tools" [ref=e350] [cursor=pointer]:
    - img [ref=e351]
  - alert [ref=e354]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Crucible Arena E2E Verification', () => {
  4   |   test('should load the arena dashboard successfully and display core UI components', async ({
  5   |     page,
  6   |   }) => {
  7   |     // Navigate to the main page
  8   |     await page.goto('/');
  9   | 
  10  |     // 1. Verify Page Metadata & Headers
  11  |     await expect(page).toHaveTitle(/Crucible Arena/i);
> 12  |     await expect(page.getByRole('heading', { name: /Arena_Overview/i })).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  13  | 
  14  |     // 2. Verify the screen uses the tactical command copy from the Arena view
  15  |     await expect(page.getByText(/Crucible network coordination/i)).toBeVisible();
  16  | 
  17  |     // 3. Verify the coordination mesh panel is present.
  18  |     await expect(page.getByText('Agent Trust Mesh', { exact: true })).toBeVisible();
  19  |     await expect(page.getByText(/Registered: \d+/i)).toBeVisible();
  20  | 
  21  |     // 4. Verify Metric Cards are rendered
  22  |     await expect(page.getByText('Avg Trust Score', { exact: true })).toBeVisible();
  23  |     await expect(page.getByText('Registered Agents', { exact: true })).toBeVisible();
  24  |     await expect(page.getByText('Trust Health', { exact: true })).toBeVisible();
  25  | 
  26  |     // 5. Verify live operational panels exist
  27  |     await expect(page.getByText('Contract Events', { exact: true })).toBeVisible();
  28  |     await expect(page.getByText('Top Trusted Agents', { exact: true })).toBeVisible();
  29  | 
  30  |     // 6. Verify latest task proof drill-down is wired.
  31  |     await expect(page.getByText('Latest TaskEscrow Task', { exact: true })).toBeVisible();
  32  |     const proofLink = page.getByRole('link', { name: /View Full TEE Proof/i });
  33  |     await expect(proofLink).toHaveAttribute(
  34  |       'href',
  35  |       /\/tasks\?filter=(open|verifying|completed)&task=\d+#tee-proof/,
  36  |     );
  37  |   });
  38  | 
  39  |   test('should render an honest proof trail for tasks without TEE attestation', async ({
  40  |     page,
  41  |   }) => {
  42  |     await page.route('**/api/tasks', async (route) => {
  43  |       await route.fulfill({
  44  |         contentType: 'application/json',
  45  |         body: JSON.stringify({
  46  |           taskCount: 36,
  47  |           protocol: {
  48  |             protocolFeePercent: '2',
  49  |             defaultDisputeWindow: '86400',
  50  |             slashingJudge: '0x40918Ba7f132E0aCba2CE4de4c4baF9BD2D7D849',
  51  |             assignmentEngine: '0x0000000000000000000000000000000000000001',
  52  |           },
  53  |           tasks: [
  54  |             {
  55  |               id: 35,
  56  |               poster: '0x44Cc0000000000000000000000000000000092d1',
  57  |               totalPayment: '100000000000000',
  58  |               deadline: `${Math.floor(Date.now() / 1000) + 86400}`,
  59  |               status: 7,
  60  |               criteriaHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
  61  |               criteriaURI: '0g://criteria/35',
  62  |               isSequential: false,
  63  |               assignedAgents: ['0xbaD0000000000000000000000000000000000b07'],
  64  |               agentStakes: ['50000000000000000'],
  65  |               submittedCount: 1,
  66  |               auditReport: {
  67  |                 taskId: 35,
  68  |                 timestamp: Date.now(),
  69  |                 results: [
  70  |                   {
  71  |                     agent: '0xbaD0000000000000000000000000000000000b07',
  72  |                     passed: false,
  73  |                     reasons: ['No TEE attestation recorded', 'Inadequate detail'],
  74  |                     outputHash: 'garbage_hash_defective',
  75  |                   },
  76  |                 ],
  77  |               },
  78  |               proofs: [
  79  |                 {
  80  |                   agent: '0xbaD0000000000000000000000000000000000b07',
  81  |                   agentClass: 'native',
  82  |                   submitted: true,
  83  |                   outputHash: 'garbage_hash_defective',
  84  |                   attestationHex: '0x',
  85  |                   verificationMode: 'hash-commitment',
  86  |                   auditPassed: false,
  87  |                   auditReasons: ['No TEE attestation recorded', 'Inadequate detail'],
  88  |                 },
  89  |               ],
  90  |             },
  91  |           ],
  92  |         }),
  93  |       });
  94  |     });
  95  | 
  96  |     await page.goto('/tasks?filter=completed&task=35#tee-proof');
  97  | 
  98  |     await expect(page.getByText('TEE Proof Trail', { exact: true })).toBeVisible();
  99  |     await expect(page.getByText('Hash Commitment', { exact: true }).first()).toBeVisible();
  100 |     await expect(page.getByText('No TEE attestation recorded').first()).toBeVisible();
  101 |     await expect(page.getByText('garbage_hash_defective')).toBeVisible();
  102 |     await expect(page.getByText('Slashing audit reasons', { exact: true })).toBeVisible();
  103 |   });
  104 | });
  105 | 
```