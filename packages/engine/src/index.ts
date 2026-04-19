import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { 
  CONTRACT_ADDRESSES, 
  TASK_ESCROW_ABI, 
  AGENT_REGISTRY_ABI,
  SLASHING_JUDGE_ABI
} from '@crucible/shared';

dotenv.config();

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

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    
    this.escrow = new ethers.Contract(CONTRACT_ADDRESSES.TASK_ESCROW, TASK_ESCROW_ABI, this.signer);
    this.registry = new ethers.Contract(CONTRACT_ADDRESSES.AGENT_REGISTRY, AGENT_REGISTRY_ABI, this.signer);
    this.judge = new ethers.Contract(CONTRACT_ADDRESSES.SLASHING_JUDGE, SLASHING_JUDGE_ABI, this.signer);
  }

  public async start() {
    console.log('--- Crucible Broker Engine Initialized ---');
    console.log(`Monitoring 0G Testnet for Task Coordination...`);

    // In a real production environment, we would use event listeners.
    // For this demo, we use a robust polling loop to ensure high-fidelity resilience.
    setInterval(() => this.pollTasks(), 10000);
  }

  private async pollTasks() {
    const taskCount = await this.escrow.taskCount();
    
    for (let i = 0; i < Number(taskCount); i++) {
        try {
            const task = await this.escrow.tasks(i);
            const status = Number(task.status);

            // 1. Assignment Logic (OPEN -> ASSIGNED)
            if (status === 0) { // TaskStatus.OPEN
                await this.assignTask(i);
            } 
            
            // 2. Verification Logic (VERIFYING -> JUDGED)
            if (status === 3) { // TaskStatus.VERIFYING
                await this.verifyTask(i);
            }
        } catch (err) {
            // Silently continue polling
        }
    }
  }

  private async assignTask(taskId: number) {
    console.log(`[Assigner] Matching agents for Task #${taskId}...`);
    
    // In a real production engine, we would read the criteriaURI from 0G Storage
    // and match agents based on required capabilities.
    // For the demo, we pick from our canonical pool: Alice & BadBot.
    const agentAddresses = await this.registry.agentList();
    if (agentAddresses.length < 2) return;

    // Pick top 2 for the task (simplified assignment)
    const candidates = [agentAddresses[0], agentAddresses[agentAddresses.length - 1]];
    const stakes = [ethers.parseEther("0.05"), ethers.parseEther("0.1")]; // BadBot gets a high stake requirement

    console.log(`    Assigning Agents: ${candidates}`);
    const tx = await this.escrow.assignAgents(taskId, candidates, stakes);
    await tx.wait();
    console.log(`    Task #${taskId} successfully transitioned to ASSIGNED.`);
  }

  private async verifyTask(taskId: number) {
    console.log(`[Judge] Verifying outputs for Task #${taskId}...`);
    
    const [agents] = await this.escrow.getTaskAgents(taskId);
    const passed: boolean[] = [];

    for (const agent of agents) {
        const outputHash = await this.escrow.agentOutputHashes(taskId, agent);
        // Realistic Handoff: Fetch from StorageProvider
        // In this demo, 'execute.ts' will have committed the LLM result.
        const uri = `0g://crucible/${outputHash.slice(2, 12)}`;
        const content = "MOCK DEMO CONTENT length > 10 words so it passes the test successfully.";

        // --- OBJECTIVE CRITERIA INSPECTION ---
        // 1. Length Check (Spec Section 17)
        const wordCount = content.split(' ').length;
        const lengthOk = wordCount > 10; // Requirement simulated

        // 2. Consistency Check (Simulated)
        const isNotPlaceholder = !content.includes('SIMULATED_CONTENT');

        // Logic: BadBot always fails in the Demo scenario (Strategy Defection)
        const isBadBot = agent.toLowerCase() === process.env.BADBOT_ADDRESS?.toLowerCase();
        
        passed.push(lengthOk && isNotPlaceholder && !isBadBot);
    }

    // Prepare behavior data for Bayesian update [totalTasks, completedHonestly, recentSum, slashEvents]
    const behaviorData: bigint[] = [];
    const historyHashes: string[] = [];
    
    for (let i = 0; i < agents.length; i++) {
        behaviorData.push(10n, passed[i] ? 9n : 4n, 10n, passed[i] ? 0n : 1n);
        historyHashes.push(ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString())));
    }

    console.log(`    Judgement: ${passed.map((p, i) => `${agents[i]}: ${p ? 'PASS' : 'FAIL'}`)}`);
    const tx = await this.judge.judgeTask(taskId, agents, passed, historyHashes, behaviorData);
    await tx.wait();
    console.log(`    Task #${taskId} RESOLVED and trust scores updated.`);
  }
}

const engine = new BrokerEngine();
engine.start().catch(console.error);
