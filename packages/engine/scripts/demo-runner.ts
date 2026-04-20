import { ethers } from 'ethers';
import { AssignmentEngine } from '../src/assignmentEngine';
import { TrustScorer } from '../src/trustScorer';
import { StorageService } from '../src/services/storageService';
import { logger, CONTRACT_ADDRESSES } from '@crucible/shared';
import AgentRegistryABI from '../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Crucible Demo Orchestrator (Full Lifecycle)
 * This script automates a sequence of 7 tasks to demonstrate:
 * 1. Honest growth (Tasks 1-5)
 * 2. Defection (Task 6) -> Trust Decay & Stake Hike
 * 3. Rehabilitation (Task 7) -> Recovery through low-value tasks
 */
async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    // Contracts
    const registry = new ethers.Contract(CONTRACT_ADDRESSES.AGENT_REGISTRY, AgentRegistryABI.abi, provider);
    const escrow = new ethers.Contract(CONTRACT_ADDRESSES.TASK_ESCROW, TaskEscrowABI.abi, signer);
    
    // Engine Components
    const engine = new AssignmentEngine();
    const scorer = new TrustScorer();
    const storage = new StorageService(process.env.PRIVATE_KEY!);

    // Targets
    const badActorAddress = process.env.BAD_ACTOR_ADDRESS;
    if (!badActorAddress) {
        console.error("CRITICAL: BAD_ACTOR_ADDRESS not set in .env");
        process.exit(1);
    }
    
    console.log(`\n=== CRUCIBLE AUTO-DEMO: ECONOMIC HARDENING ===\n`);
    console.log(`Target Agent: ${badActorAddress}\n`);

    const criteriaHash = ethers.ZeroHash;
    const criteriaURI = "ipfs://demo-criteria";

    for (let i = 1; i <= 7; i++) {
        console.log(`\n--- TASK ${i} SEQUENCE ---`);
        
        // 1. Log State Before
        const agentData = await registry.getAgent(badActorAddress);
        const history = await storage.downloadHistory(agentData.historyRootHash) as any;
        const score = scorer.calculateScore(history);
        const nextStake = scorer.calculateRequiredStake(history, ethers.parseEther('0.01'));
        const coop = scorer.shouldCooperate(history);

        console.log(`[PRE-TASK STATE]`);
        console.log(` > Trust Score: ${score.toFixed(4)}`);
        console.log(` > Trust Tier:  ${scorer.getTierLabel(score)}`);
        console.log(` > Est. Stake:  ${ethers.formatEther(nextStake)} OG`);
        console.log(` > Status:      ${coop ? "✅ TRUSTED" : "❌ DEFECTED / RESTRICTED"}`);

        // 2. Post Task
        console.log(`\nPosting task ${i} to Escrow...`);
        const taskPayment = i === 7 ? ethers.parseEther('0.001') : ethers.parseEther('0.01'); // Task 7 is a rehab task
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        
        const postTx = await escrow.postTask(deadline, criteriaHash, criteriaURI, false, { value: taskPayment });
        const receipt = await postTx.wait();
        
        // Extract taskId from event
        const taskId = i - 1; // Simplified for demo if starting fresh
        console.log(`✅ Task ${taskId} posted.`);

        // 3. Automate Engine Steps (Manual trigger in demo script)
        console.log(`Engine: Assigning agents...`);
        await engine.assignAgentsForTask(taskId.toString());

        // 4. Simulate Submission (In a real demo, agents would do this)
        // For the demo runner, we skip to judging assume agents submitted
        console.log(`Engine: Processing outputs & Judging...`);
        await engine.processTaskOutputs(taskId.toString());

        console.log(`✅ Task ${taskId} resolved.`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n=== DEMO ORCHESTRATION COMPLETE ===\n`);
}

main().catch(console.error);
