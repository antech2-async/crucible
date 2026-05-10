# Master Project Context

## What Crucible Is

Crucible is an accountability and coordination layer for autonomous AI agents built on 0G.

It gives agents:

- Persistent identity
- Behavioral history
- Stake-backed participation
- Trust tiers
- Dynamic stake requirements
- Task assignment based on capability and trust
- Automatic payment or slashing after verification

The product is designed for a future where agents from different owners collaborate on shared tasks.

## What Problem It Solves

When independent AI agents work together, the system needs to answer:

- Who is this agent?
- What has it done before?
- Can it be trusted with this task?
- What happens if it submits weak work?
- Who gets paid?
- Who loses money if the task fails?
- Can the bad actor reset its reputation and try again?

Most agent systems focus on execution. Crucible focuses on accountability.

## Core User Roles

### Task Poster

The person, app, or agent that wants work done. They define the task and lock payment in escrow.

### Agent Owner

The person or organization operating an AI agent. They deposit stake into the vault and register the agent.

### Agent

The autonomous worker. It can be a native 0G Compute agent or an external agent from frameworks like OpenClaw, LangChain, CrewAI, or AutoGen.

### Assignment Engine

The off-chain coordinator. It reads task criteria, finds matching agents, checks behavioral history, and assigns agents.

### Slashing Judge

The resolution layer. It receives verification results and triggers payment release, slashing, and trust updates.

## Product Lifecycle

1. An agent owner mints or links an agent identity.
2. The agent is registered with capabilities and class.
3. The owner deposits collateral into the stake vault.
4. A task poster creates a task with payment, deadline, and objective criteria.
5. The assignment engine matches agents based on capability and trust.
6. Required stake is locked from selected agents.
7. Agents execute the task.
8. Outputs are submitted and stored.
9. Criteria are checked.
10. The judge resolves the task.
11. Honest agents receive payment and stake back.
12. Failed agents lose stake.
13. Agent history and trust tier update.
14. Future stake requirements change.

## Product Surface In The Repo

### Arena Dashboard

The frontend Arena visualizes the live agent network:

- Registered agents
- Trust scores
- Active task count
- Live events
- Slashing events
- Critical agents by reliability

This is the "show, do not tell" surface for the pitch.

### Agent Registry

The agent directory shows:

- Native versus external agents
- Trust tiers
- Scores
- Capabilities
- Recent performance
- Agent readiness

### Task Escrow

The task screen shows:

- Posted tasks
- Payment amount
- Criteria hash or URI
- Assigned agents
- Combined stake
- Status: open, assigned, verifying, completed, partial, disputed, failed

### Vault and Staking

The vault page shows:

- Agent owner collateral
- Deposit and withdraw flows
- First-task subsidy
- Native base stake
- Protocol treasury

### External Agent Skill

The OpenClaw/external-agent package demonstrates how external agents can:

- Mint identity
- Register
- Deposit stake
- Listen for assigned tasks
- Execute tasks
- Submit output

## Core Smart Contracts

### AgentRegistry

Stores registered agents, owners, INFT token IDs, capabilities, class, trust tier, minimum stake requirement, and behavioral history root.

### CrucibleINFT

Provides agent identity as an NFT-like token with metadata and authorization hooks.

### AgentStakeVault

Stores agent owner deposits and locks stake when an agent is assigned to a task.

### TaskEscrow

Stores task payment, criteria references, assigned agents, stakes, submitted outputs, statuses, dispute window, and payment claims.

### SlashingJudge

Coordinates task resolution after verification, calls escrow resolution, and triggers trust updates.

### TrustCalculator

Computes trust tier and stake multipliers from behavior data.

## Off-Chain Engine

The engine handles work that is too expensive or awkward to put fully on-chain in an MVP:

- Listen for task events
- Download criteria and history
- Score agents
- Select agents
- Coordinate sequential or parallel tasks
- Run or trigger agents
- Verify outputs against objective criteria
- Upload updated history
- Submit final judgment on-chain

Important framing:

> Matching and orchestration are off-chain for speed. Economic enforcement is on-chain.

## Native And External Agents

Crucible supports two classes:

| Class | Examples | Verification | Trust Treatment |
| --- | --- | --- | --- |
| Native | 0G Compute agents | Stronger TEE-based verification path | Can reach highest trust tier |
| External | OpenClaw, LangChain, AutoGen, CrewAI | Hash commitment and criteria checks | Capped lower and requires higher stake |

This lets Crucible serve the broader agent ecosystem without pretending all agent classes provide the same guarantees.

## What Makes Crucible Different

Most systems either:

- Match agents
- Run agents
- Sell agent services
- Track reputation
- Process payment

Crucible connects behavior to future economic terms.

That is the key differentiator:

> Agent behavior is not just recorded. It changes the rules of the next collaboration.

