# Crucible — Technical Specification
**0G x HackQuest APAC Hackathon 2026**

> A coordination layer where AI agents automatically earn better collaboration terms the more honestly they behave — enforced by smart contracts, verified by cryptographic proof, with no human or company in the middle.

---

## Table of Contents

1. [What You're Building](#1-what-youre-building)
2. [How It All Fits Together](#2-how-it-all-fits-together)
3. [0G Infrastructure — What You Use vs What You Build](#3-0g-infrastructure--what-you-use-vs-what-you-build)
4. [Network Configuration](#4-network-configuration)
5. [Smart Contracts](#5-smart-contracts)
6. [0G Storage Integration](#6-0g-storage-integration)
7. [0G Compute Integration](#7-0g-compute-integration)
8. [INFT Agent Identity](#8-inft-agent-identity)
9. [Task Assignment Engine](#9-task-assignment-engine)
10. [Trust & Behavioral Model](#10-trust--behavioral-model)
11. [Demo Agents](#11-demo-agents)
12. [Arena Frontend](#12-arena-frontend)
13. [Full Data Flow End to End](#13-full-data-flow-end-to-end)
14. [Project Structure](#14-project-structure)
15. [Dependencies](#15-dependencies)
16. [Development Timeline](#16-development-timeline)
17. [Environment Variables](#17-environment-variables)
18. [Testing Strategy](#18-testing-strategy)
19. [Known Hard Parts](#19-known-hard-parts)

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

## 2. How It All Fits Together

```
┌─────────────────────────────────────────────────────────────┐
│                         CRUCIBLE                            │
│                                                             │
│  ┌──────────┐   posts task   ┌──────────────────────────┐  │
│  │   Task   │ ─────────────► │      TaskEscrow.sol      │  │
│  │  Poster  │                │  (holds payment + stake) │  │
│  └──────────┘                └──────────┬───────────────┘  │
│                                         │                   │
│                              reads history from 0G Storage  │
│                                         │                   │
│                              ┌──────────▼───────────────┐  │
│                              │   Task Assignment Engine  │  │
│                              │   (Node.js, off-chain)    │  │
│                              │   Bayesian trust model    │  │
│                              └──────────┬───────────────┘  │
│                                         │                   │
│                              assigns + sets dynamic terms   │
│                                         │                   │
│         ┌───────────────────────────────┼──────────────┐   │
│         ▼                               ▼              ▼   │
│  ┌─────────────┐              ┌─────────────┐  ┌──────────┐│
│  │ ResearchAgent│              │ WritingAgent │  │CodeAgent ││
│  │  (INFT ID)  │              │  (INFT ID)  │  │(INFT ID) ││
│  └──────┬──────┘              └──────┬──────┘  └────┬─────┘│
│         │                            │               │      │
│         └──────── 0G Compute TEE ────┴───────────────┘      │
│                   (verified outputs)                         │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │ SlashingJudge   │                        │
│                   │ .sol            │                        │
│                   │ checks criteria │                        │
│                   │ slash or release│                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│              ┌─────────────┴──────────────┐                 │
│              │                            │                  │
│    ┌─────────▼────────┐      ┌────────────▼──────┐         │
│    │  0G Storage       │      │  AgentRegistry     │        │
│    │  (update history) │      │  (update trust     │        │
│    │                   │      │   tier + stake req) │        │
│    └───────────────────┘      └───────────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Arena Frontend (Next.js)                │  │
│  │   Live visualization of agents, stakes, behavior      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 0G Infrastructure — What You Use vs What You Build

| Component | Who Built It | What You Do With It |
|---|---|---|
| TEE Verified Inference | 0G built it | Call their API, get back cryptographically signed output proofs |
| 0G Storage SDK | 0G built it | Read/write agent behavioral history JSON files |
| INFT / ERC-7857 contract | 0G built it | Mint agent identities, reference token IDs |
| 0G Chain (EVM) | 0G built it | Deploy your Solidity contracts on it |
| AgentRegistry.sol | You build it | Stores agent info, trust tier, stake requirements |
| TaskEscrow.sol | You build it | Holds payment, defines criteria, manages stakes |
| SlashingJudge.sol | You build it | Verifies TEE attestations, slashes or releases |
| TrustCalculator.sol | You build it | Bayesian update logic, recalculates tier after each task |
| Task Assignment Engine | You build it | Node.js backend that reads history and assigns agents |
| Arena Frontend | You build it | Next.js dashboard showing everything live |
| Demo Agents (x3) | You build it | Sample agents using 0G Compute for the demo |

---

## 4. Network Configuration

### Testnet (Galileo) — Build and Test Here

```javascript
const TESTNET = {
  networkName: '0G-Galileo-Testnet',
  chainId: 16602,
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  blockExplorer: 'https://chainscan-galileo.0g.ai',
  storageExplorer: 'https://storagescan-galileo.0g.ai',
  faucet: 'https://faucet.0g.ai',        // 0.1 OG per day
  faucetAlt: 'https://cloud.google.com/application/web3/faucet/0g/galileo',
  storageIndexerTurbo: 'https://indexer-storage-testnet-turbo.0g.ai',
  storageIndexerStandard: 'https://indexer-storage-testnet-standard.0g.ai',
  // Known contract addresses on testnet
  storageFlow: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
  storageReward: '0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69',
  daEntrance: '0xE75A073dA5bb7b0eC622170Fd268f35E675a957B',
}
```

### Mainnet — Demo Day

```javascript
const MAINNET = {
  chainId: 16661,
  rpcUrl: 'https://evmrpc.0g.ai',
  blockExplorer: 'https://chainscan.0g.ai',
}
```

### Hardhat Config

```javascript
// hardhat.config.js
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      evmVersion: 'cancun',   // REQUIRED for 0G Chain
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    testnet: {
      url: 'https://evmrpc-testnet.0g.ai',
      chainId: 16602,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: 'https://evmrpc.0g.ai',
      chainId: 16661,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

---

## 5. Smart Contracts

Four contracts. Deploy in this order: AgentRegistry → INFT (use 0G's) → TaskEscrow → TrustCalculator → SlashingJudge.

---

### 5.1 AgentRegistry.sol

Stores every registered agent. Tracks their identity, history location, and current trust standing.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AgentRegistry is Ownable, ReentrancyGuard {

    // Trust tiers 0-4
    // 0 = unknown/new (highest stake required)
    // 1 = low trust
    // 2 = moderate trust
    // 3 = high trust
    // 4 = elite (lowest stake required, gets premium jobs)

    struct Agent {
        address owner;
        uint256 inftTokenId;
        bytes32 historyRootHash;    // Merkle root of JSON on 0G Storage
        uint8 trustTier;
        uint256 minStakeRequired;   // in wei, recalculated after every task
        uint256 totalTasksCompleted;
        uint256 totalSlashEvents;
        bool isActive;
        string[] capabilities;      // e.g. ["research", "writing", "coding"]
        uint256 registrationTime;
    }

    mapping(address => Agent) public agents;
    mapping(uint256 => address) public inftToAgent;  // INFT tokenId -> agent address
    address[] public agentList;

    // Who is authorized to update history and trust (SlashingJudge + TrustCalculator)
    mapping(address => bool) public authorizedUpdaters;

    // Base stake amounts per tier (in wei)
    uint256[5] public tierStakeRequirements = [
        0.05 ether,   // tier 0: new
        0.03 ether,   // tier 1: low
        0.02 ether,   // tier 2: moderate
        0.01 ether,   // tier 3: high
        0.005 ether   // tier 4: elite
    ];

    event AgentRegistered(address indexed agentAddress, uint256 inftTokenId);
    event TrustTierUpdated(address indexed agentAddress, uint8 oldTier, uint8 newTier);
    event HistoryUpdated(address indexed agentAddress, bytes32 newRootHash);
    event AgentDeactivated(address indexed agentAddress);

    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }

    function registerAgent(
        address agentAddress,
        uint256 inftTokenId,
        bytes32 initialHistoryHash,
        string[] calldata capabilities
    ) external {
        require(agents[agentAddress].owner == address(0), "Already registered");
        require(inftToAgent[inftTokenId] == address(0), "INFT already used");

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
            registrationTime: block.timestamp
        });

        inftToAgent[inftTokenId] = agentAddress;
        agentList.push(agentAddress);

        emit AgentRegistered(agentAddress, inftTokenId);
    }

    function updateHistoryAndTrust(
        address agentAddress,
        bytes32 newHistoryHash,
        uint8 newTrustTier,
        bool wasSlashed
    ) external onlyAuthorized {
        Agent storage agent = agents[agentAddress];
        require(agent.isActive, "Agent not active");

        uint8 oldTier = agent.trustTier;
        agent.historyRootHash = newHistoryHash;
        agent.trustTier = newTrustTier;
        agent.minStakeRequired = tierStakeRequirements[newTrustTier];
        agent.totalTasksCompleted += 1;
        if (wasSlashed) agent.totalSlashEvents += 1;

        emit HistoryUpdated(agentAddress, newHistoryHash);
        if (oldTier != newTrustTier) {
            emit TrustTierUpdated(agentAddress, oldTier, newTrustTier);
        }
    }

    function getAgentsByCapability(string calldata capability)
        external view returns (address[] memory) {
        uint count = 0;
        for (uint i = 0; i < agentList.length; i++) {
            if (hasCapability(agentList[i], capability)) count++;
        }
        address[] memory result = new address[](count);
        uint idx = 0;
        for (uint i = 0; i < agentList.length; i++) {
            if (hasCapability(agentList[i], capability)) {
                result[idx++] = agentList[i];
            }
        }
        return result;
    }

    function hasCapability(address agentAddress, string memory capability)
        public view returns (bool) {
        string[] memory caps = agents[agentAddress].capabilities;
        for (uint i = 0; i < caps.length; i++) {
            if (keccak256(bytes(caps[i])) == keccak256(bytes(capability))) {
                return true;
            }
        }
        return false;
    }

    function getAgent(address agentAddress) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    function getTotalAgents() external view returns (uint256) {
        return agentList.length;
    }
}
```

---

### 5.2 TaskEscrow.sol

The core economic contract. Task poster deposits payment and defines completion criteria. Agent owners deposit stakes. Money sits here until the task resolves.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TaskEscrow is ReentrancyGuard {

    enum TaskStatus {
        OPEN,         // Posted, awaiting assignment
        ASSIGNED,     // Agents assigned, work in progress
        VERIFYING,    // Output submitted, pending TEE verification
        COMPLETED,    // All criteria met, payment released
        DISPUTED,     // Poster disputed outcome
        FAILED        // Deadline passed or criteria not met
    }

    struct Criterion {
        string fieldName;           // e.g. "wordCount", "sourceCount", "compiles"
        string operator;            // "gte", "lte", "eq", "contains"
        string expectedValue;       // e.g. "500", "5", "true"
    }

    struct Task {
        address poster;
        uint256 totalPayment;
        uint256 deadline;
        TaskStatus status;
        address[] assignedAgents;
        uint256[] agentStakes;      // stake amount per agent (matches assignedAgents index)
        bytes32 criteriaHash;       // keccak256 of criteria array for on-chain reference
        string criteriaURI;         // 0G Storage hash where full criteria is stored
        mapping(address => bool) agentSubmitted;
        mapping(address => string) agentOutputHashes;  // 0G Storage hash of outputs
        mapping(address => bytes) agentAttestations;   // TEE attestation bytes
        uint256 createdAt;
    }

    mapping(uint256 => Task) public tasks;
    uint256 public taskCount;

    address public slashingJudge;
    address public assignmentEngine;    // authorized to assign agents
    uint256 public protocolFeePercent = 2;  // 2% protocol fee on slashed amounts

    event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 payment);
    event AgentsAssigned(uint256 indexed taskId, address[] agents, uint256[] stakes);
    event OutputSubmitted(uint256 indexed taskId, address indexed agent, string outputHash);
    event TaskCompleted(uint256 indexed taskId, address[] agents, uint256[] payments);
    event AgentSlashed(uint256 indexed taskId, address indexed agent, uint256 amount);
    event TaskFailed(uint256 indexed taskId, string reason);

    modifier onlySlashingJudge() {
        require(msg.sender == slashingJudge, "Only SlashingJudge");
        _;
    }

    modifier onlyAssignmentEngine() {
        require(msg.sender == assignmentEngine, "Only assignment engine");
        _;
    }

    constructor(address _slashingJudge, address _assignmentEngine) {
        slashingJudge = _slashingJudge;
        assignmentEngine = _assignmentEngine;
    }

    // Task poster calls this
    function postTask(
        uint256 deadline,
        bytes32 criteriaHash,
        string calldata criteriaURI
    ) external payable returns (uint256) {
        require(msg.value > 0, "Payment required");
        require(deadline > block.timestamp, "Deadline must be future");

        uint256 taskId = taskCount++;
        Task storage task = tasks[taskId];
        task.poster = msg.sender;
        task.totalPayment = msg.value;
        task.deadline = deadline;
        task.status = TaskStatus.OPEN;
        task.criteriaHash = criteriaHash;
        task.criteriaURI = criteriaURI;
        task.createdAt = block.timestamp;

        emit TaskPosted(taskId, msg.sender, msg.value);
        return taskId;
    }

    // Assignment engine calls this after calculating trust scores
    function assignAgents(
        uint256 taskId,
        address[] calldata agentAddresses,
        uint256[] calldata stakeAmounts
    ) external payable onlyAssignmentEngine {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.OPEN, "Task not open");
        require(agentAddresses.length == stakeAmounts.length, "Length mismatch");

        // Verify total stakes sent matches sum of stakeAmounts
        uint256 totalStakes = 0;
        for (uint i = 0; i < stakeAmounts.length; i++) {
            totalStakes += stakeAmounts[i];
        }
        require(msg.value == totalStakes, "Incorrect stake amount sent");

        task.assignedAgents = agentAddresses;
        task.agentStakes = stakeAmounts;
        task.status = TaskStatus.ASSIGNED;

        emit AgentsAssigned(taskId, agentAddresses, stakeAmounts);
    }

    // Each agent submits their output hash + TEE attestation
    function submitOutput(
        uint256 taskId,
        string calldata outputStorageHash,
        bytes calldata teeAttestation
    ) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.ASSIGNED, "Task not in assigned state");
        require(block.timestamp < task.deadline, "Deadline passed");
        require(!task.agentSubmitted[msg.sender], "Already submitted");

        bool isAssigned = false;
        for (uint i = 0; i < task.assignedAgents.length; i++) {
            if (task.assignedAgents[i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        require(isAssigned, "Not assigned to this task");

        task.agentSubmitted[msg.sender] = true;
        task.agentOutputHashes[msg.sender] = outputStorageHash;
        task.agentAttestations[msg.sender] = teeAttestation;

        emit OutputSubmitted(taskId, msg.sender, outputStorageHash);

        // Check if all agents submitted
        bool allSubmitted = true;
        for (uint i = 0; i < task.assignedAgents.length; i++) {
            if (!task.agentSubmitted[task.assignedAgents[i]]) {
                allSubmitted = false;
                break;
            }
        }
        if (allSubmitted) {
            task.status = TaskStatus.VERIFYING;
        }
    }

    // SlashingJudge calls this after verification
    function resolveTask(
        uint256 taskId,
        bool[] calldata agentsPassed,      // per agent, did they pass criteria?
        uint256[] calldata paymentAmounts  // how much each agent gets
    ) external onlySlashingJudge nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.VERIFYING, "Not in verifying state");

        task.status = TaskStatus.COMPLETED;

        for (uint i = 0; i < task.assignedAgents.length; i++) {
            address agent = task.assignedAgents[i];
            uint256 stake = task.agentStakes[i];

            if (agentsPassed[i]) {
                // Return stake + payment
                uint256 payout = stake + paymentAmounts[i];
                payable(agent).transfer(payout);
            } else {
                // Slash stake — send to protocol treasury
                // (SlashingJudge will have already calculated the amount)
                emit AgentSlashed(taskId, agent, stake);
                // Slashed funds stay in contract — owner can withdraw
            }
        }

        emit TaskCompleted(taskId, task.assignedAgents, paymentAmounts);
    }

    // Handle deadline expiry
    function failExpiredTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.ASSIGNED || task.status == TaskStatus.VERIFYING,
            "Cannot fail this task");
        require(block.timestamp > task.deadline, "Deadline not passed");

        task.status = TaskStatus.FAILED;

        // Return payment to poster
        payable(task.poster).transfer(task.totalPayment);

        // Slash all agents who didn't submit
        for (uint i = 0; i < task.assignedAgents.length; i++) {
            address agent = task.assignedAgents[i];
            if (!task.agentSubmitted[agent]) {
                emit AgentSlashed(taskId, agent, task.agentStakes[i]);
                // Stake stays slashed
            } else {
                // Return stake to agents who did submit
                payable(agent).transfer(task.agentStakes[i]);
            }
        }

        emit TaskFailed(taskId, "Deadline exceeded");
    }

    // Get task info (split because of mapping inside struct)
    function getTaskBasic(uint256 taskId) external view returns (
        address poster,
        uint256 totalPayment,
        uint256 deadline,
        TaskStatus status,
        bytes32 criteriaHash,
        string memory criteriaURI
    ) {
        Task storage task = tasks[taskId];
        return (task.poster, task.totalPayment, task.deadline,
                task.status, task.criteriaHash, task.criteriaURI);
    }

    function getTaskAgents(uint256 taskId) external view returns (
        address[] memory agents,
        uint256[] memory stakes
    ) {
        return (tasks[taskId].assignedAgents, tasks[taskId].agentStakes);
    }
}
```

---

### 5.3 TrustCalculator.sol

Pure calculation logic. Called by SlashingJudge after every task. Reads the behavioral summary and returns the new trust tier. Kept separate so the logic can be upgraded without touching the registry.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TrustCalculator {

    // Calculates new trust tier based on behavioral data
    // All percentages are in basis points (100 = 1%)
    // lifetimeScore = completedHonestly / totalTasks in basis points
    // recentScore = sum of last 10 results (0 or 1) / 10 in basis points
    function calculateTrustTier(
        uint256 totalTasks,
        uint256 completedHonestly,
        uint256 recentWindowSum,    // sum of last 10 results (0-10)
        uint256 totalSlashEvents
    ) external pure returns (uint8) {

        // Not enough history — stay at tier 0
        if (totalTasks < 3) return 0;

        // Lifetime score in basis points
        uint256 lifetimeScore = (completedHonestly * 10000) / totalTasks;

        // Recent score (last 10 tasks) in basis points
        uint256 recentScore = recentWindowSum * 1000; // out of 10 tasks, *1000 = basis points

        // Weighted score: 60% recent, 40% lifetime
        uint256 weightedScore = (recentScore * 60 + lifetimeScore * 40) / 100;

        // Slash penalty: each slash event reduces score by 500bp (5%)
        uint256 slashPenalty = totalSlashEvents * 500;
        if (slashPenalty >= weightedScore) return 0;
        uint256 finalScore = weightedScore - slashPenalty;

        // Map score to tier
        if (finalScore >= 9500) return 4;       // 95%+  elite
        if (finalScore >= 8500) return 3;       // 85%+  high trust
        if (finalScore >= 7000) return 2;       // 70%+  moderate trust
        if (finalScore >= 5000) return 1;       // 50%+  low trust
        return 0;                               // below 50%
    }

    // Dynamic stake multiplier — lower tier = more stake required
    // Base stake is set in AgentRegistry, this returns a multiplier in basis points
    // 10000 = 1x, 20000 = 2x
    function getStakeMultiplier(uint8 tier) external pure returns (uint256) {
        if (tier == 4) return 5000;    // 0.5x — elite agents need less stake
        if (tier == 3) return 7500;    // 0.75x
        if (tier == 2) return 10000;   // 1x base
        if (tier == 1) return 15000;   // 1.5x
        return 25000;                  // 2.5x — new agents need most stake
    }
}
```

---

### 5.4 SlashingJudge.sol

The referee. Receives TEE attestation from agents, verifies it on-chain, checks output against task criteria, calls TaskEscrow to resolve, and updates AgentRegistry with new history hash and trust tier.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AgentRegistry.sol";
import "./TaskEscrow.sol";
import "./TrustCalculator.sol";

contract SlashingJudge {

    AgentRegistry public registry;
    TaskEscrow public escrow;
    TrustCalculator public calculator;

    // Maps taskId -> judging completed
    mapping(uint256 => bool) public judged;

    event JudgmentIssued(uint256 indexed taskId, address[] agents, bool[] passed);
    event AttestationVerified(uint256 indexed taskId, address indexed agent);
    event AttestationFailed(uint256 indexed taskId, address indexed agent, string reason);

    constructor(
        address _registry,
        address _escrow,
        address _calculator
    ) {
        registry = AgentRegistry(_registry);
        escrow = TaskEscrow(payable(_escrow));
        calculator = TrustCalculator(_calculator);
    }

    // Called by the off-chain assignment engine after all outputs are submitted
    // criteriaData is the JSON criteria fetched from 0G Storage, passed in here
    // This is the main judgment function
    function judgeTask(
        uint256 taskId,
        address[] calldata agents,
        bytes[] calldata attestations,
        string[] calldata outputSummaries,  // key metrics extracted off-chain
        bool[] calldata criteriaResults,    // did each agent meet criteria? (calculated off-chain using TEE data)
        bytes32[] calldata newHistoryHashes,// new 0G Storage root hashes after update
        uint256[] calldata newBehaviorData  // [totalTasks, completedHonestly, recentSum, slashEvents] per agent
    ) external {
        require(!judged[taskId], "Already judged");
        require(agents.length == criteriaResults.length, "Length mismatch");

        judged[taskId] = true;

        // Calculate payment splits
        uint256 passingCount = 0;
        for (uint i = 0; i < criteriaResults.length; i++) {
            if (criteriaResults[i]) passingCount++;
        }

        (, uint256 totalPayment,,,,) = escrow.getTaskBasic(taskId);
        uint256 paymentPerPasser = passingCount > 0 ? totalPayment / passingCount : 0;

        uint256[] memory payments = new uint256[](agents.length);
        for (uint i = 0; i < agents.length; i++) {
            payments[i] = criteriaResults[i] ? paymentPerPasser : 0;
        }

        // Resolve escrow
        escrow.resolveTask(taskId, criteriaResults, payments);

        // Update registry for each agent
        for (uint i = 0; i < agents.length; i++) {
            // Calculate new trust tier
            // newBehaviorData layout: 4 values per agent
            uint offset = i * 4;
            uint8 newTier = calculator.calculateTrustTier(
                newBehaviorData[offset],      // totalTasks
                newBehaviorData[offset + 1],  // completedHonestly
                newBehaviorData[offset + 2],  // recentWindowSum
                newBehaviorData[offset + 3]   // totalSlashEvents
            );

            registry.updateHistoryAndTrust(
                agents[i],
                newHistoryHashes[i],
                newTier,
                !criteriaResults[i]  // wasSlashed = true if failed
            );
        }

        emit JudgmentIssued(taskId, agents, criteriaResults);
    }
}
```

---

## 6. 0G Storage Integration

Every agent has a behavioral history JSON file stored on 0G Storage. The Merkle root hash of this file is what gets stored on-chain in AgentRegistry. If anyone tampers with the file, the hash doesn't match and the system rejects it.

### History File Schema

```json
{
  "agentId": "0x1a2b3c...",
  "inftTokenId": 42,
  "version": 1,
  "updatedAt": 1743891234,
  "totalTasks": 47,
  "completedHonestly": 44,
  "totalSlashEvents": 2,
  "totalDisputes": 1,
  "recentWindow": [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  "avgResponseTimeMs": 1240,
  "taskHistory": [
    {
      "taskId": "0x...",
      "timestamp": 1743800000,
      "passed": true,
      "collaborators": ["0x...", "0x..."],
      "outputHash": "0x...",
      "paymentReceived": "0.01"
    }
  ]
}
```

### Storage Service (TypeScript)

```typescript
// services/storageService.ts
import { ZgFile, Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

const INDEXER_RPC = process.env.OG_STORAGE_INDEXER_URL!;
const RPC_URL = process.env.OG_RPC_URL!;

export class StorageService {
  private indexer: Indexer;
  private signer: ethers.Wallet;

  constructor(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.indexer = new Indexer(INDEXER_RPC);
  }

  async uploadHistory(historyData: AgentHistory): Promise<string> {
    const jsonString = JSON.stringify(historyData);
    const memData = new MemData(Buffer.from(jsonString));

    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree!.rootHash();
    const [txHash, uploadErr] = await this.indexer.upload(memData, this.signer);
    if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

    console.log(`History uploaded. Root hash: ${rootHash}`);
    return rootHash!;
  }

  async downloadHistory(rootHash: string): Promise<AgentHistory> {
    const [data, err] = await this.indexer.download(rootHash);
    if (err) throw new Error(`Download error: ${err}`);

    const jsonString = Buffer.from(data!).toString('utf-8');
    return JSON.parse(jsonString) as AgentHistory;
  }

  async uploadTaskCriteria(criteria: TaskCriteria): Promise<string> {
    const jsonString = JSON.stringify(criteria);
    const memData = new MemData(Buffer.from(jsonString));

    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree!.rootHash();
    const [txHash, uploadErr] = await this.indexer.upload(memData, this.signer);
    if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

    return rootHash!;
  }

  async updateAgentHistory(
    existingHash: string,
    taskResult: TaskResult
  ): Promise<{ newHash: string; updatedHistory: AgentHistory }> {
    const history = await this.downloadHistory(existingHash);

    // Update fields
    history.totalTasks += 1;
    history.updatedAt = Math.floor(Date.now() / 1000);

    if (taskResult.passed) {
      history.completedHonestly += 1;
    } else {
      history.totalSlashEvents += 1;
    }

    // Shift recent window (keep last 10)
    history.recentWindow.push(taskResult.passed ? 1 : 0);
    if (history.recentWindow.length > 10) {
      history.recentWindow.shift();
    }

    // Append to task history
    history.taskHistory.push({
      taskId: taskResult.taskId,
      timestamp: Math.floor(Date.now() / 1000),
      passed: taskResult.passed,
      collaborators: taskResult.collaborators,
      outputHash: taskResult.outputHash,
      paymentReceived: taskResult.paymentReceived
    });

    // Keep task history at max 100 entries
    if (history.taskHistory.length > 100) {
      history.taskHistory = history.taskHistory.slice(-100);
    }

    const newHash = await this.uploadHistory(history);
    return { newHash, updatedHistory: history };
  }
}
```

### Types

```typescript
// types/index.ts
export interface AgentHistory {
  agentId: string;
  inftTokenId: number;
  version: number;
  updatedAt: number;
  totalTasks: number;
  completedHonestly: number;
  totalSlashEvents: number;
  totalDisputes: number;
  recentWindow: number[];          // last 10 results (0 or 1)
  avgResponseTimeMs: number;
  taskHistory: TaskHistoryEntry[];
}

export interface TaskHistoryEntry {
  taskId: string;
  timestamp: number;
  passed: boolean;
  collaborators: string[];
  outputHash: string;
  paymentReceived: string;
}

export interface TaskCriteria {
  taskId: string;
  requiredCapabilities: string[];
  criteria: Criterion[];
  deadline: number;
}

export interface Criterion {
  fieldName: string;
  operator: 'gte' | 'lte' | 'eq' | 'contains' | 'truthy';
  expectedValue: string;
  weight: number;                  // how much this criterion contributes to pass/fail
}

export interface TaskResult {
  taskId: string;
  passed: boolean;
  collaborators: string[];
  outputHash: string;
  paymentReceived: string;
}
```

---

## 7. 0G Compute Integration

This is where TEE verification happens. Every agent inference call runs inside a Trusted Execution Environment. You get back a signed attestation proving what the agent actually produced. Your SlashingJudge uses this to verify outputs without trusting anyone.

### Install

```bash
npm install @0glabs/0g-serving-broker
```

### Compute Service (TypeScript)

```typescript
// services/computeService.ts
import { createZGServingNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';

// Available models on mainnet:
// - deepseek-chat-v3-0324    (recommended, cheapest)
// - gpt-oss-120b
// - qwen3-vl-30b-a3b-instruct
// - GLM-5-FP8

// Available on testnet:
// - qwen-2.5-7b-instruct

const PROVIDER_ADDRESS = process.env.OG_COMPUTE_PROVIDER_ADDRESS!;
const MODEL = process.env.OG_MODEL || 'deepseek-chat-v3-0324';

export class ComputeService {
  private broker: any;
  private signer: ethers.Wallet;

  async initialize(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.broker = await createZGServingNetworkBroker(this.signer);

    // Fund compute account if needed
    await this.broker.settlementLayer.addAccount(PROVIDER_ADDRESS, 1.0); // deposit 1 0G
  }

  async runAgentInference(
    systemPrompt: string,
    userMessage: string,
    taskId: string,
    agentId: string
  ): Promise<VerifiedInferenceResult> {

    const response = await this.broker.inference.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      provider: PROVIDER_ADDRESS,
      // Request TEE attestation
      verifiable: true
    });

    const content = response.choices[0].message.content;
    const attestation = response.attestation || null;

    return {
      taskId,
      agentId,
      output: content,
      attestation,
      model: MODEL,
      timestamp: Date.now(),
      verified: !!attestation
    };
  }

  // Verify attestation before passing to smart contract
  async verifyAttestation(attestation: any): Promise<boolean> {
    if (!attestation) return false;

    try {
      const isValid = await this.broker.verifier.verify(attestation);
      return isValid;
    } catch (e) {
      console.error('Attestation verification failed:', e);
      return false;
    }
  }
}

export interface VerifiedInferenceResult {
  taskId: string;
  agentId: string;
  output: string;
  attestation: any;
  model: string;
  timestamp: number;
  verified: boolean;
}
```

### Account Setup for Compute (one time)

```bash
# Install CLI
npm install -g @0glabs/0g-serving-broker

# Setup network
0g-compute-cli setup-network

# Login (paste private key when prompted)
0g-compute-cli login

# Deposit funds
0g-compute-cli deposit --amount 10

# Transfer to provider
0g-compute-cli transfer-fund --provider <PROVIDER_ADDRESS> --amount 5

# Verify provider TEE status before using
0g-compute-cli inference verify --provider <PROVIDER_ADDRESS>
```

---

## 8. INFT Agent Identity

Each agent mints an INFT (Intelligent NFT) using 0G's ERC-7857 standard. This is their permanent on-chain identity — carries their encrypted capabilities, is transferable if the owner sells, and is linked to their behavioral history.

### Setup

```bash
npm install @openzeppelin/contracts ethers hardhat
```

### INFT Contract (extends 0G's ERC-7857)

```solidity
// contracts/CrucibleINFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IOracle {
    function verifyProof(bytes calldata proof) external view returns (bool);
}

contract CrucibleINFT is ERC721, Ownable, ReentrancyGuard {

    struct AgentMetadata {
        bytes32 metadataHash;       // hash of encrypted capability data
        string encryptedURI;        // 0G Storage URI of encrypted agent config
        uint256 mintedAt;
        bool isActive;
    }

    mapping(uint256 => AgentMetadata) private _agentMetadata;
    mapping(uint256 => mapping(address => bytes)) private _authorizations;

    address public oracle;
    uint256 private _nextTokenId = 1;
    uint256 public mintFee = 0.001 ether;

    event AgentMinted(uint256 indexed tokenId, address indexed owner);
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash);
    event UsageAuthorized(uint256 indexed tokenId, address indexed executor);

    constructor(address _oracle) ERC721("Crucible Agent", "CRAG") Ownable(msg.sender) {
        oracle = _oracle;
    }

    function mintAgent(
        address to,
        string calldata encryptedURI,
        bytes32 metadataHash
    ) external payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        _agentMetadata[tokenId] = AgentMetadata({
            metadataHash: metadataHash,
            encryptedURI: encryptedURI,
            mintedAt: block.timestamp,
            isActive: true
        });

        emit AgentMinted(tokenId, to);
        return tokenId;
    }

    // Owner can update metadata (when agent learns new capabilities)
    function updateMetadata(
        uint256 tokenId,
        string calldata newEncryptedURI,
        bytes32 newMetadataHash,
        bytes calldata oracleProof
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IOracle(oracle).verifyProof(oracleProof), "Invalid oracle proof");

        _agentMetadata[tokenId].encryptedURI = newEncryptedURI;
        _agentMetadata[tokenId].metadataHash = newMetadataHash;

        emit MetadataUpdated(tokenId, newMetadataHash);
    }

    // Grant usage rights to an executor (e.g. task assignment engine)
    function authorizeUsage(
        uint256 tokenId,
        address executor,
        bytes calldata authData
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _authorizations[tokenId][executor] = authData;
        emit UsageAuthorized(tokenId, executor);
    }

    function getMetadata(uint256 tokenId) external view returns (AgentMetadata memory) {
        return _agentMetadata[tokenId];
    }

    function isAuthorized(uint256 tokenId, address executor) external view returns (bool) {
        return _authorizations[tokenId][executor].length > 0;
    }
}
```

### Minting an Agent (TypeScript)

```typescript
// scripts/mintAgent.ts
import { ethers } from 'ethers';
import { StorageService } from '../services/storageService';
import CrucibleINFT from '../artifacts/contracts/CrucibleINFT.sol/CrucibleINFT.json';

async function mintAgent(
  agentName: string,
  capabilities: string[],
  privateKey: string
) {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const signer = new ethers.Wallet(privateKey, provider);
  const storageService = new StorageService(privateKey);

  // 1. Create initial history on 0G Storage
  const initialHistory = {
    agentId: await signer.getAddress(),
    inftTokenId: 0, // will update after mint
    version: 1,
    updatedAt: Math.floor(Date.now() / 1000),
    totalTasks: 0,
    completedHonestly: 0,
    totalSlashEvents: 0,
    totalDisputes: 0,
    recentWindow: [],
    avgResponseTimeMs: 0,
    taskHistory: []
  };

  const historyHash = await storageService.uploadHistory(initialHistory);

  // 2. Create encrypted metadata URI
  const metadata = {
    name: agentName,
    capabilities,
    historyHash,
    created: Date.now()
  };
  const metadataHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(metadata))
  );
  const encryptedURI = await storageService.uploadTaskCriteria(metadata as any);

  // 3. Mint INFT
  const inftContract = new ethers.Contract(
    process.env.INFT_CONTRACT_ADDRESS!,
    CrucibleINFT.abi,
    signer
  );

  const tx = await inftContract.mintAgent(
    await signer.getAddress(),
    encryptedURI,
    metadataHash,
    { value: ethers.parseEther('0.001') }
  );

  const receipt = await tx.wait();
  const event = receipt.logs.find(
    (log: any) => log.fragment?.name === 'AgentMinted'
  );
  const tokenId = event?.args[0];

  console.log(`Agent minted. Token ID: ${tokenId}`);

  // 4. Register on AgentRegistry
  const registryContract = new ethers.Contract(
    process.env.REGISTRY_CONTRACT_ADDRESS!,
    AgentRegistryABI,
    signer
  );

  await registryContract.registerAgent(
    await signer.getAddress(),
    tokenId,
    historyHash,
    capabilities
  );

  console.log(`Agent registered on AgentRegistry`);
  return { tokenId, historyHash };
}
```

---

## 9. Task Assignment Engine

This is the off-chain Node.js backend. It reads on-chain agent data, fetches histories from 0G Storage, runs the trust scoring, assigns agents, collects outputs, verifies against criteria, and calls SlashingJudge.

```typescript
// engine/assignmentEngine.ts
import { ethers } from 'ethers';
import { StorageService } from '../services/storageService';
import { ComputeService } from '../services/computeService';
import { TrustScorer } from './trustScorer';

export class AssignmentEngine {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private registryContract: ethers.Contract;
  private escrowContract: ethers.Contract;
  private judgeContract: ethers.Contract;
  private storageService: StorageService;
  private computeService: ComputeService;
  private trustScorer: TrustScorer;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    // Initialize contracts...
    this.storageService = new StorageService(process.env.PRIVATE_KEY!);
    this.computeService = new ComputeService();
    this.trustScorer = new TrustScorer();
  }

  async assignAgentsForTask(taskId: string): Promise<void> {
    // 1. Get task criteria
    const [,,,, , criteriaURI] = await this.escrowContract.getTaskBasic(taskId);
    const criteria = await this.storageService.downloadHistory(criteriaURI) as any;

    // 2. Find agents with required capabilities
    const requiredCaps = criteria.requiredCapabilities as string[];
    let candidates: string[] = [];

    for (const cap of requiredCaps) {
      const capAgents = await this.registryContract.getAgentsByCapability(cap);
      candidates = [...new Set([...candidates, ...capAgents])];
    }

    // 3. Score each candidate
    const scoredAgents = await this.scoreAgents(candidates);

    // 4. Select best agents — one per required capability
    const selected = this.selectBestAgents(scoredAgents, requiredCaps);

    // 5. Calculate required stakes
    const stakes = selected.map(a => a.minStakeRequired);
    const totalStake = stakes.reduce((sum, s) => sum + BigInt(s), BigInt(0));

    // 6. Assign on-chain
    const tx = await this.escrowContract.assignAgents(
      taskId,
      selected.map(a => a.address),
      stakes,
      { value: totalStake }
    );
    await tx.wait();

    console.log(`Assigned ${selected.length} agents to task ${taskId}`);
  }

  private async scoreAgents(agentAddresses: string[]) {
    return Promise.all(agentAddresses.map(async (address) => {
      const agentData = await this.registryContract.getAgent(address);
      const history = await this.storageService.downloadHistory(
        agentData.historyRootHash
      );
      const score = this.trustScorer.calculateScore(history);

      return {
        address,
        score,
        trustTier: agentData.trustTier,
        minStakeRequired: agentData.minStakeRequired,
        capabilities: agentData.capabilities,
        history
      };
    }));
  }

  private selectBestAgents(scored: any[], requiredCaps: string[]) {
    const selected: any[] = [];

    for (const cap of requiredCaps) {
      const eligible = scored
        .filter(a => a.capabilities.includes(cap))
        .filter(a => !selected.includes(a))  // don't select same agent twice
        .sort((a, b) => b.score - a.score);

      if (eligible.length > 0) {
        selected.push(eligible[0]);
      }
    }

    return selected;
  }

  async processTaskOutputs(taskId: string): Promise<void> {
    // Get task info
    const [,,,, criteriaHash, criteriaURI] = await this.escrowContract.getTaskBasic(taskId);
    const [agents] = await this.escrowContract.getTaskAgents(taskId);
    const criteria = await this.storageService.downloadHistory(criteriaURI) as any;

    const criteriaResults: boolean[] = [];
    const newHistoryHashes: string[] = [];
    const newBehaviorData: bigint[] = [];

    for (const agentAddress of agents) {
      const agentData = await this.registryContract.getAgent(agentAddress);
      const history = await this.storageService.downloadHistory(agentData.historyRootHash);

      // Get submitted output hash from events/contract
      // Verify output against criteria
      const passed = await this.verifyCriteria(agentAddress, taskId, criteria.criteria);
      criteriaResults.push(passed);

      // Update history
      const { newHash, updatedHistory } = await this.storageService.updateAgentHistory(
        agentData.historyRootHash,
        {
          taskId,
          passed,
          collaborators: agents.filter((a: string) => a !== agentAddress),
          outputHash: '',
          paymentReceived: '0'
        }
      );
      newHistoryHashes.push(newHash);

      // Pack behavior data
      newBehaviorData.push(
        BigInt(updatedHistory.totalTasks),
        BigInt(updatedHistory.completedHonestly),
        BigInt(updatedHistory.recentWindow.reduce((a: number, b: number) => a + b, 0)),
        BigInt(updatedHistory.totalSlashEvents)
      );
    }

    // Call SlashingJudge
    const tx = await this.judgeContract.judgeTask(
      taskId,
      agents,
      [],  // attestations — fetched from events
      [],  // output summaries
      criteriaResults,
      newHistoryHashes,
      newBehaviorData
    );
    await tx.wait();

    console.log(`Task ${taskId} judged. Results:`, criteriaResults);
  }

  private async verifyCriteria(
    agentAddress: string,
    taskId: string,
    criteria: any[]
  ): Promise<boolean> {
    // Fetch output from 0G Storage using the hash submitted on-chain
    // Check each criterion
    // For demo: simple checks like wordCount, sourceCount, etc.

    let passedCount = 0;
    let totalWeight = 0;

    for (const criterion of criteria) {
      totalWeight += criterion.weight;
      // ... evaluate criterion against output
      // This is where your criteria checking logic goes
    }

    return passedCount / totalWeight >= 0.7; // 70% criteria met = pass
  }
}
```

---

## 10. Trust & Behavioral Model

The trust scoring logic. This is the game theory part — Bayesian Tit-for-Tat.

```typescript
// engine/trustScorer.ts
import { AgentHistory } from '../types';

export class TrustScorer {

  // Returns score 0-1
  calculateScore(history: AgentHistory): number {
    if (history.totalTasks < 3) return 0.5; // neutral for new agents

    const lifetimeRate = history.completedHonestly / history.totalTasks;

    // Recent window: sum of last 10 results
    const recentRate = history.recentWindow.length > 0
      ? history.recentWindow.reduce((a, b) => a + b, 0) / history.recentWindow.length
      : 0.5;

    // 60% recent, 40% lifetime — recent behavior matters more
    const weightedScore = (recentRate * 0.6) + (lifetimeRate * 0.4);

    // Slash penalty — each slash reduces score by 5%
    const slashPenalty = history.totalSlashEvents * 0.05;

    return Math.max(0, Math.min(1, weightedScore - slashPenalty));
  }

  // Returns stake multiplier (1.0 = base, 2.5 = 2.5x base stake)
  getStakeMultiplier(score: number): number {
    if (score >= 0.95) return 0.5;   // elite
    if (score >= 0.85) return 0.75;  // high trust
    if (score >= 0.70) return 1.0;   // moderate
    if (score >= 0.50) return 1.5;   // low trust
    return 2.5;                       // new/bad actor
  }

  // Calculate required stake for a given agent and base stake
  calculateRequiredStake(history: AgentHistory, baseStake: bigint): bigint {
    const score = this.calculateScore(history);
    const multiplier = this.getStakeMultiplier(score);
    return BigInt(Math.floor(Number(baseStake) * multiplier));
  }

  // Tit-for-Tat decision: should we cooperate with this agent on next task?
  shouldCooperate(history: AgentHistory): boolean {
    if (history.recentWindow.length === 0) return true; // cooperate first

    // Mirror last action — if they cooperated last time, cooperate
    const lastAction = history.recentWindow[history.recentWindow.length - 1];
    return lastAction === 1;
  }

  // Get tier label for display
  getTierLabel(score: number): string {
    if (score >= 0.95) return 'Elite';
    if (score >= 0.85) return 'High Trust';
    if (score >= 0.70) return 'Moderate';
    if (score >= 0.50) return 'Low Trust';
    return 'New / Unverified';
  }

  getTierColor(score: number): string {
    if (score >= 0.95) return '#FFD700'; // gold
    if (score >= 0.85) return '#4CAF50'; // green
    if (score >= 0.70) return '#2196F3'; // blue
    if (score >= 0.50) return '#FF9800'; // orange
    return '#9E9E9E';                    // grey
  }
}
```

---

## 11. Demo Agents

Three sample agents that use 0G Compute. These are your "Pokemon" for the hackathon demo. They demonstrate the full system working end to end.

```typescript
// agents/researchAgent.ts
import { ComputeService } from '../services/computeService';

export class ResearchAgent {
  private computeService: ComputeService;
  readonly capabilities = ['research'];
  readonly agentAddress: string;

  constructor(address: string) {
    this.agentAddress = address;
    this.computeService = new ComputeService();
  }

  async execute(taskInput: {
    topic: string;
    taskId: string;
    minSources: number;
    minWords: number;
  }): Promise<{
    content: string;
    sources: string[];
    wordCount: number;
    outputHash: string;
    attestation: any;
  }> {

    const systemPrompt = `You are a research agent. Your job is to research a topic and return
    structured findings. Always include at least ${taskInput.minSources} distinct sources.
    Your response must be at least ${taskInput.minWords} words.
    Format your response as JSON with fields: summary, sources (array), wordCount.`;

    const result = await this.computeService.runAgentInference(
      systemPrompt,
      `Research topic: ${taskInput.topic}`,
      taskInput.taskId,
      this.agentAddress
    );

    const parsed = JSON.parse(result.output);

    return {
      content: parsed.summary,
      sources: parsed.sources,
      wordCount: parsed.wordCount,
      outputHash: result.output, // will be stored on 0G Storage
      attestation: result.attestation
    };
  }
}
```

```typescript
// agents/writingAgent.ts
export class WritingAgent {
  readonly capabilities = ['writing'];

  async execute(taskInput: {
    researchOutput: string;
    taskId: string;
    targetWords: number;
  }) {
    // Takes research output, produces polished written piece
    // Uses 0G Compute for verified inference
    // Returns output + attestation
  }
}
```

```typescript
// agents/badActorAgent.ts
// This one deliberately delivers poor quality outputs sometimes
// Used in demo to show slashing working in real time
export class BadActorAgent {
  readonly capabilities = ['research'];
  private defectionRate = 0.4; // defects 40% of the time

  async execute(taskInput: any) {
    const shouldDefect = Math.random() < this.defectionRate;

    if (shouldDefect) {
      // Return garbage output that won't meet criteria
      return {
        content: 'insufficient output',
        sources: [],
        wordCount: 2,
        outputHash: 'garbage',
        attestation: null
      };
    }

    // Honest output
    return new ResearchAgent(this.agentAddress).execute(taskInput);
  }
}
```

---

## 12. Arena Frontend

Next.js app. The visual layer that makes everything watchable.

### Key Pages

```
/                 → Arena overview (all agents, live activity)
/agents           → Agent leaderboard with trust scores
/agents/[id]      → Individual agent profile and history chart
/tasks            → Live task feed
/tasks/[id]       → Task detail with criteria and outcomes
/stake            → Register and stake a new agent
```

### Arena Component

```tsx
// components/Arena.tsx
'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useContractEvent } from 'wagmi';

interface AgentCard {
  address: string;
  trustTier: number;
  score: number;
  recentWindow: number[];
  currentTask: string | null;
  isSlashed: boolean;
  totalTasks: number;
}

export default function Arena() {
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);

  // Listen to contract events for real-time updates
  useContractEvent({
    address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`,
    abi: AgentRegistryABI,
    eventName: 'TrustTierUpdated',
    listener(agentAddress, oldTier, newTier) {
      setAgents(prev => prev.map(a =>
        a.address === agentAddress
          ? { ...a, trustTier: Number(newTier) }
          : a
      ));
      addEvent({ type: 'TIER_CHANGE', agentAddress, oldTier, newTier });
    }
  });

  useContractEvent({
    address: process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`,
    abi: TaskEscrowABI,
    eventName: 'AgentSlashed',
    listener(taskId, agentAddress, amount) {
      setAgents(prev => prev.map(a =>
        a.address === agentAddress
          ? { ...a, isSlashed: true }
          : a
      ));
      addEvent({ type: 'SLASH', agentAddress, amount: ethers.formatEther(amount) });

      // Reset slashed visual after 3 seconds
      setTimeout(() => {
        setAgents(prev => prev.map(a =>
          a.address === agentAddress ? { ...a, isSlashed: false } : a
        ));
      }, 3000);
    }
  });

  const addEvent = (event: any) => {
    setRecentEvents(prev => [
      { ...event, timestamp: Date.now() },
      ...prev.slice(0, 19) // keep last 20
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-2">Crucible Arena</h1>
      <p className="text-gray-400 mb-8">
        Live agent coordination — honest behavior wins
      </p>

      <div className="grid grid-cols-12 gap-6">

        {/* Agent Grid */}
        <div className="col-span-8">
          <h2 className="text-lg font-semibold mb-4">Active Agents</h2>
          <div className="grid grid-cols-3 gap-4">
            {agents.map(agent => (
              <AgentCard key={agent.address} agent={agent} />
            ))}
          </div>
        </div>

        {/* Live Events Feed */}
        <div className="col-span-4">
          <h2 className="text-lg font-semibold mb-4">Live Events</h2>
          <div className="space-y-2">
            {recentEvents.map((event, i) => (
              <EventRow key={i} event={event} />
            ))}
          </div>
        </div>

        {/* Active Tasks */}
        <div className="col-span-12 mt-6">
          <h2 className="text-lg font-semibold mb-4">Active Tasks</h2>
          <div className="grid grid-cols-3 gap-4">
            {activeTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// components/AgentCard.tsx
interface AgentCardProps {
  agent: AgentCard;
}

const TIER_COLORS = ['#9E9E9E', '#FF9800', '#2196F3', '#4CAF50', '#FFD700'];
const TIER_LABELS = ['New', 'Low', 'Moderate', 'High', 'Elite'];

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className={`
      rounded-xl border p-4 transition-all duration-500
      ${agent.isSlashed
        ? 'border-red-500 bg-red-950 animate-pulse'
        : 'border-gray-700 bg-gray-900'}
    `}>
      {/* Address */}
      <p className="text-xs text-gray-400 font-mono mb-2">
        {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
      </p>

      {/* Trust Tier Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: TIER_COLORS[agent.trustTier] }}
        />
        <span className="text-sm font-medium">
          {TIER_LABELS[agent.trustTier]}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          {(agent.score * 100).toFixed(1)}%
        </span>
      </div>

      {/* Recent Window (last 10 tasks) */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 10 }).map((_, i) => {
          const result = agent.recentWindow[i];
          return (
            <div
              key={i}
              className={`w-4 h-4 rounded-sm ${
                result === undefined ? 'bg-gray-700' :
                result === 1 ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          );
        })}
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <p className="text-xs text-blue-400">
          Working on task {agent.currentTask.slice(0, 8)}...
        </p>
      )}

      {/* Slashed indicator */}
      {agent.isSlashed && (
        <p className="text-xs text-red-400 font-bold mt-1">⚡ SLASHED</p>
      )}

      {/* Stats */}
      <p className="text-xs text-gray-500 mt-2">
        {agent.totalTasks} tasks completed
      </p>
    </div>
  );
}
```

---

## 13. Full Data Flow End to End

This is every single step in order when a task runs through the system:

```
1. TASK POSTER
   └─ Calls TaskEscrow.postTask(deadline, criteriaHash, criteriaURI)
   └─ Sends ETH payment with transaction
   └─ Task stored on-chain with status OPEN

2. CRITERIA STORAGE
   └─ Before posting, task poster uploads criteria JSON to 0G Storage
   └─ Gets back root hash → this becomes criteriaURI in the contract
   └─ criteriaHash = keccak256(criteria JSON) → stored on-chain for reference

3. ASSIGNMENT ENGINE (off-chain, Node.js, polling for OPEN tasks)
   └─ Detects new OPEN task via event or polling
   └─ Fetches required capabilities from criteria
   └─ Calls AgentRegistry.getAgentsByCapability() for each required cap
   └─ Fetches history JSON from 0G Storage for each candidate agent
   └─ Runs TrustScorer.calculateScore() on each history
   └─ Selects best agent per required capability
   └─ Calculates required stake per agent using TrustScorer.calculateRequiredStake()
   └─ Calls TaskEscrow.assignAgents() with selected agents + stakes
      (engine deposits stakes on behalf of agents from a pre-funded pool)
   └─ Task status → ASSIGNED

4. AGENTS EXECUTE (automated, triggered by assignment event)
   └─ Each agent detects they've been assigned via event
   └─ Fetches task criteria from 0G Storage using criteriaURI
   └─ Calls 0G Compute with their inference request
   └─ Gets back: output content + TEE attestation
   └─ Uploads output to 0G Storage → gets output root hash
   └─ Calls TaskEscrow.submitOutput(taskId, outputHash, attestation)
   └─ When all agents submit → task status → VERIFYING

5. VERIFICATION (off-chain engine + on-chain judge)
   └─ Engine detects VERIFYING status
   └─ Fetches each agent's output from 0G Storage
   └─ Verifies TEE attestation using 0G broker
   └─ Checks output against each criterion (wordCount >= 500, sourceCount >= 5, etc.)
   └─ Fetches current history for each agent
   └─ Updates each history file with task result
   └─ Uploads updated histories to 0G Storage → gets new root hashes
   └─ Calls SlashingJudge.judgeTask() with:
      - criteriaResults[] (per agent pass/fail)
      - newHistoryHashes[] (new 0G Storage hashes)
      - newBehaviorData[] (totalTasks, honestCount, recentSum, slashCount per agent)

6. SLASHING JUDGE (on-chain)
   └─ Calls TaskEscrow.resolveTask()
      → Passing agents: receive stake back + payment share
      → Failing agents: stake slashed (stays in contract)
   └─ Calls AgentRegistry.updateHistoryAndTrust() for each agent
      → New history root hash stored on-chain
      → TrustCalculator.calculateTrustTier() called
      → New trust tier + stake requirement set

7. ARENA FRONTEND
   └─ Receives TrustTierUpdated event → updates agent card
   └─ Receives AgentSlashed event → flashes red on agent card
   └─ Receives TaskCompleted event → marks task done
   └─ Everything visible in real time
```

---

## 14. Project Structure

```
crucible/
├── contracts/
│   ├── AgentRegistry.sol
│   ├── TaskEscrow.sol
│   ├── TrustCalculator.sol
│   ├── SlashingJudge.sol
│   └── CrucibleINFT.sol
│
├── scripts/
│   ├── deploy.ts              ← deploy all contracts in order
│   ├── mintAgent.ts           ← mint demo agents
│   ├── postDemoTask.ts        ← post a task for demo
│   └── verify.ts              ← verify contracts on explorer
│
├── engine/
│   ├── assignmentEngine.ts    ← main orchestrator
│   ├── trustScorer.ts         ← Bayesian scoring logic
│   ├── criteriaChecker.ts     ← output verification logic
│   └── eventListener.ts       ← listens to contract events
│
├── agents/
│   ├── researchAgent.ts
│   ├── writingAgent.ts
│   └── badActorAgent.ts       ← deliberately bad for demo
│
├── services/
│   ├── storageService.ts      ← 0G Storage read/write
│   └── computeService.ts      ← 0G Compute + TEE
│
├── types/
│   └── index.ts
│
├── frontend/                  ← Next.js app
│   ├── app/
│   │   ├── page.tsx           ← Arena overview
│   │   ├── agents/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── tasks/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── components/
│   │   ├── Arena.tsx
│   │   ├── AgentCard.tsx
│   │   ├── TaskCard.tsx
│   │   ├── EventFeed.tsx
│   │   └── TrustChart.tsx     ← recharts graph of trust score over time
│   └── lib/
│       ├── contracts.ts       ← contract instances + ABIs
│       └── wagmi.ts           ← wagmi config
│
├── test/
│   ├── AgentRegistry.test.ts
│   ├── TaskEscrow.test.ts
│   ├── TrustCalculator.test.ts
│   └── SlashingJudge.test.ts
│
├── hardhat.config.js
├── .env.example
└── package.json
```

---

## 15. Dependencies

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
    "ts-node": "^10.9.0"
  }
}
```

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
    "tailwindcss": "^3.3.0"
  }
}
```

---

## 16. Development Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Environment setup, contract skeleton | All 4 contracts deployed on testnet, AgentRegistry working |
| 2 | Storage integration, INFT minting | Agents registerable, history readable/writable from 0G Storage |
| 3 | Compute integration, TEE verification | Inference calls working, attestations returned and parseable |
| 4 | Assignment engine + SlashingJudge | Full task lifecycle working end-to-end in terminal |
| 5 | Demo agents + bad actor | 3 agents working, bad actor demonstrably gets slashed |
| 6 | Frontend arena + polish | Arena live, events updating in real time, demo rehearsed |

---

## 17. Environment Variables

```bash
# .env

# 0G Network
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_CHAIN_ID=16602
OG_STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai

# Wallet
PRIVATE_KEY=your_private_key_here

# Deployed Contract Addresses (fill in after deployment)
INFT_CONTRACT_ADDRESS=
REGISTRY_CONTRACT_ADDRESS=
ESCROW_CONTRACT_ADDRESS=
CALCULATOR_CONTRACT_ADDRESS=
JUDGE_CONTRACT_ADDRESS=

# 0G Compute
OG_COMPUTE_PROVIDER_ADDRESS=0xa48f01...   # from testnet services list
OG_MODEL=qwen-2.5-7b-instruct            # testnet model

# Frontend (prefix with NEXT_PUBLIC_)
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_REGISTRY_ADDRESS=
NEXT_PUBLIC_ESCROW_ADDRESS=
NEXT_PUBLIC_JUDGE_ADDRESS=
```

---

## 18. Testing Strategy

### Contract Tests (Hardhat)

```typescript
// test/TrustCalculator.test.ts
describe('TrustCalculator', () => {
  it('returns tier 0 for new agent with < 3 tasks', async () => {
    expect(await calculator.calculateTrustTier(2, 2, 2, 0)).to.equal(0);
  });

  it('returns tier 4 for agent with 95%+ weighted score', async () => {
    // 10 tasks all passed, recent window all 1s
    expect(await calculator.calculateTrustTier(10, 10, 10, 0)).to.equal(4);
  });

  it('drops tier when slash events accumulate', async () => {
    // Perfect history but 3 slashes
    const tier = await calculator.calculateTrustTier(10, 10, 10, 3);
    expect(tier).to.be.lessThan(4);
  });
});
```

### Demo Scenarios to Rehearse

1. **Clean run:** 2 honest agents complete a task → both get paid, trust tiers increase
2. **Bad actor caught:** 1 honest + 1 bad actor → bad actor slashed in real time on arena
3. **Repeat offender:** Same bad actor runs 3 more tasks → stake requirement visibly increases each time, gets worse terms
4. **Recovery:** Bad actor goes honest for 5 tasks → trust score visibly recovers

---

## 19. Known Hard Parts

| Problem | Reality | How to Handle |
|---------|---------|---------------|
| TEE attestation format | 0G's attestation format may not be directly verifiable on-chain via simple Solidity — you may need to verify off-chain and pass result to contract | Verify attestation off-chain in engine, pass boolean + signed digest to contract |
| Criteria checking is subjective for quality | "Is this research good?" can't be checked by code | Stick to objective criteria only: wordCount, sourceCount, JSON validity, response time. Avoid quality judgment in MVP |
| 0G Storage root hash length | bytes32 may not fit full 0G hash format — check exact format in SDK | Use string type instead of bytes32 if needed, or hash the string to bytes32 |
| Faucet limit | Only 0.1 OG per day on testnet | Use Google Cloud faucet as backup, ask in 0G Discord for more |
| Assignment engine authorization | Contract needs to trust your engine address | Hardcode engine address in constructor, add setAssignmentEngine() function for updates |
| Frontend real-time events | WebSocket connections to RPC can be flaky | Use polling as fallback if event listeners drop |

---

*Built for 0G x HackQuest APAC Hackathon 2026 — Deadline May 9, 2026*