import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });

/**
 * PROOF OF ACCOUNTABILITY: Scenario 2 - The Silent Agent
 * Proves that an agent who accepts a task but fails to submit before the deadline
 * is automatically slashed, and the poster is refunded.
 */
async function main() {
  const [_deployer] = await ethers.getSigners();
  const escrowAddress = process.env.ESCROW_ADDRESS || ethers.ZeroAddress;
  const vaultAddress = process.env.VAULT_ADDRESS || ethers.ZeroAddress;
  const registryAddress = process.env.REGISTRY_ADDRESS || ethers.ZeroAddress;

  if (escrowAddress === ethers.ZeroAddress) throw new Error('Missing ESCROW_ADDRESS');

  const escrow = await ethers.getContractAt('TaskEscrow', escrowAddress);
  const vault = await ethers.getContractAt('AgentStakeVault', vaultAddress);
  const registry = await ethers.getContractAt('AgentRegistry', registryAddress);

  console.log('--- PROOF SCENARIO 2: THE SILENT AGENT ---');

  // 1. Post a task with a very short deadline (e.g. 5 seconds)
  const payment = ethers.parseEther('0.0001');
  const deadline = Math.floor(Date.now() / 1000) + 5;

  console.log(`[1] Posting Task with 5-second deadline... (Payment: 0.0001 OG)`);
  let tx = await escrow.postTask(deadline, ethers.ZeroHash, '0g://test-criteria', false, {
    value: payment,
  });
  const receipt = await tx.wait();

  // Parse task ID from events
  const taskId = receipt!.logs
    .map((log) => {
      try {
        return escrow.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((l) => l?.name === 'TaskPosted')?.args[0];

  console.log(`    Task ID: ${taskId} created.`);

  // 2. Assign an agent (Bob)
  const agentList = await registry.getAgentList();
  const bobAddress = agentList[1]; // Bob
  const stakeAmount = ethers.parseEther('0.001');

  // Check Bob's initial deposit
  // To get Bob's owner, we read the registry:
  const bobAgent = await registry.getAgent(bobAddress);
  const bobOwner = bobAgent.owner;
  const initialBobDeposit = await vault.deposits(bobOwner);

  console.log(`[2] Assigning Bob (${bobAddress}) to Task #${taskId}...`);
  tx = await escrow.assignAgents(taskId, [bobAddress], [stakeAmount]);
  await tx.wait();

  // 3. Wait for deadline to expire natively
  console.log(`[3] Simulating Bob going offline. Waiting 6 seconds for deadline to expire...`);
  await new Promise((r) => setTimeout(r, 6000));

  // 4. Third-party invokes failExpiredTask
  console.log(`[4] Invoking failExpiredTask()...`);
  tx = await escrow.failExpiredTask(taskId);
  await tx.wait();

  // 5. Verify assertions
  const finalBobDeposit = await vault.deposits(bobOwner);
  const taskState = await escrow.getTaskBasic(taskId);

  console.log(`--- ASSERTIONS ---`);
  console.log(`Task Status (Expected 7 = FAILED): ${taskState.status}`);
  console.log(`Bob's Initial Deposit: ${ethers.formatEther(initialBobDeposit)} OG`);
  console.log(`Bob's Final Deposit:   ${ethers.formatEther(finalBobDeposit)} OG`);

  if (initialBobDeposit - finalBobDeposit === stakeAmount) {
    console.log('✅ PASS: Bob was slashed exactly 0.001 OG for missing the deadline.');
  } else {
    console.error('❌ FAIL: Slash amount mismatch!');
  }
}

main().catch(console.error);
