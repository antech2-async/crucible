# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

Crucible — an accountability / coordination layer for autonomous AI agents on the **0G Galileo testnet** (chainId `16602`). Agents register as INFTs, stake tokens, are assigned tasks by an off-chain engine, and are slashed automatically when outputs fail on-chain criteria checks. Built for the 0G x HackQuest APAC Hackathon 2026 — demo-grade code, not production.

Primary long-form references (read before non-trivial changes):

- `technical_spec.md` — full spec, including the Bayesian Tit-for-Tat trust model and game-theoretic design that sections of the code directly implement.
- `docs/ARCHITECTURE.md` — component diagram.
- `OPENCLAW_INTEGRATION.md` — operator-facing guide for the external-agent skill.

## Repository layout

npm workspaces monorepo, each package is independently installable:

- `packages/contracts` — Solidity 0.8.24 + Hardhat. Contracts: `AgentRegistry`, `TaskEscrow`, `SlashingJudge`, `TrustCalculator`, `CrucibleINFT`, `AgentStakeVault`. Compilation uses `viaIR: true` and `evmVersion: 'cancun'` (required for 0G).
- `packages/engine` — TypeScript off-chain orchestrator (the "broker"). Two entry points exist: `src/index.ts` (simple `BrokerEngine` polling loop used in demos) and `src/main.ts` (richer `AssignmentEngine` wiring). Confirm which one you need before editing.
- `packages/frontend` — Next.js 16 + React 18 + Tailwind + wagmi/viem "Arena" dashboard. `next.config.mjs` sets `typescript.ignoreBuildErrors: true` on purpose — `npm run build` will not catch type errors in this package; run `tsc --noEmit` explicitly if you need them.
- `packages/shared` — Zod env schema, Pino logger, shared types, ABI re-exports, contract addresses, and `setupEthersWorkaround()`.
- `packages/openclaw-skill` — Standalone scripts (`register.ts`, `deposit.ts`, `listen.ts`, `execute.ts`, `stats.ts`) that let an external OpenClaw agent participate. External agents are capped at trust tier 3 by design because they bypass the full TEE path.

## Common commands

Run from the repo root unless noted. Workspace-scoped commands use `-w @crucible/<pkg>`.

```bash
# Install everything
npm install

# Compile contracts — REQUIRED before engine/frontend type-check or build,
# because packages/shared/src/contracts.ts imports ABIs from
# packages/contracts/artifacts/ (which is gitignored and only exists post-compile).
npm run compile -w @crucible/contracts

# Lint everything (TS + Solidity)
npm run lint

# Run all workspace tests
npm test

# Contracts only
npm test -w @crucible/contracts
npx hardhat test test/TaskEscrow.test.ts -w @crucible/contracts   # single file

# Engine (long-running broker)
npm run dev -w @crucible/engine       # ts-node-dev with respawn
npm start -w @crucible/engine         # one-shot ts-node

# Frontend
npm run dev -w @crucible/frontend
npx playwright test -w @crucible/frontend                          # e2e
npx playwright test e2e/arena.spec.ts -w @crucible/frontend        # single spec

# Deploy contracts to 0G Galileo testnet
npx hardhat run scripts/deploy.ts --network testnet -w @crucible/contracts
```

## Architecture notes that aren't obvious from the code

### Single root `.env`

Every package loads env from the **monorepo root** via `dotenv.config({ path: '../../.env' })`. There is no per-package `.env`. `packages/shared/src/env.schema.ts` is the single source of truth for what's required; `.env.example` lists the baseline. The `openclaw-skill` is the exception — when used standalone outside the monorepo it has its own `.env`.

### Contract addresses are environment-overridable

`packages/shared/src/contracts.ts` hardcodes deployed Galileo testnet addresses as fallbacks, but `NEXT_PUBLIC_*_ADDRESS` env vars override them. When redeploying, set the env vars rather than editing the file — the hardcoded values are the "last known good" demo addresses referenced in `technical_spec.md`.

### The ethers/Node v22 workaround is load-bearing

`packages/shared/src/node-utils.ts` exports `setupEthersWorkaround()` which nulls `global.fetch` and registers an axios-based fetcher with ethers v6. This exists because of an undici `maxRedirections` bug that makes 0G RPC calls fail on Node 22. **Any new script that uses ethers to hit 0G must call this before any RPC work.** `hardhat.config.ts` inlines the same fix — don't remove it.

### Engine has two "entry points" for historical reasons

`src/index.ts` is a minimal polling `BrokerEngine` used by demo scripts; `src/main.ts` wires the full `AssignmentEngine` + `StorageService` + `ComputeService` stack. When in doubt, `src/main.ts` is the one that matches `docs/ARCHITECTURE.md`. Don't assume they stay in sync.

### Demo agents vs. real agents

`packages/engine/src/agents/` contains `researchAgent.ts` (honest), `writingAgent.ts`, and `badActorAgent.ts` (designed to be slashed). `BADBOT_ADDRESS` in `.env` is wired through `src/index.ts` to make BadBot deterministically fail verification — this is a demo scaffold, not a bug. External "real" agents plug in via `packages/openclaw-skill`.

### Tests under `packages/engine/tests/`

Those `proof-*.ts` files are **scenario scripts**, not unit tests — they run end-to-end against a live testnet and exist as evidence for the spec's "proofs" section. `npm test` in engine currently doesn't execute them; invoke with `ts-node` directly.

### Frontend build skips type errors

`next.config.mjs` has `typescript.ignoreBuildErrors: true`. This is intentional for the hackathon demo. If you're changing frontend types, you must run `tsc --noEmit` yourself — a clean `next build` does not mean the types are clean.

## Coding conventions

- ESLint + Prettier enforced via Husky `pre-commit` + `lint-staged`. Solidity lints through `solhint`.
- TS is `strict: true` at the root; the frontend relaxes this in practice because of `ignoreBuildErrors`.
- Use the shared Pino logger (`import { logger } from '@crucible/shared'`) rather than `console.log` in engine code. Demo scripts (including `src/index.ts`) use `console.log` by convention for readable demo output.
- Path alias `@crucible/shared/*` → `packages/shared/src/*` (see root `tsconfig.json`).

## When things break

- **"Cannot find module '../../contracts/artifacts/...'"** — run `npm run compile -w @crucible/contracts` first. Engine and shared import compiled ABIs directly.
- **RPC timeouts / redirect errors from ethers** — confirm the script calls `setupEthersWorkaround()` before opening a provider, and that it's running on Node 22+.
- **Tests pass locally but fail in CI** — CI uses Node 20 (`.github/workflows/ci.yml`); the codebase targets 22. Watch for version-specific ethers/undici behavior.
