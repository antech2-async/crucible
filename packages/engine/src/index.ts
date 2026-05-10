import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESSES,
  TASK_ESCROW_ABI,
  AGENT_REGISTRY_ABI,
  SLASHING_JUDGE_ABI,
  StorageService,
} from '@crucible/shared';

import { setupEthersWorkaround } from '../../shared/src/node-utils';
import { AssignmentEngine } from './assignmentEngine';

setupEthersWorkaround();

/**
 * Crucible Broker Engine
 * The 'Brain' that coordinates assignments and verifies work objectivity.
 */
class BrokerEngine {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private escrow: ethers.Contract;
  private registry: ethers.Contract;
  private judge: ethers.Contract;

  private assignmentEngine: AssignmentEngine;
  private storageService: StorageService;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);

    this.escrow = new ethers.Contract(CONTRACT_ADDRESSES.TASK_ESCROW, TASK_ESCROW_ABI, this.signer);
    this.registry = new ethers.Contract(
      CONTRACT_ADDRESSES.AGENT_REGISTRY,
      AGENT_REGISTRY_ABI,
      this.signer,
    );
    this.judge = new ethers.Contract(
      CONTRACT_ADDRESSES.SLASHING_JUDGE,
      SLASHING_JUDGE_ABI,
      this.signer,
    );

    this.assignmentEngine = new AssignmentEngine();
    this.storageService = new StorageService(process.env.PRIVATE_KEY!);
  }

  public async start() {
    console.log('--- Crucible Broker Engine Initialized ---');
    console.log(`Monitoring 0G Testnet for Task Coordination (Event-Driven)...`);

    // Use the event-driven AssignmentEngine
    this.assignmentEngine.startListening();

    // Poll for tasks that need verification (VERIFYING -> JUDGED/COMPLETED)
    setInterval(() => this.pollTasks(), 5000);
  }

  private async pollTasks() {
    const taskCount = await this.escrow.taskCount();

    for (let i = 0; i < Number(taskCount); i++) {
      try {
        const taskBasic = await this.escrow.getTaskBasic(i);
        const status = Number(taskBasic[3]); // status is the 4th returned value

        // Assignment is handled exclusively by AssignmentEngine (Event-Driven)
        // 1. Verification Logic (VERIFYING -> JUDGED)
        if (status === 3) {
          // TaskStatus.VERIFYING
          await this.verifyTask(i);
        }
      } catch (err) {
        // Silently continue polling next task if one fails
        console.debug(`Error polling task ${i}:`, err);
      }
    }
  }

  private async assignTask(taskId: number) {
    console.log(`[Assigner] Matching agents for Task #${taskId}...`);

    // In a real production engine, we would read the criteriaURI from 0G Storage
    // and match agents based on required capabilities.
    // For the demo, we pick from our canonical pool: Alice & BadBot.
    const agentAddresses = await this.registry.getAgentList();
    if (agentAddresses.length < 2) return;

    // Pick top 2 for the task (simplified assignment)
    const candidates = [agentAddresses[0], agentAddresses[agentAddresses.length - 1]];
    const stakes = [ethers.parseEther('0.05'), ethers.parseEther('0.1')]; // BadBot gets a high stake requirement

    console.log(`    Assigning Agents: ${candidates}`);
    const tx = await this.escrow.assignAgents(taskId, candidates, stakes);
    await tx.wait();
    console.log(`    Task #${taskId} successfully transitioned to ASSIGNED.`);
  }

  private async verifyTask(taskId: number) {
    console.log(`[Judge] Verifying outputs for Task #${taskId}...`);

    const [agents] = await this.escrow.getTaskAgents(taskId);
    const passed: boolean[] = [];
    const auditResults: any[] = [];

    for (const agent of agents) {
      const outputHash = await this.escrow.agentOutputHashes(taskId, agent);
      // Realistic Handoff: Fetch from REAL 0G Storage
      let content = 'SIMULATED_CONTENT: Data retrieval in progress...';
      try {
          content = await this.storageService.downloadJSON<string>(outputHash);
      } catch (e) {
          console.warn(`    [Audit] Fallback: Could not fetch real 0G data for ${outputHash.slice(0,10)}`);
      }
      console.log(`    [Audit] Fetched output for ${agent.slice(0, 8)}... (Hash: ${outputHash.slice(0, 10)}...)`);

      // --- OBJECTIVE CRITERIA INSPECTION ---
      const reasons: string[] = [];

      // 1. Length Check (Spec Section 17)
      const wordCount = content.split(' ').length;
      if (wordCount <= 10) reasons.push("Inadequate detail (word count < 10)");

      // 2. Consistency Check
      if (content.includes('SIMULATED_CONTENT')) reasons.push("Placeholder content detected");

      // 3. Address Override (Manual Slashing Demo)
      const isBadBot = agent.toLowerCase() === process.env.BADBOT_ADDRESS?.toLowerCase();
      if (isBadBot) reasons.push("Identified as known malicious defector (Override)");

      const isPassed = reasons.length === 0;
      passed.push(isPassed);
      const verdict = isPassed ? 'PASS ✅' : `FAIL ❌ (${reasons.join(', ')})`;
      console.log(`    [Audit] Agent ${agent.slice(0, 10)}...: ${verdict}`);
      
      // Store individual agent result for UI transparency
      auditResults.push({
        agent,
        passed: isPassed,
        reasons,
        outputHash
      });
    }

    // Upload the final Audit Report for the UI to find
    const auditReport = {
      taskId,
      timestamp: Date.now(),
      results: auditResults,
    };
    const { rootHash: auditHash } = await this.storageService.uploadJSON(auditReport);
    console.log(`    [Audit] Verdict report committed to 0G Storage: ${auditHash}`);

    const historyHashes: string[] = [];
    const behaviorData: bigint[] = [];

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const isPassed = passed[i];
      
      console.log(`    [History] Updating decentralized log for ${agent.slice(0, 8)}...`);
      const agentData = await this.registry.getAgent(agent);
      
      const { newHash } = await this.storageService.updateAgentHistory(
        agentData.historyRootHash,
        {
            taskId: taskId.toString(),
            passed: isPassed,
            collaborators: agents.filter((a: string) => a !== agent),
            outputHash: auditResults[i].outputHash,
            paymentReceived: isPassed ? "0.01" : "0", // Simulating payment record
        },
        auditHash
      );
      
      historyHashes.push(newHash);
      behaviorData.push(10n, isPassed ? 9n : 4n, 10n, isPassed ? 0n : 1n);
    }

    console.log(`    [Judge] Committing judgment to blockchain...`);
    const tx = await this.judge.judgeTask(taskId, [...agents], passed, historyHashes, behaviorData);
    await tx.wait();
    console.log(`    Task #${taskId} RESOLVED and trust scores updated.`);
  }
}

const engine = new BrokerEngine();
engine.start().catch(console.error);
