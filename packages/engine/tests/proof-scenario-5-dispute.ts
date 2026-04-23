import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { storage } from '../../shared/src/StorageProvider';

dotenv.config({ path: '../../../.env' });

/**
 * PROOF OF ACCOUNTABILITY: Scenario 5 - The Dispute Protocol
 * Proves that a task poster has a 24-hour window to contest an outcome,
 * freezing the task state to DISPUTED to await governance intervention.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const escrowAddress = process.env.ESCROW_ADDRESS || ethers.ZeroAddress;
  const vaultAddress = process.env.VAULT_ADDRESS || ethers.ZeroAddress;
  const registryAddress = process.env.REGISTRY_ADDRESS || ethers.ZeroAddress;
  const judgeAddress = process.env.JUDGE_ADDRESS || ethers.ZeroAddress;

  const escrow = await ethers.getContractAt('TaskEscrow', escrowAddress);
  const judge = await ethers.getContractAt('SlashingJudge', judgeAddress);
  const registry = await ethers.getContractAt('AgentRegistry', registryAddress);

  console.log('--- PROOF SCENARIO 5: THE DISPUTE PROTOCOL ---');

  // 1. Post a task
  const payment = ethers.parseEther('0.0001');
  const deadline = Math.floor(Date.now() / 1000) + 3600; 
  
  console.log(`[1] Posting Task...`);
  let tx = await escrow.postTask(deadline, ethers.ZeroHash, '0g://test-dispute', false, { value: payment });
  let receipt = await tx.wait();
  
  const taskId = receipt!.logs.map(log => {
      try { return escrow.interface.parseLog(log); } catch { return null; }
  }).find(l => l?.name === 'TaskPosted')?.args[0];

  console.log(`    Task ID: ${taskId}`);

  // 2. Assign Charlie (Tier 1)
  const agentList = await registry.getAgentList();
  const charlieAddress = agentList[2]; 

  console.log(`[2] Assigning Charlie (${charlieAddress})...`);
  tx = await escrow.assignAgents(taskId, [charlieAddress], [ethers.parseEther('0.001')]);
  await tx.wait();

  // 3. Simulate Charlie Submitting and Engine Judging
  // We mimic Submit via Engine's control or assume we can invoke Judge directly from VERIFYING
  // Wait, parallel tasks need agentSubmitted = true for VERIFYING. 
  // Let's use sequential with 1 agent for easy bypass, or just impersonate in local testnet.
  // Since we are running this proof directly against deployed smart contracts where Deployer = Poster,
  // we can't easily jump to VERIFYING for Parallel without Charlie's key. 
  // We'll post it as sequential to use advancePipeline!
  console.log(`[3] Resolving Task (Simulated via Pipeline Advance -> Judge)...`);
  // Re-posting as sequential for testability
  const qtx = await escrow.postTask(deadline, ethers.ZeroHash, '0g://test-dispute', true, { value: payment });
  const qreceipt = await qtx.wait();
  const qtaskId = qreceipt!.logs.map(log => {
    try { return escrow.interface.parseLog(log); } catch { return null; }
  }).find(l => l?.name === 'TaskPosted')?.args[0];

  await (await escrow.assignAgents(qtaskId, [charlieAddress], [ethers.parseEther('0.001')])).wait();
  await (await escrow.advancePipeline(qtaskId, "0xHashFromCharlie")).wait();

  // 4. Judge Passes Charlie
  const agents = [charlieAddress];
  const criteriaResults = [true];
  const hashes = [ethers.ZeroHash];
  const behaviorData = [0n,0n,0n,0n]; 
  tx = await judge.judgeTask(qtaskId, agents, criteriaResults, hashes, behaviorData);
  await tx.wait();

  // 5. The Core Proof: Poster Disputes within 24 Hours
  console.log(`[4] Poster contests the outcome! Invoking disputeTask()...`);
  tx = await escrow.disputeTask(qtaskId);
  await tx.wait();

  // 6. Assertions
  const taskState = await escrow.getTaskBasic(qtaskId);

  console.log(`--- ASSERTIONS ---`);
  console.log(`Task Status (Expected 6 = DISPUTED): ${taskState.status}`);
  
  if (taskState.status === 6n) {
      console.log('✅ PASS: Task frozen in DISPUTED state. Awaiting administrative governance.');
  } else {
      console.error('❌ FAIL: Dispute protocol failed.');
  }
}

main().catch(console.error);
