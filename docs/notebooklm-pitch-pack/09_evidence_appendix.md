# Evidence Appendix And Source Index

Use this file as supporting evidence. Do not turn the deck into a file-by-file repo walkthrough.

## Primary Repository Sources

Project root:

```text
/Users/wildanniam/Development/project/0G_agentswarm
```

Key files:

| Source | Why It Matters |
| --- | --- |
| README.md | Concise project framing, 0G stack, Arena dashboard, deployed-address notes |
| technical_spec.md | Long-form product, mechanism, game theory, demo, architecture, failure modes |
| docs/ARCHITECTURE.md | System architecture diagram and core components |
| OPENCLAW_INTEGRATION.md | External agent integration framing |
| packages/verification_proof.txt | Evidence of prior compile/test/type-check proof |

## Core Contract Evidence

| File | Pitch-Relevant Evidence |
| --- | --- |
| packages/contracts/contracts/AgentRegistry.sol | Agent identity, capabilities, class, trust tier, history hash, minimum stake |
| packages/contracts/contracts/CrucibleINFT.sol | Agent identity token and metadata |
| packages/contracts/contracts/AgentStakeVault.sol | Deposits, locked stakes, slash accounting, first-task subsidy |
| packages/contracts/contracts/TaskEscrow.sol | Task payment, assignment, output submission, completion, partial completion, dispute, deadline failure |
| packages/contracts/contracts/SlashingJudge.sol | Authorized judgment, task resolution, trust update |
| packages/contracts/contracts/TrustCalculator.sol | Tier calculation and stake multiplier logic |

## Engine Evidence

| File | Pitch-Relevant Evidence |
| --- | --- |
| packages/engine/src/assignmentEngine.ts | Reads criteria and history, scores agents, selects agents, assigns, processes outputs |
| packages/engine/src/trustScorer.ts | Recent/lifetime trust score, stake multiplier, external cap |
| packages/engine/src/criteriaChecker.ts | Objective criteria checks and 70% threshold |
| packages/engine/src/services/storageService.ts | 0G Storage upload/download path for history and criteria |
| packages/engine/src/services/computeService.ts | 0G serving broker and verifiable inference path |
| packages/engine/src/pipelineCoordinator.ts | Sequential task handoff concept |
| packages/engine/src/agents/badActorAgent.ts | Strategic bad actor demo behavior |

## Frontend Evidence

| File | Pitch-Relevant Evidence |
| --- | --- |
| packages/frontend/src/components/Arena.tsx | Live dashboard, agent mesh, event feed, slashing signal |
| packages/frontend/src/components/AgentCard.tsx | Agent trust cards, tier, recent history |
| packages/frontend/src/components/TaskEscrowScreen.tsx | Task escrow view, task status, locked collateral, protocol panel |
| packages/frontend/src/components/PostTaskForm.tsx | Criteria builder, budget, deadline, execution mode |
| packages/frontend/src/app/agents/page.tsx | Agent registry and dossier experience |
| packages/frontend/src/app/stake/page.tsx | Vault, staking, collateral readiness |

## Atlas Vault Sources

Vault root:

```text
/Users/wildanniam/Development/Atlas Vault
```

Key notes:

| Source | Pitch-Relevant Insight |
| --- | --- |
| 20 - Projects/Crucible 0G Hackathon/Crucible 0G Hackathon.md | Project synthesis, risks, MVP scope, 0G fit, demo plan |
| 30 - Resources/Concepts/Blockchain/AI Agent Marketplaces.md | Marketplace needs: discovery, trust, payment, verification, dispute |
| 30 - Resources/Concepts/Multi-Agent/Multi-Agent Systems.md | Multi-agent benefits and failure modes |
| 30 - Resources/Concepts/AI-Agents/Evaluating AI Agents.md | Agent evaluation dimensions beyond final answer |
| 20 - Projects/AgentPay/AgentPay Knowledge Brief.md | Payment marketplace contrast |
| 20 - Projects/xAgent/xAgent.md | Agent marketplace payment layer contrast |
| 20 - Projects/Fradium/Fradium Knowledge Brief.md | Web3 trust-layer analogy |

## HackQuest Source

Official event page:

```text
https://www.hackquest.io/hackathons/0G-APAC-Hackathon
```

Use official event information over older internal notes if there is a conflict.

Pitch-relevant criteria from event context:

- 0G technical integration depth
- Technical completeness
- Product value
- UX and demo quality
- Team capability and documentation

Official submission requirements to remember:

- Final submission materials must include 0G integration proof.
- The official page asks for a 0G mainnet contract address and 0G Explorer link.
- Demo video must be no more than 3 minutes.
- Pitch deck or slides are listed as optional bonus materials.

## Address And Deployment Caution

The repository contains deployed address references for the 0G Galileo testnet. Some docs and shared config may not show the same address set.

NotebookLM must not invent or finalize contract addresses.

Use one of these safe phrases unless final verified deployment links are supplied:

- "Deployed on 0G Galileo testnet for the demo"
- "0G deployment proof included in the technical appendix"
- "Final mainnet deployment links to be inserted before submission"

Do not claim "mainnet live" unless the user provides verified mainnet explorer links.

## Most Important Evidence To Surface In The Deck

Use these as concise proof points:

- Six-contract protocol surface: registry, INFT, vault, escrow, judge, trust calculator
- Dynamic trust and stake multiplier model
- Native versus external agent trust treatment
- Arena dashboard for live visualization
- Objective criteria checking
- Slashing and partial completion paths
- 0G Storage and Compute integration paths
- External-agent onboarding package

## What To Leave Out Of The Deck

Do not include:

- npm workspace details
- Node version issues
- undici or ethers workaround
- package dependency lists
- long code snippets
- internal file path clutter
- old deadline contradictions
- unverified address tables
- raw test output unless used as appendix proof
