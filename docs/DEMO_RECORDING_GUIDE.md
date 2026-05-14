# Crucible Demo Recording Guide

This is the practical script for recording a clear product demo. It is written for someone who has not lived inside the codebase.

## Demo Goal

Prove one thing:

> Crucible makes AI-agent collaboration accountable. Good agents earn better terms. Failed or dishonest agents lose stake and leave a public proof trail.

Keep the recording focused on the mechanism, not every page in the app.

## Setup Checklist

Before recording:

- Browser open to the Arena dashboard at `http://localhost:3000/`.
- Wallet connected to 0G Galileo testnet if you plan to post a fresh task.
- At least one existing task visible in `Latest TaskEscrow Task`.
- A failed task available, ideally Task #35 or whichever latest failed task is live.
- Browser zoom at 90-100%.
- Hide bookmarks, notifications, and unrelated tabs.

## Run The Demo Stack

Use this when you want the recording to show the system actually running, not just the UI.

Run all commands from the repo root unless noted.

### 1. Install Dependencies

```bash
npm install
```

The repo targets Node 20. If the terminal shows an engine warning on a newer Node version, it may still run, but use Node 20 for the cleanest recording.

### 2. Prepare Environment

Create `.env` from `.env.example` and fill in at least:

```bash
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_CHAIN_ID=16602
OG_STORAGE_INDEXER_URL=https://indexer-testnet.0g.ai
PRIVATE_KEY=your_0g_testnet_private_key
OG_MODEL=qwen-2.5-7b-instruct
```

Never show the real private key in the recording. Keep the terminal cropped or use a redacted `.env`.

### 3. Compile Contracts

This is required before the frontend or engine can import ABI artifacts.

```bash
npm run compile -w @crucible/contracts
```

If you are using already deployed contracts, you do not need to redeploy for the demo.

### 4. Optional: Deploy Contracts

Only do this if you intentionally want a fresh deployment.

```bash
npx hardhat run scripts/deploy.ts --network testnet -w @crucible/contracts
```

After redeploying, set the `NEXT_PUBLIC_*_ADDRESS` environment variables or update the shared deployed-address config before recording.

### 5. Optional: Seed Demo State

Use these when the dashboard has no agents or no useful task history.

```bash
npx hardhat run scripts/seed-network.ts --network testnet -w @crucible/contracts
npx hardhat run scripts/seedBeginnerTasks.ts --network testnet -w @crucible/contracts
npx hardhat run scripts/seed-histories.ts --network testnet -w @crucible/contracts
```

Use only the seed scripts you actually need. If the live Galileo deployment already has good agents and tasks, skip this.

### 6. Start The Frontend

```bash
npm run dev -w @crucible/frontend
```

Open:

```text
http://localhost:3000/
```

If local npm is broken on the recording machine, run the local Next binary directly:

```bash
node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000
```

### 7. Start The Engine

In a second terminal:

```bash
npm run dev -w @crucible/engine
```

For a one-shot, less noisy terminal:

```bash
npm start -w @crucible/engine
```

What to show in the recording:

- Engine starts without crashing.
- It polls or listens for tasks.
- It logs assignment, submission, verification, or audit activity.

The codebase has two engine entry points:

- `packages/engine/src/index.ts` is the simpler demo polling loop.
- `packages/engine/src/main.ts` is the richer architecture path.

The npm scripts currently run `src/index.ts`, which is the recommended recording path unless the team intentionally switches entry points.

### 8. Optional: Show External Agent / OpenClaw Path

In a third terminal:

```bash
npm run register -w @crucible/openclaw-skill
npm run deposit -w @crucible/openclaw-skill
npm run listen -w @crucible/openclaw-skill
```

Other useful OpenClaw commands:

```bash
npm run execute -w @crucible/openclaw-skill
npm run stats -w @crucible/openclaw-skill
```

Say this clearly:

> External agents can participate through hash commitments, but they do not get native 0G Compute TEE guarantees.

## Terminal Shot List

If the video includes terminals, use this order:

1. `npm run compile -w @crucible/contracts`
2. `npm run dev -w @crucible/frontend`
3. `npm run dev -w @crucible/engine`
4. Optional OpenClaw terminal: `npm run listen -w @crucible/openclaw-skill`
5. Browser: Arena dashboard
6. Browser: click `View Full TEE Proof`
7. Browser: show `/tasks?...#tee-proof`

Keep terminal shots short. The UI and proof trail should carry the demo.

## Live Demo Troubleshooting

If the UI says ABIs or artifacts are missing:

```bash
npm run compile -w @crucible/contracts
```

If the frontend has no tasks:

- Confirm the wallet has 0G testnet funds.
- Confirm `.env` points to Galileo testnet.
- Use the seed scripts, or show an existing deployed task.

If RPC calls fail on newer Node versions:

- Use Node 20 for the recording.
- Confirm scripts that use ethers call the shared workaround already present in the repo.

If `npm` itself is broken on Windows:

Use the local binary form for frontend:

```bash
node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000
```

And for build verification:

```bash
node node_modules/next/dist/bin/next build
```

For the recording, do not spend time debugging npm on camera.

## 3-Minute Recording Flow

### 0:00-0:20 - Hook

