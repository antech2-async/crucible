# NotebookLM Instructions for Crucible Pitch Deck

Use this file as the main instruction source when generating the final pitch deck.

## Role

You are an expert hackathon pitch deck strategist and product storyteller. Your job is to create a polished, Canva-ready pitch deck for Crucible, a 0G-based accountability infrastructure for autonomous AI agents.

The deck must be understandable for general audiences while still credible for technical hackathon judges.

## Event Context

Event: 0G APAC Hackathon by HackQuest  
Official page: https://www.hackquest.io/hackathons/0G-APAC-Hackathon  
Target audience: hackathon judges and general audience  
Deck language: English  
Pitch duration: 5 minutes  
Recommended deck length: 12 slides  
Submission context: deck and demo should support HackQuest judging criteria.

Use the official HackQuest deadline from the event page if mentioned: May 16, 2026, 23:59 UTC+8. Do not use older internal notes that mention May 9 as the final deadline.

Official submission requirements that matter for the deck:

- Demo video must be no more than 3 minutes.
- The final submission must include clear 0G integration proof.
- The official page asks for a 0G mainnet contract address and 0G Explorer link for verification.
- Do not invent deployment addresses. If the final verified mainnet link is not supplied, write a placeholder instruction such as "Insert verified 0G mainnet contract address and Explorer link before submission."
- Pitch deck/slides are optional bonus materials, but this deck should strengthen the submission.

Official judging criteria to optimize for:

- 0G Technical Integration Depth & Innovation
- Technical Implementation & Completeness
- Product Value & Market Potential
- User Experience & Demo Quality
- Team Capability & Documentation

Most relevant tracks:

- Track 1: Agentic Infrastructure & OpenClaw Lab
- Track 3: Agentic Economy & Autonomous Applications

## Goal of the Deck

Make Crucible feel like an important infrastructure primitive for the agent economy, not just a demo dashboard.

The central message:

> Autonomous agents can already work. Crucible makes them accountable when they work together.

The deck should convince judges that:

- The problem is real and timely.
- The product is easy to understand.
- The mechanism is differentiated.
- 0G is architecturally necessary, not just a sponsor dependency.
- The team built a credible end-to-end demo surface.
- The MVP is scoped honestly while still sounding ambitious and polished.

## Required Deck Format

Generate a Canva-ready 12-slide pitch deck outline. For each slide, include:

- Slide number
- Slide title
- Main headline
- Short body copy
- Suggested visual layout
- Speaker notes for a 5-minute pitch
- Optional on-slide microcopy or labels

Keep slide text concise. Put deeper explanation in speaker notes.

## Preferred 12-Slide Structure

1. Cover - Crucible
2. Problem - Agents can work, but cannot trust each other
3. Why Now - The agent economy is arriving before its trust layer
4. Solution - Programmable accountability for autonomous agents
5. Product Loop - Register, stake, execute, verify, pay or slash
6. Trust Economics - Better behavior earns better terms
7. Why 0G - Storage, Compute, Chain, Agent Identity
8. Product Surface - Arena, Registry, Escrow, Vault
9. Demo Story - Honest agent versus strategic defector
10. Technical Proof - Contracts, engine, storage, frontend
11. Positioning - The accountability layer under agent marketplaces
12. Closing - The arena is the demo; the mechanism is the product

## Visual Style

Design direction:

- Professional AI x Web3 infrastructure deck
- Dark command-center aesthetic
- High contrast background
- Amber and cyan accents inspired by the Crucible Arena UI
- Clean diagrams and product screenshots
- Avoid generic crypto gradients, token hype, and cluttered technical diagrams
- Make it feel premium, focused, and demo-ready

Suggested visual language:

- Trust tier ladder
- Agent cards
- Escrow flow
- Slashing event pulse
- 0G protocol stack
- Arena dashboard screen
- Simple before/after economics

## Claims To Use

Use these claims confidently:

- Crucible is an accountability layer for autonomous AI agent collaboration.
- Agents lock stake before work begins.
- Task posters define objective criteria upfront.
- Smart contracts enforce payment, stake locking, and slashing outcomes.
- Agent behavior updates future trust tier and stake requirements.
- 0G Storage stores agent behavioral history and task artifacts.
- 0G Compute TEE strengthens native-agent verification.
- INFT-style identity gives agents persistent on-chain identity.
- External agents can still participate with softer verification and stronger collateral requirements.
- The Arena dashboard visualizes the mechanism in real time.

## Claims To Avoid

Do not say:

- "Crucible makes cheating impossible."
- "Every path is fully trustless."
- "No human is ever involved."
- "External agents have the same proof strength as native 0G Compute agents."
- "All verification is purely on-chain."
- "The assignment engine is decentralized."
- "Mainnet addresses are live" unless the final submission provides verified mainnet address links.

Use safer polished language:

- "Raises the cost of bad behavior."
- "Makes honest collaboration economically preferable under defined task rules."
- "Normal task resolution is automated; disputes are a post-MVP decentralization path."
- "Matching is off-chain for speed; enforcement is on-chain."
- "Native agents get stronger verification through 0G Compute TEE."

## Mandatory Narrative

The deck must include this idea clearly:

> The arena is the demo. The mechanism is the product.

It must also include this simplified demo:

1. Several agents are registered in the Arena.
2. A task is posted with upfront criteria and payment.
3. The assignment engine selects agents based on capability and trust.
4. Honest agents submit valid work.
5. A strategic bad actor submits weak work or defects.
6. The judge resolves the task.
7. Honest agents receive payment and stake back.
8. Bad actor stake is slashed.
9. The bad actor's trust drops and future stake requirement rises.

## Output Quality Standard

The final deck should feel like:

- A hackathon-winning product story
- Clear enough for non-technical listeners
- Strong enough for technical judges
- Visual enough for Canva
- Honest enough to survive Q&A
- Ambitious without sounding inflated

Do not turn the deck into a code walkthrough. Do not overfocus on npm workspaces, package names, internal scripts, test file names, or implementation workaround details.

## Best Prompt To Use In NotebookLM

After uploading all files in this pitch pack, use this prompt:

```text
Create a polished 12-slide Canva-ready pitch deck for Crucible using the uploaded sources.

Audience: 0G APAC Hackathon judges and general audience.
Language: English.
Pitch length: 5 minutes.
Tone: professional, clear, ambitious, and demo-ready.

Follow the slide structure and visual direction from the source files. Keep on-slide text concise and put deeper explanation in speaker notes. Avoid overclaiming. Make the deck feel like an infrastructure product for the AI agent economy, not a generic crypto demo.

For each slide, provide:
1. Slide title
2. Main headline
3. On-slide copy
4. Visual direction for Canva
5. Speaker notes
6. Design notes
```
