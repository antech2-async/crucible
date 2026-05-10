# Product And Demo Story

## Demo Thesis

The demo should prove one thing:

> Crucible does not just show agent reputation. It changes economic consequences in real time.

## Demo Characters

Use simple names in the pitch:

| Agent | Role | Behavior |
| --- | --- | --- |
| Alice | Research agent | Honest, submits valid output |
| Bob | Writing or helper agent | Honest collaborator |
| Charlie | Flexible agent | Lower trust or backup |
| BadBot | Strategic defector | Builds trust, then submits weak work |

BadBot is important because the story is not "bad agent is obviously bad." The stronger story is:

> A bad actor can look trustworthy until the moment it defects. Crucible makes that defection expensive.

## Demo Flow

1. Open the Arena dashboard.
2. Show registered agents with trust tiers and recent performance.
3. Post or trigger a task with clear criteria.
4. The assignment engine selects matching agents.
5. Agent stakes are locked.
6. Honest agent submits valid output.
7. BadBot submits weak or non-compliant output.
8. Criteria checker marks BadBot as failed.
9. Slashing Judge resolves the task.
10. Honest agent gets paid and stake returned.
11. BadBot stake is slashed.
12. BadBot trust tier drops.
13. BadBot future stake requirement rises.

## What The Audience Should See

The demo visuals should show:

- Agent cards
- Trust tier indicator
- Recent performance bar or dots
- Task escrow panel
- Stake locked
- Verification state
- Slashing event in live feed
- Trust recalibration
- Higher required stake after failure

## 5-Minute Pitch Timing

### 0:00-0:30 - Hook

"Autonomous agents can already do real work. But when agents from different owners collaborate, there is no neutral way to make them accountable."

### 0:30-1:10 - Problem

Explain the bad workflow:

- Agent accepts task
- Submits garbage
- Payment and verification become messy
- Reputation can be reset
- No shared enforcement layer

### 1:10-1:50 - Solution

Introduce Crucible:

- Agents have identity
- Agents stake before work
- Tasks define objective criteria
- Outputs are verified
- Smart contracts pay or slash
- Trust updates future terms

### 1:50-2:40 - Product Loop

Walk through the loop:

Register -> Stake -> Assign -> Execute -> Verify -> Pay/Slash -> Update Trust

### 2:40-3:35 - Live Arena Demo Story

Show Alice and BadBot:

- Alice completes
- BadBot defects
- Judge resolves
- BadBot is slashed
- Trust drops
- Stake requirement rises

### 3:35-4:20 - Why 0G

Tie the architecture to 0G:

- Storage for history
- Compute for stronger verification
- Chain for enforcement
- INFT for identity

### 4:20-4:50 - Market Positioning

"We are not competing with agent frameworks. We are the accountability rail they need when agents work across owners and platforms."

### 4:50-5:00 - Close

"The arena is the demo. The mechanism is the product."

## 3-Minute Demo Video Variant

Hackathon submissions often need a short video. If making a 3-minute demo video, use this tighter structure:

1. Problem in 20 seconds
2. Product loop in 30 seconds
3. Arena demo in 90 seconds
4. 0G integration in 30 seconds
5. Closing thesis in 10 seconds

## Demo Script

Use this as a speaker script baseline:

```text
Right now, autonomous agents can do real work, but they cannot safely collaborate with strangers' agents. If an agent submits garbage, the owner can abandon the identity and try again somewhere else.

Crucible fixes this by making agent collaboration stake-backed and behavior-aware.

Every agent registers with an identity, deposits collateral, and builds a permanent behavioral history. When a task is posted, the assignment engine reads that history and selects agents based on capability and trust. The task payment is locked in escrow, and each selected agent has stake locked before work begins.

Now watch the Arena. Alice is an honest research agent. BadBot has built enough history to look reliable. Both are selected for this task.

Alice submits valid work. BadBot submits output that fails the criteria. The Slashing Judge resolves the task. Alice receives payment and gets her stake back. BadBot is slashed.

The important part is what happens next: BadBot's trust drops, and the next time it wants work, it must lock more collateral. Good behavior earns better terms. Bad behavior becomes expensive.

This works especially well on 0G because Crucible needs storage for behavioral history, compute verification for native agents, chain enforcement for escrow and slashing, and persistent agent identity.

The arena is the demo. The mechanism is the product.
```

## Canva Visual Storyboard

### Frame 1 - Arena Overview

Show the dashboard with multiple agent cards and trust scores.

Text label:

> Agents enter the arena with identity, history, and stake.

### Frame 2 - Task Posted

Show escrow card and criteria.

Text label:

> Work starts with payment and objective criteria locked upfront.

### Frame 3 - Assignment

Show Alice and BadBot selected.

Text label:

> Agents are matched by capability and behavioral trust.

### Frame 4 - Verification

Show split result: Alice pass, BadBot fail.

Text label:

> Outputs are checked against predefined rules.

### Frame 5 - Slashing

Show red slashing event and stake deduction.

Text label:

> Failed agents lose stake automatically.

### Frame 6 - Trust Recalibration

Show BadBot trust drop and stake multiplier increase.

Text label:

> Past behavior changes future terms.

