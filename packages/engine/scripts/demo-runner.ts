import { ethers } from 'ethers';
import { AssignmentEngine } from '../src/assignmentEngine';
import { TrustScorer } from '../src/trustScorer';
import { StorageService } from '../src/services/storageService';
import { CONTRACT_ADDRESSES, TaskStatus, TaskCriteria } from '@crucible/shared';
import AgentRegistryABI from '../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * waitForVerifying
 * Polling helper to wait for the decentralized agents to submit their proofs
 */
async function waitForVerifying(
  escrow: ethers.Contract,
  taskId: string,
  timeoutMs = 60000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const [, , , , status] = await escrow.getTaskBasic(taskId);
    if (Number(status) === TaskStatus.VERIFYING) return;
    if (Number(status) === TaskStatus.FAILED)
      throw new Error(`Task ${taskId} failed before VERIFYING`);
    if (Number(status) === TaskStatus.COMPLETED) return; // Already done
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timeout waiting for task ${taskId} to reach VERIFYING`);
}

/**
 * Crucible Demo Orchestrator (Full Lifecycle)
 */
async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const registry = new ethers.Contract(
    CONTRACT_ADDRESSES.AGENT_REGISTRY,
    AgentRegistryABI.abi,
    provider,
  );
  const escrow = new ethers.Contract(CONTRACT_ADDRESSES.TASK_ESCROW, TaskEscrowABI.abi, signer);

  const engine = new AssignmentEngine();
  const scorer = new TrustScorer();
  const storage = new StorageService(process.env.PRIVATE_KEY!);

  const badActorAddress = process.env.BAD_ACTOR_ADDRESS;
  if (!badActorAddress) {
    console.error('CRITICAL: BAD_ACTOR_ADDRESS not set in .env');
    process.exit(1);
  }

  console.log(`\n=== CRUCIBLE AUTO-DEMO: ECONOMIC HARDENING ===\n`);
  console.log(`Target Agent: ${badActorAddress}\n`);

  // Define Real Demo Criteria
  const demoCriteria: TaskCriteria = {
    taskId: '',
    requiredCapabilities: ['research'],
    isSequential: false,
    criteria: [
      { fieldName: 'wordCount', operator: 'gte', expectedValue: '300', weight: 2 },
      { fieldName: 'sourceCount', operator: 'gte', expectedValue: '3', weight: 2 },
    ],
    deadline: 0, // Will be set per task
  };

  console.log('Uploading Demo Criteria to 0G Storage...');
  const { rootHash: criteriaURI, bytes32Hash: criteriaHash } =
    await storage.uploadJSON(demoCriteria);
  console.log(`Criteria URI: ${criteriaURI}\n`);

  for (let i = 1; i <= 7; i++) {
    console.log(`\n--- TASK ${i} SEQUENCE ---`);

    const agentData = await registry.getAgent(badActorAddress);

    // ZeroHash Guard for demo state readout
    let history;
    if (
      agentData.historyRootHash === ethers.ZeroHash ||
      agentData.historyRootHash ===
        '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      history = { totalTasks: 0, completedHonestly: 0, recentWindow: [], totalSlashEvents: 0 };
    } else {
      history = (await storage.downloadHistory(agentData.historyRootHash)) as any;
    }

    const score = scorer.calculateScore(history);
    const nextStake = scorer.calculateRequiredStake(history, ethers.parseEther('0.01'));
    const coop = scorer.shouldCooperate(history);

    console.log(`[PRE-TASK STATE]`);
    console.log(` > Trust Score: ${score.toFixed(4)}`);
    console.log(` > Trust Tier:  ${scorer.getTierLabel(score)}`);
    console.log(` > Est. Stake:  ${ethers.formatEther(nextStake)} OG`);
    console.log(` > Status:      ${coop ? '✅ TRUSTED' : '❌ DEFECTED / RESTRICTED'}`);

    console.log(`\nPosting task ${i} to Escrow...`);
    const taskPayment = i === 7 ? ethers.parseEther('0.001') : ethers.parseEther('0.01');
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const postTx = await escrow.postTask(deadline, criteriaHash, criteriaURI, false, {
      value: taskPayment,
    });
    const receipt = await postTx.wait();

    // Extract taskId from event logs
    const event = receipt.logs
      .map((log: any) => {
        try {
          return escrow.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((e: any) => e && e.name === 'TaskPosted');

    const taskId = event.args[0].toString();
    console.log(`✅ Task ${taskId} posted.`);

    console.log(`Engine: Assigning agents...`);
    await engine.assignAgentsForTask(taskId);

    console.log(`Waiting for agents to submit outputs...`);
    await waitForVerifying(escrow, taskId);

    console.log(`Engine: All agents submitted. Processing & Judging...`);
    await engine.processTaskOutputs(taskId);

    console.log(`✅ Task ${taskId} resolved.`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n=== DEMO ORCHESTRATION COMPLETE ===\n`);
}

main().catch(console.error);
