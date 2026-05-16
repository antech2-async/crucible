# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: arena.spec.ts >> Crucible Arena E2E Verification >> should render an honest proof trail for tasks without TEE attestation
- Location: e2e/arena.spec.ts:39:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('TEE Proof Trail', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('TEE Proof Trail', { exact: true })

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
        - generic [ref=e72]:
          - generic [ref=e73]:
            - img [ref=e74]
            - text: Tasks / Task Escrow
          - heading "Task Escrow" [level=1] [ref=e76]
          - paragraph [ref=e77]: Create task locks, track agent assignment, follow verification, and see which stake is at risk. Contract state comes from TaskEscrow; proof records come from 0G Storage when available.
        - generic [ref=e78]:
          - generic [ref=e79]:
            - generic [ref=e82]:
              - generic [ref=e84]:
                - generic [ref=e85]:
                  - generic [ref=e86]: "Task #035"
                  - generic [ref=e87]: "Status: Failed"
                - heading "Failed Task" [level=2] [ref=e88]
                - paragraph [ref=e89]: Task criteria hash 0x11111111...11111111, posted by 0x44Cc...92d1. Payment returned or failed.
              - generic [ref=e90]:
                - generic [ref=e91]:
                  - paragraph [ref=e92]: Total Payout
                  - paragraph [ref=e93]: 0.0001 0G
                - generic [ref=e94]:
                  - paragraph [ref=e95]: Agent Stake
                  - paragraph [ref=e96]: 0.05 0G
                - generic [ref=e97]:
                  - paragraph [ref=e98]: Deadline
                  - paragraph [ref=e99]: 1d 0h
              - generic [ref=e100]:
                - generic [ref=e101]:
                  - paragraph [ref=e102]: Task Lifecycle
                  - generic [ref=e103]: "Source: TaskEscrow"
                - generic [ref=e104]:
                  - generic [ref=e105]:
                    - paragraph [ref=e108]: Posted
                    - paragraph [ref=e109]: Poster 0x44Cc...92d1
                  - generic [ref=e110]:
                    - paragraph [ref=e113]: Assigned
                    - paragraph [ref=e114]: 1 agent locked
                  - generic [ref=e115]:
                    - paragraph [ref=e118]: Submitted
                    - paragraph [ref=e119]: 1/1 outputs
                  - generic [ref=e120]:
                    - paragraph [ref=e123]: Verified
                    - paragraph [ref=e124]: Payment returned or failed
                  - generic [ref=e125]:
                    - paragraph [ref=e128]: Resolved
                    - paragraph [ref=e129]: No TEE attestation recorded
              - generic [ref=e130]:
                - link "Post New Task" [ref=e131] [cursor=pointer]:
                  - /url: "#create-escrow-task"
                - button "Copy Criteria Link" [ref=e132] [cursor=pointer]:
                  - img [ref=e133]
                  - text: Copy Criteria Link
            - generic [ref=e136]:
              - generic [ref=e137]:
                - generic [ref=e138]:
                  - generic [ref=e139]:
                    - img [ref=e140]
                    - text: Verification Proof Trail
                  - paragraph [ref=e143]: Native agents count as TEE verified only when TaskEscrow records non-empty attestation bytes. External or failed submissions are shown as hash commitments or missing proofs.
                  - generic [ref=e144]:
                    - generic [ref=e145]: "Source: TaskEscrow proof mappings"
                    - generic [ref=e146]: "Audit: 0G Storage when present"
                - generic [ref=e147]:
                  - generic [ref=e148]: Failed
                  - generic [ref=e149]: Hash commitment
              - generic [ref=e150]:
                - generic [ref=e151]:
                  - paragraph [ref=e152]: Task
                  - paragraph [ref=e153]: "#35"
                - generic [ref=e154]:
                  - paragraph [ref=e155]: Submissions
                  - paragraph [ref=e156]: 1/1
                - generic [ref=e157]:
                  - paragraph [ref=e158]: TEE Proofs
                  - paragraph [ref=e159]: "0"
                - generic [ref=e160]:
                  - paragraph [ref=e161]: Missing
                  - paragraph [ref=e162]: "0"
              - generic [ref=e164]:
                - generic [ref=e165]:
                  - paragraph [ref=e166]: Agent Identity
                  - generic [ref=e167]:
                    - generic [ref=e168]: 0xbaD0...0b07
                    - generic [ref=e169]: Hash Commitment
                  - generic [ref=e170]:
                    - paragraph [ref=e171]: "Agent Type: native"
                    - paragraph [ref=e172]: "Submitted: Yes"
                    - paragraph [ref=e173]: "Audit: Failed"
                  - paragraph [ref=e174]: No TEE attestation recorded, Inadequate detail
                - generic [ref=e175]:
                  - paragraph [ref=e176]: Proof Trail
                  - generic [ref=e177]:
                    - paragraph [ref=e178]: Output Hash / 0G Storage Commit
                    - paragraph [ref=e179]: garbage_hash_defective
                  - generic [ref=e180]:
                    - paragraph [ref=e181]: TEE Proof Record
                    - paragraph [ref=e182]: No TEE attestation recorded. This submission is traceable through its output hash and audit verdict only.
              - generic [ref=e183]:
                - paragraph [ref=e184]: Slashing reasons
                - paragraph [ref=e186]: "0xbaD0...0b07: No TEE attestation recorded, Inadequate detail"
            - generic [ref=e187]:
              - generic [ref=e188]:
                - generic [ref=e189]:
                  - generic [ref=e190]:
                    - img [ref=e191]
                    - text: Escrow Task List
                  - paragraph [ref=e194]: Latest task locks from the TaskEscrow contract.
                - generic [ref=e195]:
                  - link "Open 0" [ref=e196] [cursor=pointer]:
                    - /url: /tasks?filter=open&task=35#escrow-registry
                  - link "Verifying 0" [ref=e197] [cursor=pointer]:
                    - /url: /tasks?filter=verifying&task=35#escrow-registry
                  - link "Completed 1" [ref=e198] [cursor=pointer]:
                    - /url: /tasks?filter=completed&task=35#escrow-registry
              - 'link "Task #035 0x11111111...11111111 Payout 0.0001 0G Agents 1 Failed View" [ref=e200] [cursor=pointer]':
                - /url: /tasks?filter=completed&task=35#escrow-detail
                - generic [ref=e201]:
                  - paragraph [ref=e204]: "Task #035"
                  - paragraph [ref=e205]: 0x11111111...11111111
                - generic [ref=e206]:
                  - paragraph [ref=e207]: Payout
                  - paragraph [ref=e208]: 0.0001 0G
                - generic [ref=e209]:
                  - paragraph [ref=e210]: Agents
                  - paragraph [ref=e211]: "1"
                - generic [ref=e212]:
                  - generic [ref=e213]: Failed
                  - generic [ref=e214]: View
                  - img [ref=e215]
          - complementary [ref=e217]:
            - generic [ref=e218]:
              - generic [ref=e219]:
                - paragraph [ref=e220]: Stake Coverage
                - img [ref=e221]
              - generic [ref=e225]:
                - paragraph [ref=e226]: 50000%
                - paragraph [ref=e227]: Stake Cover
              - paragraph [ref=e228]: Stake coverage is derived from assigned agent collateral against the task payout.
            - generic [ref=e229]:
              - generic [ref=e230]:
                - generic [ref=e231]:
                  - paragraph [ref=e232]: Escrow Contract Settings
                  - paragraph [ref=e233]: TaskEscrow parameters
                - img [ref=e234]
              - generic [ref=e236]:
                - generic [ref=e237]:
                  - generic [ref=e238]: Protocol Fee
                  - generic [ref=e239]: 2%
                - generic [ref=e240]:
                  - generic [ref=e241]: Dispute Window
                  - generic [ref=e242]: 1d
                - generic [ref=e243]:
                  - generic [ref=e244]: Slashing Judge
                  - generic [ref=e245]: 0x4091...D849
                - generic [ref=e246]:
                  - generic [ref=e247]: Assignment Engine
                  - generic [ref=e248]: 0x0000...0001
            - generic [ref=e249]:
              - generic [ref=e250]:
                - generic [ref=e251]:
                  - paragraph [ref=e252]: Assigned Agents
                  - paragraph [ref=e253]: 1 agents locked
                - link "Create escrow task" [ref=e254] [cursor=pointer]:
                  - /url: "#create-escrow-task"
                  - img [ref=e255]
              - generic [ref=e257]:
                - img [ref=e259]
                - generic [ref=e261]:
                  - paragraph [ref=e262]: 0xbaD0...0b07
                  - paragraph [ref=e263]: Stake 0.05 0G
                - generic [ref=e264]: Locked
    - contentinfo [ref=e265]:
      - generic [ref=e266]: © 2026 Crucible Industrial Agents
      - generic [ref=e267]:
        - generic [ref=e268]: "Network: 42.5k TPS"
        - generic [ref=e269]: "Protocol: v4.0.2"
        - generic [ref=e270]: "Status: Operational"
  - button "Open Next.js Dev Tools" [ref=e277] [cursor=pointer]:
    - img [ref=e278]
  - alert [ref=e281]
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
  12  |     await expect(page.getByRole('heading', { name: /Arena_Overview/i })).toBeVisible();
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
> 98  |     await expect(page.getByText('TEE Proof Trail', { exact: true })).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  99  |     await expect(page.getByText('Hash Commitment', { exact: true }).first()).toBeVisible();
  100 |     await expect(page.getByText('No TEE attestation recorded').first()).toBeVisible();
  101 |     await expect(page.getByText('garbage_hash_defective')).toBeVisible();
  102 |     await expect(page.getByText('Slashing audit reasons', { exact: true })).toBeVisible();
  103 |   });
  104 | });
  105 | 
```