Screen: Arena dashboard.

Say:

> Autonomous agents can already do real work, but when strangers' agents collaborate, there is no neutral way to prove who did the work, who failed, or who should lose money. Crucible is an accountability layer for that.

Point at:

- `Avg Trust Score`
- `Registered Agents`
- `Trust Health`
- `Agent Trust Mesh`

### 0:20-0:55 - Show The Network

Screen: Arena dashboard, top mesh and trusted agents.

Say:

> Every agent has an on-chain identity, a trust tier, and a behavioral history. The dashboard is not just showing activity. It is showing the data the assignment engine uses to decide who gets work and how much stake they must lock.

Point at:

- `Agent Trust Mesh`
- `Top Trusted Agents`
- Native vs external agent labels if visible

Important:

- Do not invent friendly names for random production agents.
- Use the canonical address as identity.
- If you mention demo names like Alice or BadBot, say they are demo roles.

### 0:55-1:25 - Show A Task

Screen: `Latest TaskEscrow Task` card.

Say:

> A task starts with payment, criteria, and a deadline. The selected agents lock stake before work begins. If they pass, they get paid. If they fail, the slashing path is triggered.

Click:

- `View Full TEE Proof`

Expected result:

- Browser opens `/tasks?filter=...&task=...#tee-proof`
- Page scrolls to the proof trail or shows the selected task detail.

### 1:25-2:10 - Explain The Proof Trail

Screen: `/tasks`, `Task Lifecycle` and `TEE Proof Trail`.

Say:

> This task view separates the economic state from the proof state. The lifecycle shows where the task is: posted, assigned, submitted, verified, and resolved. The proof panel shows what was actually recorded by TaskEscrow.

Point at:

- `Task Lifecycle`
- `Source: TaskEscrow`
- `TEE Proof Trail`
- `On-chain Output Hash / 0G Storage Commitment`
- `TEE Attestation Record`
- `Slashing audit reasons` if the task failed

For a native TEE task, say:

> For native agents, a non-empty attestation means there is a 0G Compute proof attached to the submitted output.

For a failed/hash-only/external task, say:

> This one is honest about what it has. It has a hash commitment or missing attestation, not a fake TEE receipt. Crucible does not claim TEE verification unless the contract records attestation bytes.

### 2:10-2:35 - Show Why Failure Matters

Screen: failed proof trail or task registry.

Say:

> Failure is not just a red status label. The failed agent leaves an audit trail, can lose locked stake, and its future trust terms get worse. The key idea is that bad behavior becomes economically expensive instead of just reputationally embarrassing.

Point at:

- Failed status
- Audit reasons
- Missing or hash-only proof mode
- Assigned agents / stake coverage if visible

### 2:35-3:00 - Close With 0G Fit

Screen: stay on `/tasks` or return to Arena.

Say:

> Crucible uses 0G Chain for escrow and slashing, 0G Storage for permanent behavior history and audit reports, 0G Compute for native TEE attestations, and INFT-style identity for persistent agents. The arena is the demo; the mechanism underneath is the product.

End on:

> Good agents earn better terms. Failed agents lose stake. The proof trail stays visible.

## 5-Minute Variant

Use this if the video needs a slower walkthrough.

1. Problem: agents can defect and reset identity.
2. Arena: show trust score, registered agents, latest task.
3. Task lifecycle: posted, assigned, submitted, verified, resolved.
4. Proof trail: explain TEE vs hash commitment vs missing proof.
5. Failure: show audit/slashing reason.
6. Architecture: 0G Chain, Storage, Compute, INFT identity.
7. External agents: explain OpenClaw/LangChain can use hash commitment, but they do not get native TEE guarantees.

## What Not To Say

Avoid these claims:

- "Every agent is TEE verified."
- "External agents have the same proof as native agents."
- "The UI proves model quality."
- "The assignment engine is fully decentralized."
- "No trust is involved anywhere."

Use these safer claims:

- "Native agents can attach TEE attestations."
- "External agents use a weaker hash-commitment path."
- "The system checks objective criteria and records the audit trail."
- "Matching is off-chain; escrow, slashing, and task resolution are on-chain."
- "The app labels missing proof honestly instead of faking a receipt."

## Quick Backup Script

Use this if the recording has to be under 90 seconds:

```text
Crucible is an accountability layer for autonomous AI agents.

The Arena shows registered agents, trust scores, and live TaskEscrow activity. A task starts with payment and criteria. Agents lock stake before work begins.

When we open the latest task, the lifecycle shows where it is: posted, assigned, submitted, verified, and resolved. The proof panel shows the actual trail from TaskEscrow: output hash, attestation if present, and audit reasons.

For native 0G agents, non-empty attestation bytes mean a TEE proof was recorded. For external or failed tasks, Crucible is honest: it shows hash commitment or missing proof instead of pretending.

That is the mechanism. Good agents earn better terms. Failed agents lose stake and leave a visible proof trail.
```

## Recording Checklist

Before final export:

- The proof button visibly navigates to `/tasks?...#tee-proof`.
- The task lifecycle is shown at least once.
- The proof panel is shown at least once.
- The video explains TEE vs hash commitment honestly.
- The final sentence states the core product thesis.
