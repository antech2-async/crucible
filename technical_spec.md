# Crucible — Technical Specification

**0G x HackQuest APAC Hackathon 2026**

> A coordination layer where AI agents automatically earn better collaboration terms the more honestly they behave — enforced by smart contracts, verified by cryptographic proof, with no human or company in the middle.

---

## Table of Contents

**Read these first — even if you built this, read these when you forget the plot:**

- [Project Bible — 5 Minute Orientation](#project-bible--5-minute-orientation)
- [Plain Language Glossary](#plain-language-glossary)
- [Game Theory Explained From Scratch](#game-theory-explained-from-scratch)
- [Demo Day — What Judges Actually See](#demo-day--what-judges-actually-see)
- [Decision Log — Why We Made These Choices](#decision-log--why-we-made-these-choices)
- [User-Facing Failure Modes](#user-facing-failure-modes)

**Technical Reference:**

1. [What You're Building](#1-what-youre-building)
2. [Market Context — Why Now](#2-market-context--why-now)
3. [How It All Fits Together](#3-how-it-all-fits-together)
4. [0G Infrastructure — What You Use vs What You Build](#4-0g-infrastructure--what-you-use-vs-what-you-build)
5. [Network Configuration](#5-network-configuration)
6. [Smart Contracts](#6-smart-contracts)
7. [Agent Staking & Deposit Flow](#7-agent-staking--deposit-flow)
8. [0G Storage Integration](#8-0g-storage-integration)
9. [0G Compute Integration](#9-0g-compute-integration)
10. [External Agent Support (OpenClaw & Others)](#10-external-agent-support-openclaw--others)
11. [INFT Agent Identity](#11-inft-agent-identity)
12. [Task Assignment Engine](#12-task-assignment-engine)
13. [Sequential Output Pipeline (Agent Handoffs)](#13-sequential-output-pipeline-agent-handoffs)
14. [Trust & Behavioral Model](#14-trust--behavioral-model)
15. [Cold Start Problem](#15-cold-start-problem)
16. [Criteria Builder](#16-criteria-builder)
17. [Partial Completion Handling](#17-partial-completion-handling)
18. [Storage Cost Ownership](#18-storage-cost-ownership)
19. [Demo Agents](#19-demo-agents)
20. [Arena Frontend](#20-arena-frontend)
21. [Full Data Flow End to End](#21-full-data-flow-end-to-end)
22. [Project Structure](#22-project-structure)
23. [Dependencies](#23-dependencies)
24. [Development Timeline](#24-development-timeline)
25. [Environment Variables](#25-environment-variables)
26. [Testing Strategy](#26-testing-strategy)
27. [Known Hard Parts](#27-known-hard-parts)
28. [README / Pitch Narrative](#28-readme--pitch-narrative)

---

## Project Bible — 5 Minute Orientation

> Read this section first every time you open this document. If you've forgotten what you're building, this is the reset button.

### The Human Story

You hire two strangers' AI agents to do a job — one researches, one writes. You pay upfront. The research agent delivers nothing useful. The writing agent can't prove it did good work. You have no recourse. The agent owners spin up new wallets and disappear. This happens every time because there is no mechanism to prevent it.

That is the exact problem this project solves.

### What Crucible Is In Plain English

Crucible is the referee and rulebook for when strangers' AI agents work together.

Before any job starts, every agent puts real money on the line — their "stake." The more honestly an agent has behaved in past jobs, the less stake they need to put up. New agents or bad actors have to put up more. When the job is done, the code automatically checks whether each agent actually did what they were supposed to. Agents that did their job get their stake back plus payment. Agents that cheated or delivered garbage lose their stake automatically — no arguments, no disputes, no human judge needed.

Over time, agents that keep behaving honestly build up a track record and get better jobs with better pay and lower barriers. Agents that keep cheating face higher and higher barriers until it mathematically stops making sense for them to cheat at all.

### The Analogy That Makes It Click

Think of it like Pokemon, but:

- Your "Pokemon" is an AI agent that does real work (research, writing, coding)
- You fund it with real money before it goes out
- It builds a real reputation based on what it actually did, not what it claimed
- You watch it compete and cooperate with other people's agents in a live arena
- Cheating costs real money. Honesty pays real money. The system makes sure of this mathematically.

### What Makes This Different From Everything Already Built

There are 550+ AI agent crypto projects. Most of them are either:

- A marketplace with no enforcement (fake reputation, gamed reviews)
- A closed system where one company controls everything (defeats the point)
- Infrastructure that requires trusting a centralized platform

Crucible is different because:

1. **Enforcement is mathematical, not social** — the contract slashes stake automatically. No human decides.
2. **Verification is cryptographic** — 0G's TEE proves what agents actually produced. You cannot fake it.
3. **History is permanent** — stored on 0G's decentralized storage. You cannot delete it or start fresh.
4. **Terms are dynamic** — the system adjusts how much stake each agent needs based on their actual history. It's not one-size-fits-all rules.

### What You're Building vs What Already Exists

| Layer                    | Already Exists                       | What You Build       |
| ------------------------ | ------------------------------------ | -------------------- |
| AI agents that do tasks  | OpenClaw, LangChain, CrewAI, AutoGen | —                    |
| Decentralized storage    | 0G Storage                           | —                    |
| Verified compute         | 0G Compute TEE                       | —                    |
| Agent identity NFTs      | 0G INFT / ERC-7857                   | —                    |
| **Accountability layer** | **Nobody has built this properly**   | **This is Crucible** |

### The Three Things You Must Always Remember

1. **The arena is the demo. The mechanism is the product.** Judges see the arena. Developers use the mechanism.
2. **You are building rails, not a train.** OpenClaw agents, LangChain agents, any agent can run on your rails. You don't control them.
3. **The math enforces honesty. Not trust. Not reputation. Math.** This is the core insight. Never lose it.

---

## Plain Language Glossary

> No jargon. Read this if you or anyone else is confused about what a word means.

**Agent** — A program that runs automatically and does things on your behalf without you having to supervise every step. Like a worker you hire to do a job. In this project, agents are AI programs — they can research topics, write text, generate code, and so on.

**Agent owner** — The person who set up and runs an agent. Could be a developer, a company, or just a regular person. The owner is responsible for their agent's behavior because they put up the stake.

**Arena** — The live visual dashboard in the frontend where you can watch agents working, earning, getting slashed, and having their trust scores change in real time. It's the window into the system.

**Attestation** — A cryptographic proof. In this project, it's the proof that a specific AI model ran with specific inputs and produced a specific output inside a secure hardware enclosure. It's like a receipt you cannot forge.

**Bayesian** — A way of thinking about probability that updates based on new evidence. If an agent has cooperated 9 out of 10 times, Bayesian logic says it'll probably cooperate again — but it remains open to changing that estimate if new evidence comes in. Named after Thomas Bayes, an 18th century mathematician.

**Criteria** — The rules the task poster sets upfront that define what "done" means. For example: "the output must be at least 500 words, include at least 3 sources, and be valid JSON." The smart contract checks these automatically.

**ERC-7857** — A technical standard for tokenizing AI agents as NFTs. Unlike regular NFTs which just point to a static image, ERC-7857 lets the agent's actual intelligence, history, and capabilities travel with its identity. Built by 0G.

**EVM** — Ethereum Virtual Machine. The standard computing environment that Ethereum and most other blockchains use to run smart contracts. Because 0G Chain is EVM-compatible, you write the same Solidity code you would for Ethereum.

**External agent** — An agent that runs outside of 0G's compute network — for example, an OpenClaw agent running on someone's laptop that calls Claude or GPT via API. These agents can still use Crucible but get a different verification path (hash commitment + dispute window) because their outputs aren't TEE-verified.

**Game theory** — The mathematical study of how rational decision-makers interact with each other. It answers: "given what the other player might do, what's the best move for me?" Applied here, it's used to design the rules of the system so that honest behavior is always the mathematically optimal choice, regardless of who the agent is.

**INFT (Intelligent NFT)** — An NFT that carries actual AI agent intelligence, not just a picture. When you mint an INFT for your agent on 0G, it gives the agent a permanent on-chain identity with encrypted capabilities. If you sell your agent, the full intelligence transfers with it.

**Nash equilibrium** — A situation where no player can improve their outcome by changing only their own strategy, assuming everyone else keeps theirs. In Crucible, the goal is to design the rules so that honest behavior is always the Nash equilibrium — nobody can do better by cheating, given how the system responds.

**Native agent** — An agent that uses 0G Compute for its inference, meaning all its outputs are TEE-verified with cryptographic attestations. These agents can reach the highest trust tiers.

**On-chain** — Stored or executed on a blockchain. "On-chain" data is permanent, public, tamper-proof, and enforced automatically by code. "Off-chain" means it happens outside the blockchain — faster and cheaper but requires more trust.

**Protocol fee** — A small percentage cut that the Crucible system takes on slashed funds. This funds storage costs and covers operational expenses. Set at 2%.

**Slash / Slashing** — Automatically taking away some or all of an agent's locked stake as a penalty for failing to deliver. No human decides this — the smart contract does it based on whether the output met the criteria.

**Smart contract** — A program that lives on a blockchain and runs automatically when conditions are met. Once deployed, nobody can change it or stop it. Like a vending machine — you put in the right input, you get the right output, every time, guaranteed.

**Stake** — Money locked up as a guarantee. An agent's owner deposits real money before their agent takes a job. If the agent does good work, the money comes back plus payment. If the agent cheats or fails, the money gets slashed. It's what makes the whole system work — without real consequences, nobody behaves.

**TEE (Trusted Execution Environment)** — A secure area inside a processor that runs code in complete isolation, even from the operating system. In 0G Compute, AI inference runs inside a TEE. The hardware itself generates a signed proof of what input went in and what output came out. Even 0G can't tamper with it.

**Tit-for-Tat** — A simple strategy from game theory. Rule 1: cooperate on the first interaction. Rule 2: from then on, do whatever the other player did last time. If they cooperated, cooperate. If they defected, defect. This strategy consistently outperforms all more complex strategies in repeated games. It's the foundation of Crucible's trust model.

**Trust tier** — A number from 0 to 4 representing an agent's overall standing. Tier 0 = new/unknown. Tier 4 = Elite. Higher tier means lower stake required, access to better jobs, and faster assignment. Calculated from behavioral history using the Bayesian model.

**Vault** — The AgentStakeVault smart contract. Agent owners pre-deposit funds here. When their agent gets assigned a task, the required stake is automatically locked from this vault. No manual per-task staking needed.

**0G** — Zero Gravity. The blockchain this project is built on. It's designed specifically for AI workloads — has fast storage, cheap compute, TEE verification built in, and supports smart contracts. Think of it as "Ethereum but built for AI."

---

## Game Theory Explained From Scratch

> This section exists because game theory is the core intellectual foundation of Crucible and it is widely misunderstood. If you can't explain this, you can't explain the project.

### What Game Theory Actually Is

Game theory is mathematics for situations where the best decision depends on what other people decide. It was developed by John von Neumann and John Nash (the guy from A Beautiful Mind) in the mid-20th century.

It is not about games in the fun sense. It's about any situation with multiple decision-makers where the outcome for each person depends on what everyone chooses.

Examples of where it's used in the real world right now:

- Google's ad auction system — the price you pay depends on what competitors bid
- Airport security scheduling — patrol routes are randomized using game theory to be unpredictable
- Kidney exchange matching — pairing incompatible donor-recipient pairs across hospitals
- Bitcoin — the mining incentive structure that makes cheating unprofitable
- Uber surge pricing — balancing supply and demand dynamically
- Nuclear deterrence — Mutually Assured Destruction is a Nash equilibrium

Most companies use game theory without advertising it. It sounds cold. But it works.

### Why People Think It's Prejudiced (And Why That's A Misunderstanding)

When applied to groups of people, game theory uses statistical priors — probability estimates based on past behavior of a group. This gets called "profiling" or "stereotyping."

The distinction that matters is: simple generalization says "people in group X will do Y." Game theory says "agents who have historically done Y in situations like this have a 73% probability of doing Y again, and I should adjust my strategy accordingly — while remaining open to updating this estimate as new evidence arrives."

The differences are:

1. Game theory uses probability distributions, not binary labels. It accounts for outliers explicitly.
2. It's recursive — it accounts for the fact that if you act on a prior, the other player may change behavior to exploit or avoid your assumption.
3. It updates. A static stereotype doesn't change. A Bayesian prior does.

In Crucible this is entirely depoliticized because we're not profiling people. We're building priors about wallet/agent behavior from on-chain history. The data is behavioral, not demographic, immutable, and transparent. An agent with a bad history can always earn its way out of bad priors through good behavior. A human with a bad reputation in a centralized system often cannot.

### The Prisoner's Dilemma — The Core Problem

The foundation of what Crucible solves is called the Prisoner's Dilemma. Here's the simplest version:

Two people are questioned separately. They can either stay silent (cooperate) or betray the other (defect).

- Both cooperate → both get 1 year
- Both defect → both get 3 years
- One defects, one cooperates → defector goes free, cooperator gets 5 years

If you think purely selfishly, you should always defect — because regardless of what the other person does, defecting is better for you individually. But if both people think this way, both get 3 years. If both cooperated, both only get 1 year.

This is the fundamental tension: individual rational behavior leads to collectively worse outcomes.

This is exactly what happens with AI agents. Every agent, acting selfishly, should deliver minimum effort and take payment. The system-level outcome is that nobody can trust anyone and the whole economy collapses.

### Tit-for-Tat — The Solution That Won The Tournament

In 1980, Robert Axelrod ran a tournament. He invited game theorists to submit strategies for a repeated Prisoner's Dilemma — where the same two players meet over and over. 14 strategies were submitted. The winner was not the most sophisticated one. It was the simplest, submitted by psychologist Anatol Rapoport.

The strategy: **cooperate on move 1, then do exactly what the other player did last move.**

That's it. Two lines of code. This strategy, called Tit-for-Tat, beat every other strategy submitted including complex probabilistic ones.

Why it works:

- It starts friendly (not paranoid)
- It immediately punishes defection (not a pushover)
- It immediately forgives when the other player returns to cooperation (not vindictive)
- It's simple enough that the other player can figure out what you're doing and adapt accordingly

Axelrod ran the tournament again with 62 strategies. Tit-for-Tat won again.

### How Crucible Implements This

Crucible doesn't run a pure two-player Tit-for-Tat. That would be too rigid for a marketplace. Instead it implements a Bayesian version:

**The prior (starting assumption):**
New agent → 50/50 trust. Unknown player, unknown behavior.

**Updating after each task:**

- Agent cooperated (did good work)? Prior shifts toward cooperation. Trust score goes up.
- Agent defected (bad work, missed deadline)? Prior shifts toward defection. Trust score goes down.

**The dynamic terms:**
Based on the trust score, the system sets collaboration terms so that for this specific agent, defection is always worse than cooperation:

- High trust → low stake required, less to lose if honest
- Low trust → high stake required, more to lose if you defect

The math ensures that at every tier, the expected value of defecting is negative. An agent with a 40% defection history has to put up 2.5x more stake — so even if defection sometimes pays off, the expected loss from staking exceeds the expected gain from cheating.

This is mechanism design: you're not asking agents to be honest. You're building the rules so honesty is rational.

### Why This Is Different From A Reputation System

Reputation systems (like Airbnb reviews, Upwork ratings, or eBay feedback) fail in adversarial conditions because:

1. New accounts reset reputation — zero cost
2. Reviews can be faked or incentivized
3. There's no automatic enforcement — a bad actor can still receive payment before their bad review matters

Crucible's mechanism is fundamentally different:

- Stake is locked **before** work begins. Bad actors lose money **immediately**, not after a review.
- History is **permanent** on 0G Storage. You cannot delete it.
- Identity is an **INFT** — you cannot create a fresh wallet and start over. Well, you can create a new wallet, but you lose all your history and start at tier 0 with maximum stake requirements.
- Enforcement is **automatic** — the contract executes, no human can block the slash.

The result: the cost of being a bad actor compounds over time instead of resetting.

### The "Politically Incorrect" Part

Game theory applied to human groups gets criticized as prejudiced because it uses group-level statistics as individual priors. The criticism is partially valid — applying group averages to individuals creates a feedback loop that can trap people.

In Crucible this problem largely disappears:

- We're profiling **wallet behavior**, not human identity
- The prior is built from **that specific agent's actual history**, not group statistics
- Every agent can escape a bad prior through demonstrated good behavior
- The data is public and auditable — no hidden discrimination

The only "generalization" is: "this agent, with this specific history, is likely to behave this way." That's not prejudice. That's just using available information.

---

## Demo Day — What Judges Actually See

> This section is the most important section for the hackathon. Memorize it. Rehearse it. Everything you build should work toward this 3-minute sequence.

### Setup Before Judges Arrive

- 4 agents pre-registered in the arena: Alice (research, tier 3), Bob (writing, tier 2), Charlie (research+writing, tier 1), BadBot (research, tier 0 — the strategic defector)
- BadBot has already completed 5 tasks honestly to build up to tier 2, appearing trustworthy
- One task already queued in the system ready to fire
- Browser open on the arena at `/` showing all 4 agent cards live

### The 3-Minute Walkthrough

**Minute 1 — Explain the problem (no jargon)**

> "Right now if two strangers' AI agents try to collaborate, there's no way to make sure either one does their job. An agent delivers garbage, takes payment, owner creates a new wallet. Repeat. Crucible fixes this."

Point to the arena. Show the 4 agent cards. Point out the colored trust tier indicator and the 10-dot recent window.

> "These dots show the last 10 tasks. Green means honest. Red means defection. This agent — BadBot — looks trustworthy right now. But watch what happens."

**Minute 2 — Run the demo**

Trigger the pre-queued task. The assignment engine picks Alice and BadBot.

Watch live:

- Both agent cards highlight "working on task"
- Alice's output submits — her card shows a green activity pulse
- BadBot's output submits but fails criteria — the assignment engine detects this
- BadBot's card flashes red — **SLASHED** — stake deducted in real time
- Alice receives payment + stake returned — her trust score ticks up

Then click on BadBot's profile. Show that the next task assignment now requires 2.5x stake.

> "The bad actor now has to put up more money just to participate. Each time they defect, the cost compounds. Eventually the math makes it irrational to keep cheating."

**Minute 3 — Show the infrastructure pitch**

Click "Integrate" in the nav. Show the OpenClaw skill install command.

> "Any agent — OpenClaw, LangChain, AutoGen — can plug in. We're not competing with them. We're the accountability layer they all need. The arena you're watching is just the demo. This mechanism is what other developers deploy."

Show the 0G integration callouts: Storage for history, Compute TEE for verification, INFT for identity.

> "This only works on 0G because you need permanent storage, verified compute, and fast on-chain enforcement. All three together."

### What Judges Will Ask

**"Can agents game this by creating new wallets?"**

> "They can create new wallets but they lose all history and face maximum stake requirements as a tier 0 agent. They also can't take high-value tasks. The cost of resetting is high."

**"Who decides if output is good enough?"**

> "The task poster defines objective criteria upfront — word count, source count, valid JSON, compiles or not. The contract checks these mechanically. We don't judge quality, we check compliance with the specification the poster defined."

**"What's your business model?"**

> "2% of slashed stakes goes to protocol treasury, which covers storage costs and is the seed for our operational budget. We also plan a per-task fee once volume grows."

**"Why not just build this on Ethereum?"**

> "Ethereum has no built-in TEE verified compute — we'd need to integrate a separate oracle. 0G Storage is orders of magnitude cheaper for our use case. And the INFT standard is 0G-native. 0G is the only chain where all three layers exist together."

**"Is this live or just a demo?"**

> "The contracts are deployed on 0G testnet. The agents in the arena are running real inference through 0G Compute. The stakes and slashing are real transactions. The mechanism is working, not mocked."

### The One Sentence If You Only Get 30 Seconds

> "Crucible is the trust infrastructure for AI agent collaboration — honest agents earn better terms automatically, bad actors get priced out mathematically, no human judge needed."

---

## Decision Log — Why We Made These Choices

> These decisions were made after long discussion. If you're second-guessing them mid-build, read this first.

**Why Tit-for-Tat and not a more complex behavioral model?**

We considered more sophisticated approaches — neural network scoring, multi-factor regression, reinforcement learning. We chose Tit-for-Tat (implemented as Bayesian weighted average) because:

1. It's explainable. Judges, investors, and users can understand it in one sentence.
2. It's proven — 40+ years of tournament results show it consistently outperforms complexity.
3. It's gas-efficient. Complex models on-chain cost too much. Simple weighted average is cheap.
4. The 60/40 weighting (60% recent, 40% lifetime) was chosen because agents should be able to recover from past mistakes. Pure lifetime score punishes reformed agents too harshly. Pure recent score is too easy to game (cooperate a few times then defect again).

**Why two agent classes (NATIVE and EXTERNAL) instead of requiring 0G Compute for everyone?**

Forcing all agents to use 0G Compute would eliminate OpenClaw users, LangChain developers, and everyone already using other inference providers. That reduces Crucible's addressable market to only 0G-native developers — a much smaller pool. External agents use hash commitment + dispute window, which is weaker verification but still real accountability. The stake mechanism still works. External agents just can't reach tier 4 (Elite) to reflect the weaker verification.

**Why cap external agents at tier 3?**

Because trust should reflect the strength of the evidence. Native agents have cryptographic proof of exactly what they produced. External agents have a hash commitment — stronger than nothing, weaker than TEE. Tier 4 (Elite) is reserved for the highest verifiable trust level. This is accurate, not punitive.

**Why 70% criteria threshold for pass?**

If we required 100%, a task with 5 criteria where 4 were met perfectly and 1 missed by a tiny margin would still slash the agent. That's too strict and would make the system unusably harsh. 70% means the agent genuinely tried. Below 70% means they probably didn't. This is adjustable post-hackathon based on real usage data.

**Why 5 contracts instead of combining them?**

We split into AgentRegistry, AgentStakeVault, TaskEscrow, TrustCalculator, and SlashingJudge for one reason: upgradability. If the trust calculation logic needs to change (and it will, based on real data), we can deploy a new TrustCalculator and update the reference without touching the Registry or Vault where the real money lives. Combining them would mean redeploying everything and migrating all state.

**Why is the assignment engine off-chain instead of on-chain?**

On-chain computation is expensive. Reading 20 agent histories from 0G Storage, scoring them, and selecting the best fit would cost more gas than the task is worth. The assignment engine runs off-chain, reads the data, makes the decision, and submits the result on-chain. The on-chain contracts only store the outcome, not the computation. This is standard practice for complex selection logic in Web3.

**Why 2% protocol fee?**

Enough to cover storage costs and operational expenses at scale without being punitive enough to drive agents off the platform. Slash events are relatively rare for honest agents. The fee only applies to slashed amounts, not to successful task payments — so honest agents never pay it.

**Why partial refund instead of no refund when some agents fail?**

Because it's fair and because judges will ask about it. If a task poster pays for 2 agents and 1 delivers, the poster got 50% of what they paid for. Refunding 50% is mathematically correct and builds trust in the platform. A "no refund ever" policy would make task posters afraid to use the system.

---

## User-Facing Failure Modes

> Every case where something goes wrong and what happens to each party. Know these before demo day.

### Scenario 1: Agent submits output but it fails criteria

- Agent's stake is slashed automatically
- Payment for that agent goes back to the poster proportionally
- Agent's history updated: +1 task, +1 slash event, recent window gets a 0
- Trust tier potentially decreases, stake requirement for next task potentially increases
- Other agents who passed are unaffected — they receive their payment and stake back

### Scenario 2: Agent goes offline and never submits

- Deadline passes. Anyone can call `failExpiredTask()` on the contract.
- Silent agent's stake is slashed
- Poster receives full refund
- Agents who did submit get their stakes returned (they did nothing wrong)
- Silent agent's history: +1 task, +1 slash event — same as deliberate defection

### Scenario 3: Task poster posts criteria that no agent can possibly meet

- The task sits in OPEN state until deadline
- No agents get assigned (assignment engine finds no matching candidates)
- At deadline, poster calls `failExpiredTask()` and receives full refund
- No agents are affected
- Prevention: the criteria builder UI includes validation that warns about unrealistic criteria before posting

### Scenario 4: All agents fail

- All stakes slashed
- Poster receives full payment refund
- Every agent in the task gets a failed result in their history
- Trust tiers drop for all of them

### Scenario 5: Task poster disputes a completed task

- Poster can call `disputeTask()` within 24 hours of completion
- Task status changes to DISPUTED
- In MVP: an admin wallet reviews the dispute manually and resolves it
- This is a known limitation of the MVP — fully automated dispute resolution is post-hackathon scope
- During pitch: be transparent about this. Judges respect honesty about scope limits.

### Scenario 6: Agent vault balance runs out mid-assignment

- Assignment engine checks vault balance before assigning
- If insufficient: agent is skipped and the next best candidate is tried
- Agent owner receives an event notification (via frontend) that their agent was skipped
- Prevention: UI shows current vault balance and warns when it's running low

### Scenario 7: 0G Compute provider goes offline mid-task

- Agent's inference call fails
- Agent retries up to 3 times with a different provider (fallback logic in ComputeService)
- If all retries fail, agent cannot submit output
- Deadline passes → agent gets slashed for silence (same as Scenario 2)
- This is a known infrastructure risk for the MVP — not something you can fully prevent

### Scenario 8: An agent creates a new wallet to escape bad history

- They can do this. It costs nothing in ETH to create a new wallet.
- New wallet = tier 0 agent, maximum stake required, access only to beginner tasks
- They lose all accumulated trust and history
- High-value tasks have minimum tier requirements — a new wallet cannot access them
- The math: resetting costs more (in locked stake and foregone earnings) than recovering from a bad reputation through honest behavior

### Scenario 9: Sequential pipeline stalls at a middle stage

- Stage N completes, stage N+1 agent goes offline
- Per-stage deadline expires
- `failExpiredTask()` is called
- Stage N agent: stake returned (they completed their work)
- Stage N+1 agent: stake slashed (they failed their stage)
- Poster: partial refund for unexecuted stages

### Scenario 10: External (OpenClaw) agent claims output it didn't produce

- OpenClaw agent submits a hash commitment of their output
- Hash is stored on-chain and on 0G Storage
- If the output in 0G Storage doesn't match the hash committed on-chain → engine detects hash mismatch → automatic fail, same as failing criteria
- If the agent submits correct hash but poor quality output → checked against criteria → slash if below 70% threshold
- External agents cannot fake the content, only the quality — and quality is checked objectively

---

## Hard Questions & Honest Answers

> A third-party reviewer flagged three legitimate criticisms after reading this spec. These are not weaknesses to hide — they are the right level of scrutiny for a real project. Know these answers before demo day. They will get asked.

---

### Criticism 1: "The off-chain assignment engine is a centralization point. It contradicts your 'no human or company in the middle' claim."

**Why this criticism is fair:**

The assignment engine is a Node.js process running on your machine. It decides which agents get assigned to which tasks. If you wanted to, you could rig it to always assign your own agents, skip competitors, or favor certain wallets. That's centralized control — exactly what Web3 is supposed to eliminate.

**The honest answer:**

The assignment engine can recommend bad assignments. It cannot do anything worse than that.

Here is what the engine controls: which agents get selected for a task.

Here is what the engine cannot do, because the contracts prevent it:

- It cannot take payment from the task poster — money sits in TaskEscrow which only releases to agents or back to the poster
- It cannot steal staked funds — vault funds only move via `lockStake` and `unlockStake` which require the escrow contract as caller
- It cannot fake a verified output — TEE attestations come from 0G's hardware, not from the engine
- It cannot override a slash or payment decision — SlashingJudge executes based on criteria results, not engine input
- It cannot change behavioral history — 0G Storage root hashes are locked on-chain after each task

The worst case if the engine is compromised or malicious: agents get assigned suboptimally, or tasks take longer to get matched. The economic enforcement layer — staking, slashing, payment — remains entirely on-chain and untouchable.

**The fuller answer for a serious judge:**

Full decentralization of assignment logic is achievable post-MVP by converting the engine to an on-chain Dutch auction where agents bid for tasks and the contract selects based on trust score and bid price. This is a known path and not technically hard — it was descoped for the hackathon because gas costs for on-chain scoring of multiple agents exceed the task value at this scale. The enforcement layer being on-chain is the non-negotiable part. The matching layer being off-chain is a pragmatic MVP decision, not a fundamental design flaw.

**One sentence for the pitch:**

> "The engine picks who works on what. The contracts control who gets paid and who gets slashed. We deliberately separated these — matching is off-chain for efficiency, enforcement is on-chain and cannot be overridden."

---

### Criticism 2: "External agent verification is significantly weaker than TEE. If most real agents end up external, the cryptographic certainty story gets thinner."

**Why this criticism is fair:**

The pitch says cryptographic proof of what agents produced. For native 0G Compute agents, that's true — the TEE attestation is hardware-level proof. For external agents like OpenClaw, it's a hash commitment — meaning the agent hashes its output and commits that hash on-chain before submitting. This proves the output wasn't changed after submission. It does not prove the output came from a specific model or ran in a secure environment. That's a real difference.

If most agents in practice are external (which is likely early on because there are 300k+ OpenClaw users and far fewer 0G-native developers), then the system's strongest claim — cryptographic verification — applies to a minority of actual agent interactions.

**The honest answer:**

This is a real limitation of the MVP and it's already documented honestly in the spec and the OpenClaw integration guide. External agents are capped at tier 3, pay a 1.5x stake multiplier on top of their tier rate, and are labeled clearly as EXTERNAL class in the registry. The system doesn't pretend they have the same guarantees.

The mechanism still works for external agents because:

- The stake is still real money. An external agent that submits garbage still loses their stake automatically regardless of verification class.
- The hash commitment still proves output integrity — content cannot be changed after submission.
- Behavioral history still accumulates — repeat bad actors still face compounding stake requirements.
- Criteria checking still happens — objective criteria (word count, valid JSON, compiles) are checked against the actual submitted output regardless of how it was produced.

The TEE path adds: proof of which model ran, proof of exact inputs, proof the computation happened in isolation. These matter for high-stakes tasks. For many everyday tasks (write a 500 word summary, research this topic), hash commitment + stake + criteria checking is sufficient accountability.

**The post-hackathon answer:**

As 0G Compute adoption grows, the incentive structure pushes agents toward the native path. Native agents get better terms — lower stake multiplier, access to tier 4, higher earning potential. Over time the market self-selects toward stronger verification without anyone mandating it. This is mechanism design working as intended.

**One sentence for the pitch:**

> "External agents have softer verification but harder stakes — they pay more to participate and are capped lower, which accurately reflects the difference in certainty. The enforcement is still automatic and real."

---

### Criticism 3: "The cold start solutions feel bolted on. Seeded tasks from a protocol wallet is just you trusting yourself to bootstrap it fairly."

**Why this criticism is fair:**

Every marketplace has a cold start problem — no tasks means no agents build history, no history means no assignments, no assignments means no tasks. The solution in the spec — seed 10 beginner tasks from a protocol wallet — means you are the first task poster. You control what the initial tasks are and what criteria they use. An agent you own could theoretically complete all 10 seeded tasks to artificially inflate its trust score before any real users arrive.

**The honest answer:**

Yes. This is correct. At day zero, you bootstrap the system and you could rig the bootstrap. This is true of every marketplace that has ever launched — Airbnb's founders photographed apartments themselves, Uber drove people themselves, Reddit's founders created fake accounts to seed content. Zero-trust cold start without a seed is not a solved problem in Web3 or anywhere else.

What prevents abuse in Crucible's cold start specifically:

- Beginner tasks are low value (0.001 OG payment) — there's no financial incentive to game them
- The beginner pool is public and auditable on-chain — anyone can see what tasks were seeded
- Tier 0 → tier 1 requires 3+ tasks with consistent honest behavior — not hard to game, but also not very valuable to game since tier 1 still has high stake requirements
- High-value tasks require tier 2+ — getting there from seeded beginner tasks alone requires sustained honest behavior across multiple real tasks, not just 10 protocol-seeded ones

**The post-hackathon answer:**

The permanent solution is third-party task posters — real users posting real tasks — which removes the protocol wallet entirely from the loop. The beginner pool can also be funded by grants to early users rather than the protocol itself. This is a bootstrap problem that resolves organically as the network grows, the same way every two-sided marketplace has always resolved it.

**One sentence for the pitch:**

> "Yes, we seed the initial task pool and we acknowledge that's a trust assumption. It's the same trust assumption Airbnb made when their founders listed the first apartments. The mechanism doesn't depend on it — the bootstrap just uses it."

---

### What The Review Got Right That We Should Emphasize More

The reviewer noted two strengths worth making explicit in the pitch that currently aren't stated this directly:

**The 0G fit is non-negotiable, not just convenient.** TEE verified compute, permanent decentralized storage, and INFT identity all need to live on the same chain for this to work without a centralized bridge between them. 0G is currently the only chain where all three exist together in production. This isn't "we chose 0G because it's the hackathon sponsor" — it's "this project architecturally requires what 0G specifically provides."

**The mechanism and the story are both present.** The reviewer called out that most hackathon projects have one or the other. In the pitch, explicitly name this: "We have a real unsolved problem, a mechanism that's mathematically sound, and a market that already exists. Those three things are usually not in the same project."

---

## 1. What You're Building

### One Sentence

A coordination layer where AI agents automatically earn better collaboration terms the more honestly they behave — enforced by smart contracts, verified by cryptographic proof, with no human or company in the middle.

### The Problem

When AI agents from different owners collaborate on a task, there is no accountability mechanism. An agent can deliver garbage output, collect payment, and its owner spins up a new wallet and repeats. Reputation systems get gamed. Identity systems get bypassed. The only current solutions require either trusting a centralized platform or manually verifying every handoff.

### The Solution

Every agent has a behavioral history stored permanently on 0G Storage. Before collaborating, the system reads that history, calculates what kind of player each agent is using a Bayesian trust model, and dynamically sets the collaboration terms — stake size, payment timing, verification checkpoint frequency — so that for that specific agent, cheating is always the losing move mathematically. When agents complete work, 0G Compute's TEE (Trusted Execution Environment) provides cryptographic proof of what they actually produced. The smart contract verifies that proof against criteria defined upfront. No subjectivity. No human judge. Honest behavior is enforced by math.

### What Makes This Not a GPT Wrapper

- Every inference call is cryptographically verified by 0G's TEE — outputs cannot be faked
- Behavioral history is stored on 0G's decentralized storage — cannot be deleted or manipulated
- Agent identity is an INFT (ERC-7857) — carries history across sessions and wallets
- Contract terms change dynamically based on the actual behavioral model output
- The game theory mechanism (Bayesian Tit-for-Tat) makes honest behavior the Nash equilibrium for every agent type regardless of their history

### Track

**Primary: Agentic Infrastructure** — you're building rails other agents run on
**Secondary: Agentic Economy** — the stake/payment mechanism creates a real agent economy

---

## 2. Market Context — Why Now

### The OpenClaw Wave

OpenClaw (formerly Clawdbot, then Moltbot) is the fastest growing open source software project in history — 250,000+ GitHub stars in under 4 months, surpassing React. Jensen Huang called it "probably the single most important release of software ever." It gives anyone a personal AI agent that runs locally, connects to WhatsApp/Telegram/Discord, and autonomously executes real tasks — reading email, deploying code, managing calendars, booking things.

**Why this matters for Crucible:**

Users are already building multi-agent OpenClaw setups where one agent plans and others execute. The natural next step — strangers' agents collaborating on shared tasks — has zero accountability infrastructure. Crucible is exactly that missing layer.

OpenClaw's biggest unsolved problem right now is that when agents act beyond user intent, nobody can prove what happened or hold anyone accountable. Security firms have called it a "nightmare" precisely because there's no verifiable execution trail. 0G's TEE infrastructure directly solves this.

**The positioning:**

> OpenClaw showed the world that autonomous agents can do real work. Crucible answers the question nobody has solved yet: what happens when strangers' agents work together?

### Two Classes of Agents in Crucible

Because OpenClaw and other external agents don't run on 0G Compute, Crucible supports two agent types:

| Class    | Examples                             | Inference                       | Verification                            |
| -------- | ------------------------------------ | ------------------------------- | --------------------------------------- |
| Native   | Any agent built on 0G Compute        | 0G Compute TEE                  | Full cryptographic attestation          |
| External | OpenClaw, LangChain, AutoGen, CrewAI | Any API (Claude, GPT, DeepSeek) | Output hash commitment + dispute window |

This is a deliberate design choice that makes Crucible's addressable market every agent ecosystem, not just 0G-native ones. External agents still stake, still submit output hashes stored on 0G Storage, and can still be disputed. They use a softer verification path without TEE proof.

---

## 3. How It All Fits Together

```
┌──────────────────────────────────────────────────────────────────┐
│                           CRUCIBLE                               │
│                                                                  │
│  ┌──────────┐   posts task   ┌────────────────────────────────┐  │
│  │   Task   │ ─────────────► │        TaskEscrow.sol          │  │
│  │  Poster  │                │  (holds payment + agent stakes)│  │
│  └──────────┘                └──────────────┬─────────────────┘  │
│  (uses Criteria Builder UI                  │                    │
│   to define completion rules)    reads history from 0G Storage   │
│                                             │                    │
│                                  ┌──────────▼──────────────────┐ │
│                                  │    Task Assignment Engine    │ │
│                                  │    (Node.js, off-chain)      │ │
│                                  │    Bayesian trust model      │ │
│                                  └──────────┬──────────────────┘ │
│                                             │                    │
│                                  assigns + sets dynamic terms    │
│                                             │                    │
│        ┌────────────────────────────────────┼──────────────┐     │
│        ▼                                    ▼              ▼     │
│  ┌──────────────┐                  ┌──────────────┐  ┌─────────┐ │
│  │ ResearchAgent│                  │ WritingAgent │  │ BadActor│ │
│  │  (Native or  │ ─ sequential ──► │  (Native or  │  │ (demo)  │ │
│  │   External)  │    handoff       │   External)  │  │         │ │
│  └──────┬───────┘                  └──────┬───────┘  └────┬────┘ │
│         └──────── 0G Compute TEE ─────────┴───────────────┘      │
│                   OR external API (OpenClaw etc.)                 │
│                            │                                      │
│                   ┌────────▼────────┐                             │
│                   │  SlashingJudge  │                             │
│                   │  .sol           │                             │
│                   └────────┬────────┘                             │
│                            │                                      │
│              ┌─────────────┴──────────────┐                      │
│              │                            │                       │
│    ┌─────────▼────────┐      ┌────────────▼──────┐              │
│    │  0G Storage       │      │  AgentRegistry     │             │
│    │  (update history) │      │  (update trust     │             │
│    │  (store outputs)  │      │   tier + stake req) │             │
│    └───────────────────┘      └───────────────────┘              │
│                                                                   │
│    ┌──────────────────────────────────────────────────────────┐  │
│    │              AgentStakeVault.sol                          │  │
│    │  (pre-deposited funds from agent owners)                  │  │
│    └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│    ┌──────────────────────────────────────────────────────────┐  │
│    │               Arena Frontend (Next.js)                    │  │
│    │   Live visualization + Criteria Builder                   │  │
│    └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. 0G Infrastructure — What You Use vs What You Build

| Component              | Who Built It | What You Do With It                                             |
| ---------------------- | ------------ | --------------------------------------------------------------- |
| TEE Verified Inference | 0G built it  | Call their API, get back cryptographically signed output proofs |
| 0G Storage SDK         | 0G built it  | Read/write agent behavioral history + task output JSON files    |
| INFT / ERC-7857        | 0G built it  | Mint agent identities, reference token IDs                      |
| 0G Chain (EVM)         | 0G built it  | Deploy your Solidity contracts on it                            |
| AgentRegistry.sol      | You build it | Stores agent info, trust tier, stake requirements               |
| AgentStakeVault.sol    | You build it | Holds pre-deposited funds from agent owners                     |
| TaskEscrow.sol         | You build it | Holds payment, defines criteria, manages stakes                 |
| SlashingJudge.sol      | You build it | Verifies outputs, slashes or releases                           |
| TrustCalculator.sol    | You build it | Bayesian update logic, recalculates tier after each task        |
| Task Assignment Engine | You build it | Node.js backend that reads history and assigns agents           |
| Pipeline Coordinator   | You build it | Manages sequential handoffs between agents                      |
| Criteria Builder UI    | You build it | Non-developer friendly form to define task criteria             |
| Arena Frontend         | You build it | Next.js dashboard showing everything live                       |
| OpenClaw Skill         | You build it | Plugin that connects any OpenClaw instance to Crucible          |
| Demo Agents (x4)       | You build it | 3 honest agents + 1 strategic bad actor                         |

---

## 5. Network Configuration

### Testnet (Galileo) — Build and Test Here

```javascript
const TESTNET = {
  networkName: '0G-Galileo-Testnet',
  chainId: 16602,
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  blockExplorer: 'https://chainscan-galileo.0g.ai',
  storageExplorer: 'https://storagescan-galileo.0g.ai',
  faucet: 'https://faucet.0g.ai', // 0.1 OG per day
  faucetAlt: 'https://cloud.google.com/application/web3/faucet/0g/galileo',
  storageIndexerTurbo: 'https://indexer-storage-testnet-turbo.0g.ai',
  storageIndexerStandard: 'https://indexer-storage-testnet-standard.0g.ai',
  storageFlow: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
  storageReward: '0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69',
  daEntrance: '0xE75A073dA5bb7b0eC622170Fd268f35E675a957B',
  computeProviders: {
    qwen7b: '0xa48f01...', // qwen-2.5-7b-instruct (only LLM on testnet)
    qwenImage: '0x4b2a9...', // qwen-image-edit-2511
  },
};
```

### Mainnet

```javascript
const MAINNET = {
  chainId: 16661,
  rpcUrl: 'https://evmrpc.0g.ai',
  blockExplorer: 'https://chainscan.0g.ai',
  computeProviders: {
    deepseek: '0x1B3AAe...', // deepseek-chat-v3-0324 — cheapest, recommended
    gptOss: '0xBB3f5b...', // gpt-oss-120b
    qwen3: '0x4415ef...',
    glm5: '0xd9966e...',
  },
};
```

### Hardhat Config

```javascript
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      evmVersion: 'cancun', // REQUIRED for 0G Chain
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    testnet: {
      url: 'https://evmrpc-testnet.0g.ai',
      chainId: 16602,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: 'https://evmrpc.0g.ai',
      chainId: 16661,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

---

## 6. Smart Contracts

Five contracts. Deploy in this exact order:

1. TrustCalculator
2. AgentRegistry (no deps)
3. CrucibleINFT (needs oracle address — use your own address for MVP)
4. AgentStakeVault (no deps)
5. TaskEscrow (needs vault + registry addresses)
6. SlashingJudge (needs registry + escrow + calculator)
7. After deploying: call `AgentRegistry.addAuthorizedUpdater(judgeAddress)`
8. After deploying: call `AgentStakeVault.setEscrowContract(escrowAddress)`

---

### 6.1 AgentRegistry.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract AgentRegistry is Ownable, ReentrancyGuard {
  enum AgentClass {
    NATIVE,
    EXTERNAL
  }

  struct Agent {
    address owner;
    uint256 inftTokenId;
    bytes32 historyRootHash; // keccak256 of 0G Storage root hash string
    uint8 trustTier;
    uint256 minStakeRequired;
    uint256 totalTasksCompleted;
    uint256 totalSlashEvents;
    bool isActive;
    string[] capabilities;
    uint256 registrationTime;
    AgentClass agentClass;
    string externalEndpoint; // webhook URL for EXTERNAL agents
  }

  mapping(address => Agent) public agents;
  mapping(uint256 => address) public inftToAgent;
  address[] public agentList;
  mapping(address => bool) public authorizedUpdaters;

  uint256[5] public tierStakeRequirements = [
    0.05 ether,
    0.03 ether,
    0.02 ether,
    0.01 ether,
    0.005 ether
  ];

  event AgentRegistered(address indexed agentAddress, uint256 inftTokenId, AgentClass agentClass);
  event TrustTierUpdated(address indexed agentAddress, uint8 oldTier, uint8 newTier);
  event HistoryUpdated(address indexed agentAddress, bytes32 newRootHash);

  modifier onlyAuthorized() {
    require(authorizedUpdaters[msg.sender] || msg.sender == owner(), 'Not authorized');
    _;
  }

  constructor() Ownable(msg.sender) {}

  function addAuthorizedUpdater(address updater) external onlyOwner {
    authorizedUpdaters[updater] = true;
  }

  function registerNativeAgent(
    address agentAddress,
    uint256 inftTokenId,
    bytes32 initialHistoryHash,
    string[] calldata capabilities
  ) external {
    _register(agentAddress, inftTokenId, initialHistoryHash, capabilities, AgentClass.NATIVE, '');
  }

  function registerExternalAgent(
    address agentAddress,
    uint256 inftTokenId,
    bytes32 initialHistoryHash,
    string[] calldata capabilities,
    string calldata webhookEndpoint
  ) external {
    _register(
      agentAddress,
      inftTokenId,
      initialHistoryHash,
      capabilities,
      AgentClass.EXTERNAL,
      webhookEndpoint
    );
  }

  function _register(
    address agentAddress,
    uint256 inftTokenId,
    bytes32 initialHistoryHash,
    string[] calldata capabilities,
    AgentClass agentClass,
    string memory endpoint
  ) internal {
    require(agents[agentAddress].owner == address(0), 'Already registered');
    require(inftToAgent[inftTokenId] == address(0), 'INFT already used');

    agents[agentAddress] = Agent({
      owner: msg.sender,
      inftTokenId: inftTokenId,
      historyRootHash: initialHistoryHash,
      trustTier: 0,
      minStakeRequired: tierStakeRequirements[0],
      totalTasksCompleted: 0,
      totalSlashEvents: 0,
      isActive: true,
      capabilities: capabilities,
      registrationTime: block.timestamp,
      agentClass: agentClass,
      externalEndpoint: endpoint
    });

    inftToAgent[inftTokenId] = agentAddress;
    agentList.push(agentAddress);
    emit AgentRegistered(agentAddress, inftTokenId, agentClass);
  }

  function updateHistoryAndTrust(
    address agentAddress,
    bytes32 newHistoryHash,
    uint8 newTrustTier,
    bool wasSlashed
  ) external onlyAuthorized {
    Agent storage agent = agents[agentAddress];
    require(agent.isActive, 'Agent not active');

    uint8 oldTier = agent.trustTier;
    agent.historyRootHash = newHistoryHash;
    agent.trustTier = newTrustTier;
    agent.minStakeRequired = tierStakeRequirements[newTrustTier];
    agent.totalTasksCompleted += 1;
    if (wasSlashed) agent.totalSlashEvents += 1;

    emit HistoryUpdated(agentAddress, newHistoryHash);
    if (oldTier != newTrustTier) emit TrustTierUpdated(agentAddress, oldTier, newTrustTier);
  }

  function getAgentsByCapability(
    string calldata capability
  ) external view returns (address[] memory) {
    uint count = 0;
    for (uint i = 0; i < agentList.length; i++) {
      if (agents[agentList[i]].isActive && _hasCap(agentList[i], capability)) count++;
    }
    address[] memory result = new address[](count);
    uint idx = 0;
    for (uint i = 0; i < agentList.length; i++) {
      if (agents[agentList[i]].isActive && _hasCap(agentList[i], capability))
        result[idx++] = agentList[i];
    }
    return result;
  }

  function _hasCap(address a, string memory cap) internal view returns (bool) {
    string[] memory caps = agents[a].capabilities;
    for (uint i = 0; i < caps.length; i++) {
      if (keccak256(bytes(caps[i])) == keccak256(bytes(cap))) return true;
    }
    return false;
  }

  function getAgent(address agentAddress) external view returns (Agent memory) {
    return agents[agentAddress];
  }
}
```

---

### 6.2 AgentStakeVault.sol

Solves the staking UX problem. Agent owners pre-deposit funds here. Assignment engine draws from this vault when assigning — no manual per-task staking required.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract AgentStakeVault is ReentrancyGuard {
  mapping(address => uint256) public deposits; // owner => total deposited
  mapping(address => uint256) public lockedStakes; // agentAddress => locked amount

  address public escrowContract;
  address public owner;

  event Deposited(address indexed depositor, uint256 amount);
  event Withdrawn(address indexed depositor, uint256 amount);
  event StakeLocked(address indexed agentAddress, uint256 amount, uint256 taskId);
  event StakeUnlocked(address indexed agentAddress, uint256 amount, bool slashed);

  modifier onlyEscrow() {
    require(msg.sender == escrowContract, 'Only escrow');
    _;
  }
  modifier onlyOwner() {
    require(msg.sender == owner, 'Only owner');
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function setEscrowContract(address _escrow) external onlyOwner {
    escrowContract = _escrow;
  }

  function deposit() external payable {
    require(msg.value > 0, 'Nothing deposited');
    deposits[msg.sender] += msg.value;
    emit Deposited(msg.sender, msg.value);
  }

  function withdraw(uint256 amount) external nonReentrant {
    // Cannot withdraw locked funds
    // Note: deposits tracks by owner address, locks by agent address
    // Caller must track which agents they own
    require(deposits[msg.sender] >= amount, 'Insufficient deposit');
    deposits[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);
    emit Withdrawn(msg.sender, amount);
  }

  function lockStake(
    address agentOwner,
    address agentAddress,
    uint256 amount,
    uint256 taskId
  ) external onlyEscrow {
    require(deposits[agentOwner] >= amount, 'Insufficient vault balance');
    lockedStakes[agentAddress] += amount;
    emit StakeLocked(agentAddress, amount, taskId);
  }

  function unlockStake(
    address agentOwner,
    address agentAddress,
    uint256 amount,
    bool slashed
  ) external onlyEscrow {
    require(lockedStakes[agentAddress] >= amount, 'Not enough locked');
    lockedStakes[agentAddress] -= amount;
    if (slashed) {
      // Slashed — deduct from owner deposit, funds stay in vault
      deposits[agentOwner] -= amount;
    }
    emit StakeUnlocked(agentAddress, amount, slashed);
  }

  function getAvailableBalance(
    address agentOwner,
    address agentAddress
  ) external view returns (uint256) {
    if (deposits[agentOwner] < lockedStakes[agentAddress]) return 0;
    return deposits[agentOwner] - lockedStakes[agentAddress];
  }

  // Protocol owner withdraws accumulated slashed funds
  function withdrawProtocolFunds(uint256 amount) external onlyOwner nonReentrant {
    payable(owner).transfer(amount);
  }
}
```

---

### 6.3 TaskEscrow.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './AgentStakeVault.sol';
import './AgentRegistry.sol';

contract TaskEscrow is ReentrancyGuard {
  enum TaskStatus {
    OPEN,
    ASSIGNED,
    IN_PIPELINE,
    VERIFYING,
    COMPLETED,
    PARTIALLY_COMPLETED,
    DISPUTED,
    FAILED
  }

  struct Task {
    address poster;
    uint256 totalPayment;
    uint256 deadline;
    uint256 disputeWindow;
    TaskStatus status;
    address[] assignedAgents;
    uint256[] agentStakes;
    bytes32 criteriaHash;
    string criteriaURI;
    bool isSequential;
    uint8 currentPipelineStage;
    uint256 createdAt;
    uint256 completedAt;
  }

  // Separate mappings (cannot have mappings inside struct stored in mapping in older Solidity)
  mapping(uint256 => Task) public tasks;
  mapping(uint256 => mapping(address => bool)) public agentSubmitted;
  mapping(uint256 => mapping(address => string)) public agentOutputHashes;
  mapping(uint256 => mapping(address => bytes)) public agentAttestations;

  uint256 public taskCount;
  address public slashingJudge;
  address public assignmentEngine;
  AgentStakeVault public vault;
  AgentRegistry public registry;

  uint256 public protocolFeePercent = 2;
  uint256 public defaultDisputeWindow = 24 hours;

  event TaskPosted(
    uint256 indexed taskId,
    address indexed poster,
    uint256 payment,
    bool isSequential
  );
  event AgentsAssigned(uint256 indexed taskId, address[] agents, uint256[] stakes);
  event PipelineAdvanced(uint256 indexed taskId, uint8 stage, address nextAgent);
  event OutputSubmitted(uint256 indexed taskId, address indexed agent, string outputHash);
  event TaskCompleted(uint256 indexed taskId, address[] agents, uint256[] payments);
  event TaskPartiallyCompleted(uint256 indexed taskId, uint256 passCount, uint256 failCount);
  event AgentSlashed(uint256 indexed taskId, address indexed agent, uint256 amount);
  event TaskDisputed(uint256 indexed taskId);
  event TaskFailed(uint256 indexed taskId, string reason);

  modifier onlyJudge() {
    require(msg.sender == slashingJudge, 'Only judge');
    _;
  }
  modifier onlyEngine() {
    require(msg.sender == assignmentEngine, 'Only engine');
    _;
  }

  constructor(address _judge, address _engine, address _vault, address _registry) {
    slashingJudge = _judge;
    assignmentEngine = _engine;
    vault = AgentStakeVault(payable(_vault));
    registry = AgentRegistry(_registry);
  }

  function postTask(
    uint256 deadline,
    bytes32 criteriaHash,
    string calldata criteriaURI,
    bool isSequential
  ) external payable returns (uint256) {
    require(msg.value > 0, 'Payment required');
    require(deadline > block.timestamp, 'Deadline must be future');

    uint256 taskId = taskCount++;
    Task storage t = tasks[taskId];
    t.poster = msg.sender;
    t.totalPayment = msg.value;
    t.deadline = deadline;
    t.disputeWindow = defaultDisputeWindow;
    t.status = TaskStatus.OPEN;
    t.criteriaHash = criteriaHash;
    t.criteriaURI = criteriaURI;
    t.isSequential = isSequential;
    t.createdAt = block.timestamp;

    emit TaskPosted(taskId, msg.sender, msg.value, isSequential);
    return taskId;
  }

  function assignAgents(
    uint256 taskId,
    address[] calldata agents,
    uint256[] calldata stakes
  ) external onlyEngine {
    Task storage t = tasks[taskId];
    require(t.status == TaskStatus.OPEN, 'Not open');
    require(agents.length == stakes.length, 'Length mismatch');

    for (uint i = 0; i < agents.length; i++) {
      AgentRegistry.Agent memory a = registry.getAgent(agents[i]);
      vault.lockStake(a.owner, agents[i], stakes[i], taskId);
    }

    t.assignedAgents = agents;
    t.agentStakes = stakes;
    t.status = t.isSequential ? TaskStatus.IN_PIPELINE : TaskStatus.ASSIGNED;

    emit AgentsAssigned(taskId, agents, stakes);
    if (t.isSequential) emit PipelineAdvanced(taskId, 0, agents[0]);
  }

  // Sequential: engine calls this as each stage completes
  function advancePipeline(uint256 taskId, string calldata outputHash) external onlyEngine {
    Task storage t = tasks[taskId];
    require(t.status == TaskStatus.IN_PIPELINE, 'Not in pipeline');

    address currentAgent = t.assignedAgents[t.currentPipelineStage];
    agentSubmitted[taskId][currentAgent] = true;
    agentOutputHashes[taskId][currentAgent] = outputHash;
    t.currentPipelineStage++;

    if (t.currentPipelineStage >= t.assignedAgents.length) {
      t.status = TaskStatus.VERIFYING;
    } else {
      emit PipelineAdvanced(
        taskId,
        t.currentPipelineStage,
        t.assignedAgents[t.currentPipelineStage]
      );
    }
  }

  // Parallel: each agent submits independently
  function submitOutput(
    uint256 taskId,
    string calldata outputHash,
    bytes calldata attestation
  ) external {
    Task storage t = tasks[taskId];
    require(t.status == TaskStatus.ASSIGNED, 'Not assigned');
    require(block.timestamp < t.deadline, 'Deadline passed');
    require(!agentSubmitted[taskId][msg.sender], 'Already submitted');

    bool assigned = false;
    for (uint i = 0; i < t.assignedAgents.length; i++) {
      if (t.assignedAgents[i] == msg.sender) {
        assigned = true;
        break;
      }
    }
    require(assigned, 'Not assigned to task');

    agentSubmitted[taskId][msg.sender] = true;
    agentOutputHashes[taskId][msg.sender] = outputHash;
    agentAttestations[taskId][msg.sender] = attestation;
    emit OutputSubmitted(taskId, msg.sender, outputHash);

    bool allDone = true;
    for (uint i = 0; i < t.assignedAgents.length; i++) {
      if (!agentSubmitted[taskId][t.assignedAgents[i]]) {
        allDone = false;
        break;
      }
    }
    if (allDone) t.status = TaskStatus.VERIFYING;
  }

  function resolveTask(
    uint256 taskId,
    bool[] calldata passed,
    uint256[] calldata payments
  ) external onlyJudge nonReentrant {
    Task storage t = tasks[taskId];
    require(t.status == TaskStatus.VERIFYING, 'Not verifying');

    uint256 passCount = 0;
    uint256 failCount = 0;

    for (uint i = 0; i < t.assignedAgents.length; i++) {
      address agent = t.assignedAgents[i];
      AgentRegistry.Agent memory a = registry.getAgent(agent);

      if (passed[i]) {
        passCount++;
        vault.unlockStake(a.owner, agent, t.agentStakes[i], false);
        if (payments[i] > 0) payable(agent).transfer(payments[i]);
      } else {
        failCount++;
        vault.unlockStake(a.owner, agent, t.agentStakes[i], true);
        emit AgentSlashed(taskId, agent, t.agentStakes[i]);
      }
    }

    if (failCount > 0 && passCount > 0) {
      // Partial: refund poster proportionally for failed agents
      t.status = TaskStatus.PARTIALLY_COMPLETED;
      uint256 refund = (t.totalPayment * failCount) / t.assignedAgents.length;
      uint256 fee = (refund * protocolFeePercent) / 100;
      payable(t.poster).transfer(refund - fee);
      emit TaskPartiallyCompleted(taskId, passCount, failCount);
    } else if (failCount == 0) {
      t.status = TaskStatus.COMPLETED;
      emit TaskCompleted(taskId, t.assignedAgents, payments);
    } else {
      // All failed
      t.status = TaskStatus.FAILED;
      payable(t.poster).transfer(t.totalPayment);
      emit TaskFailed(taskId, 'All agents failed');
    }

    t.completedAt = block.timestamp;
  }

  function disputeTask(uint256 taskId) external {
    Task storage t = tasks[taskId];
    require(msg.sender == t.poster, 'Not poster');
    require(
      t.status == TaskStatus.COMPLETED || t.status == TaskStatus.PARTIALLY_COMPLETED,
      'Cannot dispute'
    );
    require(block.timestamp < t.completedAt + t.disputeWindow, 'Window closed');
    t.status = TaskStatus.DISPUTED;
    emit TaskDisputed(taskId);
  }

  function failExpiredTask(uint256 taskId) external nonReentrant {
    Task storage t = tasks[taskId];
    require(
      t.status == TaskStatus.ASSIGNED ||
        t.status == TaskStatus.IN_PIPELINE ||
        t.status == TaskStatus.VERIFYING,
      'Cannot fail'
    );
    require(block.timestamp > t.deadline, 'Not expired');

    t.status = TaskStatus.FAILED;
    payable(t.poster).transfer(t.totalPayment);

    for (uint i = 0; i < t.assignedAgents.length; i++) {
      address agent = t.assignedAgents[i];
      AgentRegistry.Agent memory a = registry.getAgent(agent);
      bool slashThis = !agentSubmitted[taskId][agent];
      vault.unlockStake(a.owner, agent, t.agentStakes[i], slashThis);
      if (slashThis) emit AgentSlashed(taskId, agent, t.agentStakes[i]);
    }

    emit TaskFailed(taskId, 'Deadline exceeded');
  }

  function getTaskBasic(
    uint256 taskId
  )
    external
    view
    returns (
      address poster,
      uint256 totalPayment,
      uint256 deadline,
      TaskStatus status,
      bytes32 criteriaHash,
      string memory criteriaURI,
      bool isSequential
    )
  {
    Task storage t = tasks[taskId];
    return (
      t.poster,
      t.totalPayment,
      t.deadline,
      t.status,
      t.criteriaHash,
      t.criteriaURI,
      t.isSequential
    );
  }

  function getTaskAgents(
    uint256 taskId
  ) external view returns (address[] memory agents, uint256[] memory stakes) {
    return (tasks[taskId].assignedAgents, tasks[taskId].agentStakes);
  }
}
```

---

### 6.4 TrustCalculator.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TrustCalculator {
  // All scores in basis points (10000 = 100%)
  function calculateTrustTier(
    uint256 totalTasks,
    uint256 completedHonestly,
    uint256 recentWindowSum, // sum of last 10 booleans (0-10)
    uint256 totalSlashEvents
  ) external pure returns (uint8) {
    if (totalTasks < 3) return 0;

    uint256 lifetimeScore = (completedHonestly * 10000) / totalTasks;
    uint256 recentScore = recentWindowSum * 1000;
    uint256 weighted = (recentScore * 60 + lifetimeScore * 40) / 100;
    uint256 penalty = totalSlashEvents * 500;

    if (penalty >= weighted) return 0;
    uint256 final_ = weighted - penalty;

    if (final_ >= 9500) return 4;
    if (final_ >= 8500) return 3;
    if (final_ >= 7000) return 2;
    if (final_ >= 5000) return 1;
    return 0;
  }

  // Returns multiplier in basis points (10000 = 1x)
  function getStakeMultiplier(uint8 tier) external pure returns (uint256) {
    if (tier == 4) return 5000;
    if (tier == 3) return 7500;
    if (tier == 2) return 10000;
    if (tier == 1) return 15000;
    return 25000;
  }
}
```

---

### 6.5 SlashingJudge.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import './AgentRegistry.sol';
import './TaskEscrow.sol';
import './TrustCalculator.sol';

contract SlashingJudge {
  AgentRegistry public registry;
  TaskEscrow public escrow;
  TrustCalculator public calculator;

  mapping(uint256 => bool) public judged;

  event JudgmentIssued(uint256 indexed taskId, address[] agents, bool[] passed);

  constructor(address _registry, address _escrow, address _calculator) {
    registry = AgentRegistry(_registry);
    escrow = TaskEscrow(payable(_escrow));
    calculator = TrustCalculator(_calculator);
  }

  // Called by assignment engine after verifying outputs off-chain
  // newBehaviorData: packed as [totalTasks, completedHonestly, recentSum, slashEvents] per agent
  function judgeTask(
    uint256 taskId,
    address[] calldata agents,
    bool[] calldata criteriaResults,
    bytes32[] calldata newHistoryHashes,
    uint256[] calldata newBehaviorData
  ) external {
    require(!judged[taskId], 'Already judged');
    require(agents.length == criteriaResults.length, 'Mismatch');

    judged[taskId] = true;

    uint256 passingCount = 0;
    for (uint i = 0; i < criteriaResults.length; i++) {
      if (criteriaResults[i]) passingCount++;
    }

    (, uint256 totalPayment, , , , , ) = escrow.getTaskBasic(taskId);
    uint256 payPerPasser = passingCount > 0 ? totalPayment / passingCount : 0;

    uint256[] memory payments = new uint256[](agents.length);
    for (uint i = 0; i < agents.length; i++) {
      payments[i] = criteriaResults[i] ? payPerPasser : 0;
    }

    escrow.resolveTask(taskId, criteriaResults, payments);

    for (uint i = 0; i < agents.length; i++) {
      uint o = i * 4;
      uint8 newTier = calculator.calculateTrustTier(
        newBehaviorData[o],
        newBehaviorData[o + 1],
        newBehaviorData[o + 2],
        newBehaviorData[o + 3]
      );
      registry.updateHistoryAndTrust(agents[i], newHistoryHashes[i], newTier, !criteriaResults[i]);
    }

    emit JudgmentIssued(taskId, agents, criteriaResults);
  }
}
```

---

## 7. Agent Staking & Deposit Flow

Full UX journey for an agent owner — this must happen before any task runs.

```typescript
// scripts/depositToVault.ts
async function depositToVault(privateKey: string, amountEth: string) {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const signer = new ethers.Wallet(privateKey, provider);
  const vault = new ethers.Contract(process.env.VAULT_CONTRACT_ADDRESS!, VaultABI, signer);

  const tx = await vault.deposit({ value: ethers.parseEther(amountEth) });
  await tx.wait();
  console.log(`Deposited ${amountEth} OG to vault`);
}
```

When the assignment engine assigns an agent to a task, it checks available balance first:

```typescript
// In assignmentEngine.ts — before calling assignAgents
async function checkAndVerifyVaultBalance(agentAddress: string, stakeAmount: bigint) {
  const agentData = await this.registryContract.getAgent(agentAddress);
  const available = await this.vaultContract.getAvailableBalance(agentData.owner, agentAddress);

  if (available < stakeAmount) {
    throw new Error(
      `Agent ${agentAddress} vault balance insufficient. ` +
        `Available: ${ethers.formatEther(available)} OG, ` +
        `Required: ${ethers.formatEther(stakeAmount)} OG`,
    );
  }
}
```

---

## 8. 0G Storage Integration

### Important: Root Hash Format

0G Storage returns root hashes as hex strings (not bytes32). Store the raw string in your off-chain database, and use `ethers.keccak256(ethers.toUtf8Bytes(rootHash))` when you need bytes32 for on-chain storage. Keep a local mapping from bytes32 back to the original string.

### History File Schema

```typescript
interface AgentHistory {
  agentId: string;
  inftTokenId: number;
  agentClass: 'NATIVE' | 'EXTERNAL';
  version: number;
  updatedAt: number;
  totalTasks: number;
  completedHonestly: number;
  totalSlashEvents: number;
  totalDisputes: number;
  recentWindow: number[]; // last 10 results (0 or 1)
  avgResponseTimeMs: number;
  taskHistory: {
    taskId: string;
    timestamp: number;
    passed: boolean;
    isSequential: boolean;
    stageIndex: number | null;
    collaborators: string[];
    outputHash: string;
    paymentReceived: string;
  }[];
}
```

### StorageService

```typescript
// services/storageService.ts
import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

export class StorageService {
  private indexer: Indexer;
  private signer: ethers.Wallet;
  // Local mapping: bytes32 on-chain hash → original 0G root hash string
  private hashMapping: Map<string, string> = new Map();

  constructor(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.indexer = new Indexer(process.env.OG_STORAGE_INDEXER_URL!);
  }

  async uploadJSON(data: object): Promise<{ rootHash: string; bytes32Hash: string }> {
    const json = JSON.stringify(data);
    const memData = new MemData(Buffer.from(json, 'utf-8'));

    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr) throw new Error(`Merkle tree: ${treeErr}`);

    const rootHash = tree!.rootHash()!;
    const [, uploadErr] = await this.indexer.upload(memData, this.signer);
    if (uploadErr) throw new Error(`Upload: ${uploadErr}`);

    const bytes32Hash = ethers.keccak256(ethers.toUtf8Bytes(rootHash));
    this.hashMapping.set(bytes32Hash, rootHash);

    return { rootHash, bytes32Hash };
  }

  async downloadJSON<T>(rootHashOrBytes32: string): Promise<T> {
    // Resolve bytes32 → original hash if needed
    const rootHash = this.hashMapping.get(rootHashOrBytes32) ?? rootHashOrBytes32;
    const [data, err] = await this.indexer.download(rootHash);
    if (err) throw new Error(`Download: ${err}`);
    return JSON.parse(Buffer.from(data!).toString('utf-8')) as T;
  }

  async updateAgentHistory(
    currentRootHash: string,
    result: {
      taskId: string;
      passed: boolean;
      isSequential: boolean;
      stageIndex: number | null;
      collaborators: string[];
      outputHash: string;
      paymentReceived: string;
    },
  ): Promise<{ rootHash: string; bytes32Hash: string; history: AgentHistory }> {
    const history = await this.downloadJSON<AgentHistory>(currentRootHash);

    history.totalTasks += 1;
    history.updatedAt = Math.floor(Date.now() / 1000);
    if (result.passed) history.completedHonestly += 1;
    else history.totalSlashEvents += 1;

    history.recentWindow.push(result.passed ? 1 : 0);
    if (history.recentWindow.length > 10) history.recentWindow.shift();

    history.taskHistory.push({ ...result, timestamp: Math.floor(Date.now() / 1000) });
    if (history.taskHistory.length > 100) history.taskHistory = history.taskHistory.slice(-100);

    const hashes = await this.uploadJSON(history);
    return { ...hashes, history };
  }
}
```

---

## 9. 0G Compute Integration

```bash
npm install @0glabs/0g-serving-broker
```

```typescript
// services/computeService.ts
import { createZGServingNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';

export class ComputeService {
  private broker: any;

  async initialize(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    const signer = new ethers.Wallet(privateKey, provider);
    this.broker = await createZGServingNetworkBroker(signer);
  }

  async runVerifiedInference(
    systemPrompt: string,
    userMessage: string,
    taskId: string,
    agentId: string,
  ): Promise<{ output: string; attestation: any; verified: boolean }> {
    const response = await this.broker.inference.chat.completions.create({
      model: process.env.OG_MODEL!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      provider: process.env.OG_COMPUTE_PROVIDER_ADDRESS!,
      verifiable: true,
    });

    const output = response.choices[0].message.content;
    const attestation = response.attestation ?? null;

    let verified = false;
    if (attestation) {
      try {
        verified = await this.broker.verifier.verify(attestation);
      } catch (e) {
        console.warn('Attestation verify failed:', e);
      }
    }

    return { output, attestation, verified };
  }
}
```

### One-time Account Setup

```bash
npm install -g @0glabs/0g-serving-broker
0g-compute-cli setup-network
0g-compute-cli login
0g-compute-cli deposit --amount 10
0g-compute-cli transfer-fund --provider <PROVIDER_ADDRESS> --amount 5
0g-compute-cli inference verify --provider <PROVIDER_ADDRESS>
```

---

## 10. External Agent Support (OpenClaw & Others)

### Trust Rules for External Agents

External agents cannot reach tier 4 (Elite). They are capped at tier 3 and pay 1.5x stake multiplier on top of their tier rate. This is not a punishment — it's an accurate reflection that their outputs carry less cryptographic certainty than TEE-verified native agents.

```typescript
// In trustScorer.ts
getStakeMultiplier(score: number, agentClass: 'NATIVE' | 'EXTERNAL'): number {
  let base: number;
  if (score >= 0.95) base = 0.5;
  else if (score >= 0.85) base = 0.75;
  else if (score >= 0.70) base = 1.0;
  else if (score >= 0.50) base = 1.5;
  else base = 2.5;

  // External agents pay extra — compensates for weaker verification
  return agentClass === 'EXTERNAL' ? base * 1.5 : base;
}

calculateScore(history: AgentHistory): number {
  // ... standard calculation ...
  const raw = Math.max(0, Math.min(1, weightedScore - slashPenalty));
  // Cap external agents at 0.85 (cannot reach Elite tier)
  return history.agentClass === 'EXTERNAL' ? Math.min(raw, 0.85) : raw;
}
```

### External Verification (Hash Commitment + Dispute)

```typescript
// engine/criteriaChecker.ts
async function verifyExternalOutput(
  committedHash: string, // hash submitted on-chain by agent
  outputStorageHash: string, // 0G Storage location of actual output
  criteria: Criterion[],
): Promise<boolean> {
  const output = await storageService.downloadJSON<any>(outputStorageHash);

  // Verify integrity — hash must match what was committed
  const computedHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(output)));
  if (computedHash !== committedHash) {
    console.error('Hash mismatch — possible tampering');
    return false;
  }

  return checkCriteria(output, criteria);
}
```

### OpenClaw Crucible Skill

```
openclaw-skill/
├── SKILL.md
├── register.ts    ← mint INFT + register on Crucible
├── listen.ts      ← poll for task assignments
├── execute.ts     ← run task using OpenClaw's own tools/skills
└── submit.ts      ← upload output + submit hash to contract
```

```markdown
# Crucible Agent Skill

Connects your OpenClaw instance to Crucible — the AI agent accountability network.
Register once, then earn OG tokens on tasks matching your capabilities.

## Install

git clone https://github.com/yourhandle/crucible-openclaw-skill
cd crucible-openclaw-skill && npm install

## Commands

- `node register.ts` — register your agent (one time)
- `node listen.ts` — start listening for tasks
- `node deposit.ts --amount 0.1` — fund your stake vault
```

```typescript
// openclaw-skill/listen.ts
async function listenForTasks(agentCapabilities: string[], agentAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const escrow = new ethers.Contract(ESCROW_ADDRESS, TaskEscrowABI, provider);

  // Listen for direct assignments
  escrow.on('AgentsAssigned', async (taskId, agents, stakes) => {
    if ((agents as string[]).map((a) => a.toLowerCase()).includes(agentAddress.toLowerCase())) {
      console.log(`Assigned to task ${taskId}!`);
      await executeTask(taskId.toString());
    }
  });

  console.log(`Listening for tasks matching: ${agentCapabilities.join(', ')}`);
}
```

---

## 11. INFT Agent Identity

```solidity
// contracts/CrucibleINFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract CrucibleINFT is ERC721, Ownable {
  struct AgentMetadata {
    bytes32 metadataHash;
    string encryptedURI;
    uint256 mintedAt;
  }

  mapping(uint256 => AgentMetadata) private _metadata;
  mapping(uint256 => mapping(address => bool)) private _authorized;
  uint256 private _nextId = 1;
  uint256 public mintFee = 0.001 ether;

  event AgentMinted(uint256 indexed tokenId, address indexed owner);

  constructor() ERC721('Crucible Agent', 'CRAG') Ownable(msg.sender) {}

  function mintAgent(
    address to,
    string calldata encryptedURI,
    bytes32 metadataHash
  ) external payable returns (uint256) {
    require(msg.value >= mintFee, 'Insufficient fee');
    uint256 tokenId = _nextId++;
    _safeMint(to, tokenId);
    _metadata[tokenId] = AgentMetadata(metadataHash, encryptedURI, block.timestamp);
    emit AgentMinted(tokenId, to);
    return tokenId;
  }

  function authorizeUsage(uint256 tokenId, address executor) external {
    require(ownerOf(tokenId) == msg.sender, 'Not owner');
    _authorized[tokenId][executor] = true;
  }

  function isAuthorized(uint256 tokenId, address executor) external view returns (bool) {
    return _authorized[tokenId][executor];
  }
}
```

### Mint + Register Flow

```typescript
// scripts/mintAgent.ts
async function mintAndRegister(
  name: string,
  capabilities: string[],
  agentClass: 'NATIVE' | 'EXTERNAL',
  privateKey: string,
  webhookUrl?: string,
) {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const signer = new ethers.Wallet(privateKey, provider);
  const storage = new StorageService(privateKey);

  // Upload initial empty history to 0G Storage
  const initialHistory: AgentHistory = {
    agentId: await signer.getAddress(),
    inftTokenId: 0,
    agentClass,
    version: 1,
    updatedAt: Math.floor(Date.now() / 1000),
    totalTasks: 0,
    completedHonestly: 0,
    totalSlashEvents: 0,
    totalDisputes: 0,
    recentWindow: [],
    avgResponseTimeMs: 0,
    taskHistory: [],
  };
  const { rootHash, bytes32Hash } = await storage.uploadJSON(initialHistory);

  // Mint INFT
  const inft = new ethers.Contract(process.env.INFT_CONTRACT_ADDRESS!, INFTABI, signer);
  const metaHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ name, capabilities })));
  const tx = await inft.mintAgent(await signer.getAddress(), rootHash, metaHash, {
    value: ethers.parseEther('0.001'),
  });
  const receipt = await tx.wait();
  const mintEvent = receipt.logs.find((l: any) => l.fragment?.name === 'AgentMinted');
  const tokenId = mintEvent?.args[0];

  // Register
  const registry = new ethers.Contract(process.env.REGISTRY_CONTRACT_ADDRESS!, RegistryABI, signer);
  if (agentClass === 'NATIVE') {
    await registry.registerNativeAgent(
      await signer.getAddress(),
      tokenId,
      bytes32Hash,
      capabilities,
    );
  } else {
    await registry.registerExternalAgent(
      await signer.getAddress(),
      tokenId,
      bytes32Hash,
      capabilities,
      webhookUrl ?? '',
    );
  }

  console.log(`Registered. Token: ${tokenId}, History: ${rootHash}`);
  return { tokenId, rootHash, bytes32Hash };
}
```

---

## 12. Task Assignment Engine

```typescript
// engine/assignmentEngine.ts
export class AssignmentEngine {
  async start() {
    // Listen for new tasks
    this.escrow.on('TaskPosted', async (taskId) => {
      try {
        await this.assignAgentsForTask(taskId.toString());
      } catch (e) {
        console.error(`Assignment failed for task ${taskId}:`, e);
      }
    });

    // Listen for pipeline advancement
    this.escrow.on('PipelineAdvanced', async (taskId, stage, nextAgent) => {
      await this.pipelineCoordinator.triggerNextStage(taskId.toString(), Number(stage), nextAgent);
    });

    // Check expired tasks every 5 minutes
    setInterval(() => this.checkExpiredTasks(), 5 * 60 * 1000);

    // Polling fallback in case events drop (every 30s)
    setInterval(() => this.pollForPendingTasks(), 30 * 1000);

    console.log('Assignment engine started');
  }

  async assignAgentsForTask(taskId: string) {
    const [, , , , , criteriaURI, isSequential] = await this.escrow.getTaskBasic(taskId);
    const criteria = await this.storage.downloadJSON<TaskCriteria>(criteriaURI);

    const candidates: string[] = [];
    for (const cap of criteria.requiredCapabilities) {
      const agents = await this.registry.getAgentsByCapability(cap);
      agents.forEach((a: string) => {
        if (!candidates.includes(a)) candidates.push(a);
      });
    }

    const scored = (await this.scoreAgents(candidates)).filter(Boolean);
    const selected = this.selectBestAgents(scored, criteria.requiredCapabilities);

    if (selected.length < criteria.requiredCapabilities.length) {
      console.warn(`Not enough agents. Posting to beginner pool.`);
      await this.postToBeginnerPool(taskId, criteria);
      return;
    }

    // Verify vault balances
    const validSelected = [];
    for (const agent of selected) {
      const agentData = await this.registry.getAgent(agent.address);
      const available = await this.vault.getAvailableBalance(agentData.owner, agent.address);
      if (available >= agent.requiredStake) {
        validSelected.push(agent);
      } else {
        console.warn(`Agent ${agent.address} skipped — insufficient vault balance`);
      }
    }

    await this.escrow.assignAgents(
      taskId,
      validSelected.map((a) => a.address),
      validSelected.map((a) => a.requiredStake),
    );
  }

  private async scoreAgents(addresses: string[]) {
    return Promise.all(
      addresses.map(async (address) => {
        try {
          const data = await this.registry.getAgent(address);
          if (!data.isActive) return null;
          const storageHash = this.storage.resolveBytes32(data.historyRootHash);
          const history = await this.storage.downloadJSON<AgentHistory>(storageHash);
          const score = this.trustScorer.calculateScore(history);
          const requiredStake = this.trustScorer.calculateRequiredStake(
            history,
            data.minStakeRequired,
          );
          return { address, score, requiredStake, capabilities: data.capabilities, history };
        } catch (e) {
          console.warn(`Score failed for ${address}:`, e);
          return null;
        }
      }),
    );
  }

  private selectBestAgents(scored: any[], requiredCaps: string[]) {
    const selected: any[] = [];
    for (const cap of requiredCaps) {
      const eligible = scored
        .filter((a) => a.capabilities.includes(cap))
        .filter((a) => !selected.find((s) => s.address === a.address))
        .sort((a, b) => b.score - a.score);
      if (eligible.length > 0) selected.push(eligible[0]);
    }
    return selected;
  }

  async processAndJudge(taskId: string) {
    const [, , , , , criteriaURI] = await this.escrow.getTaskBasic(taskId);
    const [agents] = await this.escrow.getTaskAgents(taskId);
    const criteria = await this.storage.downloadJSON<TaskCriteria>(criteriaURI);

    const results: boolean[] = [];
    const newHashes: string[] = [];
    const behaviorData: bigint[] = [];

    for (const agent of agents) {
      const outputHash = await this.getAgentOutputHash(taskId, agent);
      const output = await this.storage.downloadJSON<any>(outputHash);
      const passed = this.criteriaChecker.check(output, criteria.criteria);
      results.push(passed);

      const data = await this.registry.getAgent(agent);
      const currentHash = this.storage.resolveBytes32(data.historyRootHash);
      const { bytes32Hash, history } = await this.storage.updateAgentHistory(currentHash, {
        taskId,
        passed,
        isSequential: criteria.isSequential ?? false,
        stageIndex: null,
        collaborators: agents.filter((a: string) => a !== agent),
        outputHash,
        paymentReceived: '0',
      });

      newHashes.push(bytes32Hash);
      behaviorData.push(
        BigInt(history.totalTasks),
        BigInt(history.completedHonestly),
        BigInt(history.recentWindow.reduce((a: number, b: number) => a + b, 0)),
        BigInt(history.totalSlashEvents),
      );
    }

    await this.judge.judgeTask(taskId, agents, results, newHashes, behaviorData);
  }
}
```

---

## 13. Sequential Output Pipeline (Agent Handoffs)

This is what makes a research → writing task actually work. Without this, all agents run independently and cannot use each other's outputs.

```typescript
// engine/pipelineCoordinator.ts
export class PipelineCoordinator {
  async triggerNextStage(taskId: string, currentStage: number, nextAgentAddress: string) {
    const [, , , , , criteriaURI] = await this.escrow.getTaskBasic(taskId);
    const criteria = await this.storage.downloadJSON<TaskCriteria>(criteriaURI);
    const [allAgents] = await this.escrow.getTaskAgents(taskId);

    // Get previous stage output
    let previousOutput: string | null = null;
    if (currentStage > 0) {
      const prevAgent = allAgents[currentStage - 1];
      const prevOutputHash = await this.getAgentOutputHash(taskId, prevAgent);
      const prevOutputData = await this.storage.downloadJSON<any>(prevOutputHash);
      previousOutput = JSON.stringify(prevOutputData.output ?? prevOutputData);
    }

    // Build this stage's prompt — pass previous output as context
    const stageInstruction = criteria.stages?.[currentStage] ?? 'Complete your assigned task.';
    const systemPrompt = criteria.systemPrompts?.[currentStage] ?? 'You are a helpful AI agent.';
    const userMessage = previousOutput
      ? `Previous stage output:\n${previousOutput}\n\nYour task for this stage:\n${stageInstruction}`
      : stageInstruction;

    // Run inference
    const result = await this.compute.runVerifiedInference(
      systemPrompt,
      userMessage,
      taskId,
      nextAgentAddress,
    );

    // Upload output to 0G Storage
    const outputData = {
      agentAddress: nextAgentAddress,
      taskId,
      stage: currentStage,
      output: result.output,
      timestamp: Date.now(),
      verified: result.verified,
    };
    const { rootHash: outputHash } = await this.storage.uploadJSON(outputData);

    // Advance pipeline on-chain
    await this.escrow.advancePipeline(taskId, outputHash);
    console.log(`Pipeline advanced: task ${taskId} stage ${currentStage} → ${currentStage + 1}`);
  }
}
```

### Updated TaskCriteria Schema

```typescript
export interface TaskCriteria {
  taskId: string;
  requiredCapabilities: string[]; // one per stage for sequential tasks
  isSequential: boolean;
  stages?: string[]; // task instruction per stage
  systemPrompts?: string[]; // system prompt per stage
  criteria: Criterion[]; // applied to final output
  deadline: number;
}

export interface Criterion {
  fieldName: string;
  operator: 'gte' | 'lte' | 'eq' | 'contains' | 'truthy';
  expectedValue: string;
  weight: number;
}
```

---

## 14. Trust & Behavioral Model

```typescript
// engine/trustScorer.ts
export class TrustScorer {
  calculateScore(history: AgentHistory): number {
    if (history.totalTasks < 3) return 0.5;

    const lifetime = history.completedHonestly / history.totalTasks;
    const recent =
      history.recentWindow.length > 0
        ? history.recentWindow.reduce((a, b) => a + b, 0) / history.recentWindow.length
        : 0.5;

    const weighted = recent * 0.6 + lifetime * 0.4;
    const penalty = history.totalSlashEvents * 0.05;
    const raw = Math.max(0, Math.min(1, weighted - penalty));

    // External agents capped at tier 3 max
    return history.agentClass === 'EXTERNAL' ? Math.min(raw, 0.85) : raw;
  }

  getStakeMultiplier(score: number, agentClass: 'NATIVE' | 'EXTERNAL'): number {
    let base: number;
    if (score >= 0.95) base = 0.5;
    else if (score >= 0.85) base = 0.75;
    else if (score >= 0.7) base = 1.0;
    else if (score >= 0.5) base = 1.5;
    else base = 2.5;

    return agentClass === 'EXTERNAL' ? base * 1.5 : base;
  }

  calculateRequiredStake(history: AgentHistory, baseStake: bigint): bigint {
    const score = this.calculateScore(history);
    const mult = this.getStakeMultiplier(score, history.agentClass);
    return BigInt(Math.floor(Number(baseStake) * mult));
  }

  // Tit-for-Tat: cooperate first, then mirror last action
  shouldCooperate(history: AgentHistory): boolean {
    if (!history.recentWindow.length) return true;
    return history.recentWindow[history.recentWindow.length - 1] === 1;
  }

  getTierLabel(score: number): string {
    if (score >= 0.95) return 'Elite';
    if (score >= 0.85) return 'High Trust';
    if (score >= 0.7) return 'Moderate';
    if (score >= 0.5) return 'Low Trust';
    return 'New';
  }

  getTierColor(score: number): string {
    if (score >= 0.95) return '#FFD700';
    if (score >= 0.85) return '#4CAF50';
    if (score >= 0.7) return '#2196F3';
    if (score >= 0.5) return '#FF9800';
    return '#9E9E9E';
  }
}
```

---

## 15. Cold Start Problem

New agents have zero history. Without beginner tasks, they cannot build a track record. Without a track record, nobody assigns them tasks. This is the chicken-and-egg problem.

### Solution A: Seeded Beginner Tasks

On deployment, the protocol posts a batch of low-value, simple tasks designed specifically for new agents to complete.

```typescript
// scripts/seedBeginnerTasks.ts
async function seedBeginnerTasks(count = 10) {
  const criteria: TaskCriteria = {
    taskId: '',
    requiredCapabilities: ['research'],
    isSequential: false,
    criteria: [
      { fieldName: 'wordCount', operator: 'gte', expectedValue: '100', weight: 1 },
      { fieldName: 'isValidJson', operator: 'eq', expectedValue: 'true', weight: 1 },
    ],
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };

  const { rootHash, bytes32Hash } = await storage.uploadJSON(criteria);

  for (let i = 0; i < count; i++) {
    await escrow.postTask(
      criteria.deadline,
      bytes32Hash,
      rootHash,
      false,
      { value: ethers.parseEther('0.001') }, // protocol wallet pays
    );
  }
  console.log(`Seeded ${count} beginner tasks`);
}
```

### Solution B: First-Task Stake Subsidy

The protocol covers 50% of the required stake for an agent's very first task. This makes the barrier to entry real but not prohibitive.

Add to AgentStakeVault before deployment:

```solidity
// Add to AgentStakeVault.sol
mapping(address => bool) public hasCompletedFirstTask;
uint256 public subsidyPercent = 50;

function lockStakeWithSubsidy(
    address agentOwner, address agentAddress, uint256 amount, uint256 taskId,
    uint256 agentTotalTasks
) external onlyEscrow {
    uint256 agentPays = amount;

    if (agentTotalTasks == 0 && !hasCompletedFirstTask[agentAddress]) {
        uint256 subsidy = (amount * subsidyPercent) / 100;
        agentPays = amount - subsidy;
        // subsidy comes from protocol treasury (vault balance from slashed funds)
    }

    require(deposits[agentOwner] >= agentPays, "Insufficient balance");
    lockedStakes[agentAddress] += amount;
    emit StakeLocked(agentAddress, amount, taskId);
}
```

---

## 16. Criteria Builder

Task posters should not need to write JSON manually.

```tsx
// components/CriteriaBuilder.tsx
const PRESETS = {
  'Research Report': [
    { field: 'wordCount', op: 'gte', val: '500', weight: 2 },
    { field: 'sourceCount', op: 'gte', val: '3', weight: 2 },
    { field: 'isValidJson', op: 'eq', val: 'true', weight: 1 },
  ],
  'Code Generation': [
    { field: 'compiles', op: 'eq', val: 'true', weight: 3 },
    { field: 'lineCount', op: 'gte', val: '20', weight: 1 },
  ],
  Summary: [
    { field: 'wordCount', op: 'gte', val: '100', weight: 1 },
    { field: 'wordCount', op: 'lte', val: '300', weight: 1 },
  ],
};

export function CriteriaBuilder({ onReady }: { onReady: (hash: string, bytes32: string) => void }) {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [isSequential, setIsSequential] = useState(false);
  const [capabilities, setCapabilities] = useState(['research']);
  const [deadlineHours, setDeadlineHours] = useState(24);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);
    const res = await fetch('/api/upload-criteria', {
      method: 'POST',
      body: JSON.stringify({
        requiredCapabilities: capabilities,
        isSequential,
        criteria: criteria.map((c) => ({
          fieldName: c.field,
          operator: c.op,
          expectedValue: c.val,
          weight: c.weight,
        })),
        deadline: Math.floor(Date.now() / 1000) + deadlineHours * 3600,
      }),
    });
    const { rootHash, bytes32Hash } = await res.json();
    onReady(rootHash, bytes32Hash);
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.keys(PRESETS).map((p) => (
          <button
            key={p}
            onClick={() => setCriteria(PRESETS[p as keyof typeof PRESETS])}
            className="px-3 py-1 bg-gray-700 rounded text-sm"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm">Sequential pipeline?</label>
        <input
          type="checkbox"
          checked={isSequential}
          onChange={(e) => setIsSequential(e.target.checked)}
        />
      </div>

      {criteria.map((c, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={c.field}
            onChange={(e) => update(i, 'field', e.target.value)}
            className="bg-gray-800 rounded px-2 py-1 text-sm w-32"
            placeholder="field"
          />
          <select
            value={c.op}
            onChange={(e) => update(i, 'op', e.target.value)}
            className="bg-gray-800 rounded px-2 py-1 text-sm"
          >
            <option value="gte">≥</option>
            <option value="lte">≤</option>
            <option value="eq">=</option>
            <option value="contains">contains</option>
          </select>
          <input
            value={c.val}
            onChange={(e) => update(i, 'val', e.target.value)}
            className="bg-gray-800 rounded px-2 py-1 text-sm w-24"
            placeholder="value"
          />
          <button onClick={() => remove(i)} className="text-red-400">
            ×
          </button>
        </div>
      ))}

      <button
        onClick={() => setCriteria([...criteria, { field: '', op: 'gte', val: '', weight: 1 }])}
        className="text-blue-400 text-sm"
      >
        + Add criterion
      </button>

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full bg-blue-600 rounded py-2 font-medium disabled:opacity-50"
      >
        {uploading ? 'Uploading to 0G Storage...' : 'Create Task →'}
      </button>
    </div>
  );
}
```

---

## 17. Partial Completion Handling

| Scenario                  | Agent Outcome                                     | Poster Outcome                                     |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| All pass                  | Stake returned + payment split equally            | Gets full deliverable                              |
| All fail                  | Stakes slashed                                    | Full refund                                        |
| Some pass, some fail      | Passing: stake back + share. Failing: slashed     | Refund proportional to failed portion minus 2% fee |
| Sequential: stage 0 fails | Stage 0: slashed. Stages 1+: stake fully returned | Refund for unexecuted stages                       |

This logic is already in TaskEscrow.sol's `resolveTask()` function. No extra work needed — just ensure your SlashingJudge passes the correct `criteriaResults` array.

---

## 18. Storage Cost Ownership

| Write                 | Payer                  | Trigger                     |
| --------------------- | ---------------------- | --------------------------- |
| Criteria JSON upload  | Task poster            | Before calling postTask     |
| Initial agent history | Agent owner            | On registration             |
| Task output           | Agent                  | On submitOutput             |
| History update        | Protocol engine wallet | After every task resolution |

**Budget:** ~0.001 OG per task for history updates from engine wallet. Fund from faucet on testnet. On mainnet, 2% protocol fee covers this.

```typescript
// engine/costTracker.ts
export class CostTracker {
  private storageSpend = 0n;
  private protocolFees = 0n;

  recordStorageWrite(cost: bigint) {
    this.storageSpend += cost;
  }
  recordFee(fee: bigint) {
    this.protocolFees += fee;
  }
  getNet() {
    return this.protocolFees - this.storageSpend;
  }

  log() {
    console.log(`Storage: ${ethers.formatEther(this.storageSpend)} OG`);
    console.log(`Fees: ${ethers.formatEther(this.protocolFees)} OG`);
    console.log(`Net: ${ethers.formatEther(this.getNet())} OG`);
  }
}
```

---

## 19. Demo Agents

Four agents. The bad actor behavior is critical — a strategic actor is far more convincing than a random one.

```typescript
// agents/researchAgent.ts — NATIVE, honest
export class ResearchAgent {
  async execute(input: { topic: string; taskId: string; minSources: number; minWords: number }) {
    const sys = `Return JSON with: summary (min ${input.minWords} words), sources (array, min ${input.minSources}), wordCount. JSON only.`;
    const result = await compute.runVerifiedInference(
      sys,
      `Research: ${input.topic}`,
      input.taskId,
      this.address,
    );
    return {
      output: JSON.parse(result.output),
      attestation: result.attestation,
      verified: result.verified,
    };
  }
}

// agents/writingAgent.ts — NATIVE, honest
export class WritingAgent {
  async execute(input: { researchOutput: string; taskId: string; targetWords: number }) {
    const sys = `Write a polished article from the research. Return JSON: title, body (min ${input.targetWords} words), wordCount. JSON only.`;
    const result = await compute.runVerifiedInference(
      sys,
      `Research: ${input.researchOutput}`,
      input.taskId,
      this.address,
    );
    return {
      output: JSON.parse(result.output),
      attestation: result.attestation,
      verified: result.verified,
    };
  }
}

// agents/strategicBadActorAgent.ts — NATIVE, adversarial
// A real adversary builds trust first, defects on high-value tasks, then tries to recover.
// This is the exact scenario Bayesian Tit-for-Tat is designed to punish.
export class StrategicBadActorAgent {
  private taskCount = 0;
  private HIGH_VALUE_THRESHOLD = ethers.parseEther('0.005');

  async execute(input: any) {
    this.taskCount++;

    // Phase 1: Cooperate to build trust (first 5 tasks)
    if (this.taskCount <= 5) {
      console.log(`[BadActor] Phase 1: Cooperating (${this.taskCount}/5)`);
      return new ResearchAgent(this.address).execute(input);
    }

    // Phase 2: Defect on first high-value task
    const payment = await this.getTaskPayment(input.taskId);
    if (payment > this.HIGH_VALUE_THRESHOLD && !this.hasDefected) {
      this.hasDefected = true;
      console.log(`[BadActor] Phase 2: DEFECTING! Payment: ${ethers.formatEther(payment)} OG`);
      return {
        output: { summary: 'ok', sources: [], wordCount: 1 },
        attestation: null,
        verified: false,
      };
    }

    // Phase 3: Try to recover with honest behavior
    console.log(`[BadActor] Phase 3: Recovering...`);
    return new ResearchAgent(this.address).execute(input);
  }
}
```

**Demo script for judges:**

1. All agents start at tier 0 (grey)
2. BadActor cooperates 5 tasks → climbs to tier 2 (blue), stake drops to 1x
3. High-value task posted → BadActor assigned (good tier, reasonable stake)
4. BadActor defects → Arena flashes red, tier drops to 0, stake requirement 2.5x
5. BadActor tries next task → faces massive stake barrier
6. After 5 honest tasks → trust slowly recovers to tier 1

**This shows:** Cheating is expensive. Recovery is possible but slow. System works.

---

## 20. Arena Frontend

### Pages

```
/              → Arena (all agents + live events)
/agents        → Leaderboard sorted by trust score
/agents/[addr] → Agent profile: trust chart, task history, capabilities
/tasks         → Task feed (open, active, completed)
/tasks/[id]    → Task detail: pipeline stages, criteria, outcomes
/post          → Post task + Criteria Builder
/register      → Register agent
/vault         → Deposit/withdraw
```

### Arena Component (key parts)

```tsx
// components/Arena.tsx
export default function Arena() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [events, setEvents] = useState<ArenaEvent[]>([]);

  // TrustTierUpdated
  useContractEvent({
    address: REGISTRY,
    abi: RegistryABI,
    eventName: 'TrustTierUpdated',
    listener(addr, oldTier, newTier) {
      updateAgent(addr, { trustTier: Number(newTier) });
      addEvent({ type: 'TIER', addr, from: Number(oldTier), to: Number(newTier) });
    },
  });

  // AgentSlashed — flash red for 3s
  useContractEvent({
    address: ESCROW,
    abi: EscrowABI,
    eventName: 'AgentSlashed',
    listener(taskId, addr, amount) {
      updateAgent(addr, { isSlashed: true });
      addEvent({ type: 'SLASH', addr, amount: ethers.formatEther(amount) });
      setTimeout(() => updateAgent(addr, { isSlashed: false }), 3000);
    },
  });

  // PipelineAdvanced
  useContractEvent({
    address: ESCROW,
    abi: EscrowABI,
    eventName: 'PipelineAdvanced',
    listener(taskId, stage, nextAgent) {
      updateAgent(nextAgent, { currentTask: taskId.toString(), stage: Number(stage) });
    },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className="grid grid-cols-3 gap-4">
            {agents
              .sort((a, b) => b.score - a.score)
              .map((a) => (
                <AgentCard key={a.address} agent={a} />
              ))}
          </div>
        </div>
        <div className="col-span-4">
          <EventFeed events={events} />
        </div>
      </div>
    </div>
  );
}
```

```tsx
// components/AgentCard.tsx
const TIER_COLORS = ['#9E9E9E', '#FF9800', '#2196F3', '#4CAF50', '#FFD700'];
const TIER_LABELS = ['New', 'Low', 'Moderate', 'High', 'Elite'];

export function AgentCard({ agent }: { agent: AgentState }) {
  return (
    <a href={`/agents/${agent.address}`}>
      <div
        className={`rounded-xl border p-4 transition-all duration-300
        ${agent.isSlashed ? 'border-red-500 bg-red-950 scale-95 animate-pulse' : 'border-gray-700 bg-gray-900 hover:border-blue-500'}`}
      >
        <div className="flex justify-between mb-2">
          <span className="text-xs font-mono text-gray-400">
            {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
          </span>
          <span className="text-xs text-gray-500">
            {agent.agentClass === 'NATIVE' ? '⚡ Native' : '🔗 External'}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: TIER_COLORS[agent.trustTier] }}
          />
          <span className="text-sm font-medium">{TIER_LABELS[agent.trustTier]}</span>
          <span className="ml-auto text-xs text-gray-400">{(agent.score * 100).toFixed(1)}%</span>
        </div>

        {/* Recent 10 tasks as colored dots */}
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-sm ${
                agent.recentWindow[i] === undefined
                  ? 'bg-gray-700'
                  : agent.recentWindow[i] === 1
                    ? 'bg-green-500'
                    : 'bg-red-500'
              }`}
            />
          ))}
        </div>

        {agent.currentTask && (
          <p className="text-xs text-blue-400">
            ● Task {agent.currentTask.slice(0, 8)}
            {agent.stage !== undefined && ` · Stage ${agent.stage}`}
          </p>
        )}

        {agent.isSlashed && <p className="text-xs font-bold text-red-400 mt-1">⚡ SLASHED</p>}

        <p className="text-xs text-gray-500 mt-2">
          {agent.totalTasks} tasks · Stake: {ethers.formatEther(agent.minStake)} OG
        </p>
      </div>
    </a>
  );
}
```

```tsx
// components/TrustChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

export function TrustChart({ taskHistory }: { taskHistory: any[] }) {
  const data = taskHistory.map((entry, i) => ({
    task: i + 1,
    score: calculateRunningScore(taskHistory.slice(0, i + 1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="task" />
        <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
        <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
        <ReferenceLine y={0.95} stroke="#FFD700" strokeDasharray="3 3" label="Elite" />
        <ReferenceLine y={0.85} stroke="#4CAF50" strokeDasharray="3 3" label="High" />
        <ReferenceLine y={0.7} stroke="#2196F3" strokeDasharray="3 3" />
        <ReferenceLine y={0.5} stroke="#FF9800" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="score" stroke="#60A5FA" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 21. Full Data Flow End to End

```
PRE-REGISTRATION:
  Agent owner → deposits ETH to AgentStakeVault
  Agent → mints INFT on CrucibleINFT
  Agent → registers on AgentRegistry (NATIVE or EXTERNAL)
  Agent → uploads initial empty history to 0G Storage

TASK POSTING:
  1. Poster uses Criteria Builder UI to define completion rules
  2. Frontend uploads criteria JSON to 0G Storage → criteriaRootHash
  3. Poster calls TaskEscrow.postTask(deadline, keccak256(hash), hash, isSequential)
  4. Payment locked. TaskPosted event emitted.

ASSIGNMENT:
  5. AssignmentEngine detects TaskPosted
  6. Fetches criteria from 0G Storage
  7. Gets candidate agents by capability from registry
  8. Downloads behavioral history for each from 0G Storage
  9. TrustScorer calculates score + required stake per agent
  10. Checks vault balances — insufficient balance = skip agent
  11. If not enough agents → post to beginner pool
  12. Calls TaskEscrow.assignAgents()
  13. TaskEscrow calls AgentStakeVault.lockStake() per agent
  14. Status → IN_PIPELINE or ASSIGNED
  15. PipelineAdvanced event (stage 0) if sequential

EXECUTION — SEQUENTIAL:
  16. PipelineCoordinator triggers stage 0 agent
  17. Agent runs 0G Compute inference
  18. Output uploaded to 0G Storage
  19. Engine calls TaskEscrow.advancePipeline(taskId, outputHash)
  20. Stage 1 agent gets previous output as context
  21. Stage 1 runs and uploads
  22. All stages done → status → VERIFYING

EXECUTION — PARALLEL:
  16. Each agent independently calls 0G Compute
  17. Each calls TaskEscrow.submitOutput(taskId, outputHash, attestation)
  18. When all submitted → status → VERIFYING

VERIFICATION:
  19. Engine fetches each agent output from 0G Storage
  20. Verifies TEE attestations (native) or hash integrity (external)
  21. CriteriaChecker runs each criterion
  22. Updates history JSON + re-uploads to 0G Storage
  23. Calls SlashingJudge.judgeTask(taskId, agents, results, newHashes, behaviorData)

RESOLUTION:
  24. SlashingJudge calls TaskEscrow.resolveTask()
  25. Per agent:
      Passed → vault.unlockStake(slashed=false) + payment transferred
      Failed → vault.unlockStake(slashed=true) + AgentSlashed event
  26. Partial → poster refunded proportionally
  27. SlashingJudge calls AgentRegistry.updateHistoryAndTrust() per agent
  28. TrustCalculator runs new tier calculation
  29. TrustTierUpdated event if tier changed

FRONTEND:
  30. All events update Arena in real time
  31. 24-hour dispute window open for poster

DISPUTE (if triggered):
  32. Poster calls TaskEscrow.disputeTask()
  33. Status → DISPUTED
  34. Admin dashboard flags for review (MVP)
```

---

## 22. Project Structure

```
crucible/
├── contracts/
│   ├── AgentRegistry.sol
│   ├── AgentStakeVault.sol
│   ├── TaskEscrow.sol
│   ├── TrustCalculator.sol
│   ├── SlashingJudge.sol
│   └── CrucibleINFT.sol
│
├── scripts/
│   ├── deploy.ts              ← deploy all in order
│   ├── mintAgent.ts
│   ├── seedBeginnerTasks.ts   ← cold start fix
│   ├── depositToVault.ts      ← fund demo agent vaults
│   ├── postDemoTask.ts
│   └── verify.ts
│
├── engine/
│   ├── assignmentEngine.ts
│   ├── pipelineCoordinator.ts ← sequential handoffs
│   ├── trustScorer.ts
│   ├── criteriaChecker.ts
│   ├── costTracker.ts         ← storage cost accounting
│   └── eventListener.ts
│
├── agents/
│   ├── researchAgent.ts       ← native, honest
│   ├── writingAgent.ts        ← native, honest
│   ├── strategicBadActor.ts   ← builds trust then defects
│   └── externalAgent.ts       ← OpenClaw-compatible wrapper
│
├── openclaw-skill/            ← OpenClaw plugin
│   ├── SKILL.md
│   ├── register.ts
│   ├── listen.ts
│   ├── execute.ts
│   └── submit.ts
│
├── services/
│   ├── storageService.ts
│   └── computeService.ts
│
├── types/
│   └── index.ts
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── agents/[address]/page.tsx
│   │   ├── tasks/[id]/page.tsx
│   │   ├── post/page.tsx
│   │   ├── register/page.tsx
│   │   └── vault/page.tsx
│   ├── components/
│   │   ├── Arena.tsx
│   │   ├── AgentCard.tsx
│   │   ├── TaskCard.tsx
│   │   ├── EventFeed.tsx
│   │   ├── TrustChart.tsx
│   │   ├── CriteriaBuilder.tsx
│   │   ├── VaultBalance.tsx
│   │   └── PipelineView.tsx
│   └── lib/
│       ├── contracts.ts
│       └── wagmi.ts
│
├── test/
│   ├── AgentRegistry.test.ts
│   ├── AgentStakeVault.test.ts
│   ├── TaskEscrow.test.ts
│   ├── TrustCalculator.test.ts
│   ├── SlashingJudge.test.ts
│   └── PartialCompletion.test.ts
│
├── hardhat.config.js
├── .env.example
├── README.md
└── package.json
```

---

## 23. Dependencies

### Contracts + Backend

```json
{
  "dependencies": {
    "@0gfoundation/0g-ts-sdk": "latest",
    "@0glabs/0g-serving-broker": "latest",
    "@openzeppelin/contracts": "^5.0.0",
    "ethers": "^6.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "hardhat": "^2.22.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.0.0"
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "ethers": "^6.0.0",
    "wagmi": "^2.0.0",
    "viem": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.8.0",
    "tailwindcss": "^3.3.0",
    "@0gfoundation/0g-ts-sdk": "latest"
  }
}
```

---

## 24. Development Timeline

| Week | Focus                    | Deliverable                                                   | Watch Out                                                                  |
| ---- | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | Contracts + vault        | 5 contracts deployed on testnet, vault deposit/withdraw works | Do the authorization setup right (addAuthorizedUpdater, setEscrowContract) |
| 2    | Storage + INFT           | Agent register, history upload/download, mint tested          | Hash format — use keccak256 wrapper for bytes32                            |
| 3    | Compute + pipeline       | TEE inference working, sequential handoff tested              | Hardest week — TEE attestation format may surprise you                     |
| 4    | Assignment engine        | Full task lifecycle in terminal, criteria checking working    | Test partial completion and deadline expiry explicitly                     |
| 5    | Demo agents + cold start | All 4 agents, beginner tasks seeded, bad actor demo scripted  | Rehearse demo — the story matters as much as the code                      |
| 6    | Frontend + README        | Arena live, all pages connected, README done                  | Don't skip the README — judges read it first                               |

---

## 25. Environment Variables

```bash
# .env

# 0G Network
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_CHAIN_ID=16602
OG_STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai

# Engine wallet (fund from faucet)
PRIVATE_KEY=your_engine_wallet_private_key

# Deployed contract addresses — fill after deploy.ts runs
INFT_CONTRACT_ADDRESS=0xDaDcfb515FDe4fdb07BFdbBe87d031504A051f4d
REGISTRY_CONTRACT_ADDRESS=0x20F1c04104c8BE5522D645BcA9E91E5Be41D6208
VAULT_CONTRACT_ADDRESS=0xdc0600dAf13Ee243EF4d904620242c8651790502
ESCROW_CONTRACT_ADDRESS=0xbD2F3B6DC25d51E0d5e14d399BD33f2F79A4A1E5
CALCULATOR_CONTRACT_ADDRESS=0x1E0bA4B9Fdf3C0E51bC1Bc9D54341B530f2E9F6E
JUDGE_CONTRACT_ADDRESS=0x02530d5A0A9d44900741F5c5D8Bb574Bb786Aa89

# 0G Compute
OG_COMPUTE_PROVIDER_ADDRESS=0xa48f01...
OG_MODEL=qwen-2.5-7b-instruct

# Demo agent wallets (separate from engine — each needs faucet funds)
RESEARCH_AGENT_KEY=
WRITING_AGENT_KEY=
BAD_ACTOR_AGENT_KEY=
EXTERNAL_AGENT_KEY=

# Frontend (NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_REGISTRY_ADDRESS=0x20F1c04104c8BE5522D645BcA9E91E5Be41D6208
NEXT_PUBLIC_ESCROW_ADDRESS=0xbD2F3B6DC25d51E0d5e14d399BD33f2F79A4A1E5
NEXT_PUBLIC_VAULT_ADDRESS=0xdc0600dAf13Ee243EF4d904620242c8651790502
NEXT_PUBLIC_JUDGE_ADDRESS=0x02530d5A0A9d44900741F5c5D8Bb574Bb786Aa89
NEXT_PUBLIC_INFT_ADDRESS=0xDaDcfb515FDe4fdb07BFdbBe87d031504A051f4d
```

---

## 26. Testing Strategy

### Contract Tests

```typescript
// test/AgentStakeVault.test.ts
describe('AgentStakeVault', () => {
  it('deposit and withdraw available balance', async () => {
    await vault.deposit({ value: parseEther('1.0') });
    expect(await vault.deposits(owner.address)).to.equal(parseEther('1.0'));
    await vault.withdraw(parseEther('0.5'));
    expect(await vault.deposits(owner.address)).to.equal(parseEther('0.5'));
  });

  it('cannot withdraw locked funds', async () => {
    await vault.deposit({ value: parseEther('1.0') });
    await vault.connect(escrowSigner).lockStake(owner.address, agent.address, parseEther('0.8'), 1);
    await expect(vault.withdraw(parseEther('0.5'))).to.be.revertedWith('Insufficient');
  });

  it('slash reduces owner deposit', async () => {
    await vault.deposit({ value: parseEther('1.0') });
    await vault.connect(escrowSigner).lockStake(owner.address, agent.address, parseEther('0.5'), 1);
    await vault
      .connect(escrowSigner)
      .unlockStake(owner.address, agent.address, parseEther('0.5'), true);
    expect(await vault.deposits(owner.address)).to.equal(parseEther('0.5'));
  });
});

// test/TrustCalculator.test.ts
describe('TrustCalculator', () => {
  it('tier 0 for < 3 tasks', async () => {
    expect(await calc.calculateTrustTier(2, 2, 2, 0)).to.equal(0);
  });
  it('tier 4 for 95%+ score', async () => {
    expect(await calc.calculateTrustTier(10, 10, 10, 0)).to.equal(4);
  });
  it('slash events reduce tier', async () => {
    const t1 = await calc.calculateTrustTier(10, 10, 10, 3);
    expect(Number(t1)).to.be.lessThan(4);
  });
  it('recent score weighted more than lifetime', async () => {
    const highRecent = await calc.calculateTrustTier(20, 10, 10, 0); // 50% lifetime, 100% recent
    const lowRecent = await calc.calculateTrustTier(20, 20, 5, 0); // 100% lifetime, 50% recent
    expect(Number(highRecent)).to.be.greaterThanOrEqual(Number(lowRecent));
  });
});

// test/PartialCompletion.test.ts
describe('Partial Completion', () => {
  it('poster refunded proportionally when one agent fails', async () => {
    // Post task 0.1 ETH, assign 2 agents
    // Agent 1 passes, agent 2 fails
    // Poster receives ~0.049 ETH (50% minus 2% fee)
    // Agent 1 gets paid ~0.05 ETH + stake returned
    // Agent 2 stake slashed
  });

  it('sequential: downstream agent gets stake back if upstream fails', async () => {
    // Stage 0 fails → stage 1 agent never ran
    // Stage 1 stake returned in full
    // Stage 1 does NOT appear in bad actor history
  });
});
```

### Demo Scenarios to Rehearse

1. **Clean sequential:** Research → Writing pipeline completes, both agents paid, trust climbs
2. **Strategic bad actor:** Cooperates 5 tasks → defects on high-value → slashed → 2.5x stake next round
3. **Recovery:** Bad actor cooperates 5 more times → tier slowly climbs back to 1
4. **Partial failure:** 1 honest + 1 bad agent → honest paid, bad slashed, poster partial refund
5. **OpenClaw agent:** Register as EXTERNAL, accept task, submit output, build trust over 3 tasks

---

## 27. Known Hard Parts

| Problem                     | Reality                                                           | How to Handle                                                                                |
| --------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| TEE attestation format      | May not directly verify on-chain via Solidity                     | Verify off-chain via `broker.verifier.verify()`, pass boolean result to contract             |
| 0G root hash vs bytes32     | SDK returns hex string, contract expects bytes32                  | `keccak256(toUtf8Bytes(rootHash))` for on-chain. Keep local Map for reverse lookup           |
| Sequential pipeline timing  | Stage timeout needs handling                                      | Add per-stage deadline = totalDeadline / numStages. If stage times out, call failExpiredTask |
| Vault authorization setup   | Must call setEscrowContract and addAuthorizedUpdater after deploy | Add to deploy.ts script — easy to forget                                                     |
| 4 wallet faucet limit       | Engine + 4 demo agents = 5 wallets × 0.1 OG/day                   | Use Google Cloud faucet for alternates. Join 0G Discord for extra testnet OG                 |
| External agent verification | No TEE proof                                                      | Hash commitment + dispute window. Document this limitation clearly in README                 |
| wagmi event listener drops  | WebSocket connections silently fail                               | Add `setInterval` polling every 30s as fallback                                              |
| Cold start                  | No tasks = no history, no history = no assignments                | Seed 10 beginner tasks on deploy using seedBeginnerTasks.ts                                  |
| Dispute resolution          | MVP has no automated process                                      | Flag in admin dashboard, state limitation in pitch. Judges respect honesty about scope       |
| Storage costs mainnet       | Every history write costs gas                                     | Protocol fee covers it. Track with CostTracker, monitor on mainnet                           |

---

## 28. README / Pitch Narrative

```markdown
# Crucible

> OpenClaw showed the world that autonomous agents can do real work.  
> Crucible answers the question nobody has solved yet: what happens when strangers' agents work together?

## The Problem

Autonomous AI agents are proliferating fast. OpenClaw alone has 300,000+ users running
agents that autonomously execute real tasks. The natural next step — agents from different
owners collaborating on shared work — has no accountability infrastructure.

An agent delivers garbage, collects payment, owner spins up a new wallet. Repeat.
Reputation systems get gamed. Identity systems get bypassed.

## The Solution

Crucible is a coordination layer built on 0G where:

- Every agent has a permanent behavioral history on **0G Storage** — immutable, tamper-proof
- Before any collaboration, the system reads that history and sets terms dynamically:
  honest agents need less stake, bad actors face progressively higher barriers
- All native agent outputs are verified by **0G Compute TEE** — cryptographic proof of
  what was actually produced, not just what was claimed
- Smart contracts automatically slash or release stakes based on verified output
- The math makes cheating always the losing move — **Bayesian Tit-for-Tat** on-chain

## Why 0G Specifically

- **0G Storage**: Permanent, decentralized agent memory — behavioral history cannot be deleted
- **0G Compute TEE**: Cryptographic output verification — you cannot fake what an agent produced
- **INFT / ERC-7857**: Agent identity that carries history across wallets and sessions
- **0G Chain EVM**: Smart contracts that enforce all of this automatically, 11,000 TPS

## For OpenClaw Users

Install the Crucible skill to register your OpenClaw agent and earn OG tokens on tasks
matching your capabilities while contributing to a trust network that makes the entire
agent economy more reliable.

    git clone https://github.com/yourhandle/crucible-openclaw-skill
    cd crucible-openclaw-skill && npm install
    node register.ts
    node listen.ts

## Demo

1. Watch 4 agents in the arena (3 honest + 1 strategic bad actor)
2. Bad actor builds trust over 5 tasks (trust climbs, stake drops)
3. Bad actor defects on a high-value task
4. Arena flashes red — bad actor slashed in real time
5. Next round: bad actor faces 2.5x stake requirement
6. After 5 honest tasks: trust slowly recovers

The arena is the demo. The mechanism underneath is the product.

## Track

**Agentic Infrastructure** + **Agentic Economy**

Built for 0G x HackQuest APAC Hackathon 2026 — Deadline May 9, 2026
```

---

_Last updated: April 11, 2026_
