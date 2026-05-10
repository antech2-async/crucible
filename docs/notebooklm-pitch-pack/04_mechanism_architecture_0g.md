# Mechanism, Architecture, And 0G Fit

## The Core Mechanism

Crucible turns agent collaboration into a repeated economic game.

Instead of asking agents to be honest, Crucible changes the incentives:

- Agents must lock stake before taking work.
- Output is checked against task criteria.
- Honest agents get paid and recover stake.
- Failed agents lose stake.
- Behavioral history updates after every task.
- Future stake requirements change based on that history.

## The Product Loop

```text
Register agent
-> Deposit stake
-> Post task with criteria
-> Assign agents by capability and trust
-> Lock agent stake
-> Execute task
-> Store and verify output
-> Pay honest agents or slash failed agents
-> Update history and trust tier
-> Change future stake requirements
```

## Trust Model

Crucible uses a Bayesian Tit-for-Tat-inspired trust model.

The practical model:

```text
trust score = 60% recent behavior + 40% lifetime behavior - slash penalty
slash penalty = 5% per slash event
recent behavior = last 10 task results
```

This is intentionally simple because it needs to be explainable, auditable, and compatible with smart-contract constraints.

## Trust Tier Ladder

| Trust Score | Tier | Stake Multiplier | Meaning |
| --- | --- | --- | --- |
| 95%+ | Elite | 0.5x | Best terms, strongest history |
| 85%+ | High Trust | 0.75x | Reliable agent |
| 70%+ | Moderate | 1.0x | Normal participation |
| 50%+ | Low Trust | 1.5x | Higher risk |
| Under 50% | New or Risky | 2.5x | Maximum collateral requirement |

Pitch interpretation:

> Good behavior lowers friction. Bad behavior raises collateral.

## Native Versus External Agents

Crucible supports both native 0G agents and external agents.

| Agent Class | Examples | Verification | Economic Treatment |
| --- | --- | --- | --- |
| Native | Agents using 0G Compute | Stronger TEE-backed verification path | Can reach highest tier |
| External | OpenClaw, LangChain, AutoGen, CrewAI | Hash commitment and criteria verification | Tier capped lower, 1.5x stake multiplier |

This makes the product more useful because it can plug into existing agent ecosystems while still rewarding stronger verification.

## Objective Task Criteria

Task posters define criteria upfront.

Examples:

- Minimum word count
- Minimum source count
- Valid JSON
- Contains required keyword or field
- Output exists and is non-empty
- Compile or test result for code tasks

The MVP focuses on objective criteria, not subjective quality judgment.

Good pitch line:

> We do not ask a human to decide whether an agent is "good." We check whether it met the rules defined before work began.

## Smart Contract Architecture

### AgentRegistry

Stores agent identity, owner, class, capabilities, trust tier, minimum stake, task count, slash count, and history root.

### CrucibleINFT

Provides persistent on-chain identity for agents with metadata and ownership.

### AgentStakeVault

Stores owner deposits and locks stake when an agent is assigned. Handles slash accounting, treasury fee, and first-task subsidy.

### TaskEscrow

Holds task payment, criteria reference, assignment status, agent stakes, submissions, dispute window, and payment claims.

### SlashingJudge

Receives verification results, resolves tasks, triggers slashing or payment allocation, and updates history through the registry.

### TrustCalculator

Computes trust tier and stake multiplier from behavioral data.

## Off-Chain Assignment Engine

The engine coordinates work that is impractical to run fully on-chain in the MVP:

- Detect new tasks
- Read criteria from storage
- Search registered agents by capability
- Download behavioral history
- Score candidates
- Select agents
- Trigger execution
- Verify outputs against criteria
- Upload updated history
- Submit judgment on-chain

Polished framing:

> Matching is off-chain for speed and flexibility. Escrow, slashing, and trust updates are enforced by contracts.

## 0G Infrastructure Fit

Crucible is strongest when explained as a composition of 0G primitives.

| 0G Primitive | Crucible Use |
| --- | --- |
| 0G Chain | Deploy contracts for escrow, registry, vault, judge, and trust updates |
| 0G Storage | Store task criteria, outputs, and agent behavioral history |
| 0G Compute | Provide stronger native-agent inference verification through TEE |
| INFT / Agent Identity | Give agents persistent identity and metadata |

## Why 0G Is Not A Sticker

Do not pitch 0G as an afterthought. Crucible needs the combination:

- Storage for persistent history
- Compute for stronger verification
- Chain for economic enforcement
- Agent identity for portability

The best framing:

> Crucible is the accountability layer that becomes possible when agent identity, storage, compute verification, and on-chain enforcement live in one AI-native stack.

## End-To-End Data Flow

```text
Task Poster
-> TaskEscrow locks payment
-> Assignment Engine reads criteria and agent history
-> AgentStakeVault locks required stake
-> Agent runs task
-> Output stored and referenced
-> Criteria checked
-> SlashingJudge resolves task
-> TaskEscrow pays or slashes
-> AgentRegistry updates trust tier
-> Arena visualizes the event
```

## Technical Proof Points

The repository contains:

- Solidity contracts for registry, vault, escrow, judge, trust calculator, and INFT identity
- TypeScript assignment engine
- Storage service using 0G Storage SDK patterns
- Compute service designed for 0G serving broker and verifiable inference
- Next.js Arena dashboard
- Task escrow UI
- Agent registry UI
- Vault and staking UI
- External-agent onboarding scripts
- Contract tests and hardening scenarios

Do not overfill the deck with implementation details. Use these proof points as credibility, not as the main story.

