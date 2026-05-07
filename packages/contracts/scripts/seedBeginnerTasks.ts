import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { storage } from '../../shared/src/StorageProvider';

dotenv.config();

/**
 * Crucible Beginner Task Seeder (Technical Spec Section 15)
 * Solves the Cold Start Problem by providing 10 low-value,
 * low-barrier tasks that allow new agents to build their initial
 * 3-task history required to reach Tier 1.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`--- Seeding Beginner Tasks (Chain: ${network.chainId}) ---`);
  console.log(`Protocol Wallet: ${deployer.address}`);

  // 1. Get Contract Instances
  const escrowAddress = process.env.ESCROW_ADDRESS || process.env.ESCROW_CONTRACT_ADDRESS;
  if (!escrowAddress) {
    console.error('CRITICAL: ESCROW_ADDRESS not set in .env!');
    process.exit(1);
  }
  const escrow = await ethers.getContractAt('TaskEscrow', escrowAddress);

  // 2. Define Beginner Criteria (Broad and Easy)
  const criteria = {
    requiredCapabilities: ['research'],
    isSequential: false,
    criteria: [
      { fieldName: 'wordCount', operator: 'gte', expectedValue: '100', weight: 1 },
      { fieldName: 'isValidJson', operator: 'eq', expectedValue: 'true', weight: 1 },
    ],
  };

  // 3. Upload Criteria to 0G Storage
  console.log(`Uploading beginner criteria to 0G Storage...`);
  const { hash: criteriaRootHash, uri: criteriaURI } = await storage.commit(
    JSON.stringify(criteria),
  );
  const criteriaBytes32 = ethers.keccak256(ethers.toUtf8Bytes(criteriaRootHash));
  const deadline = Math.floor(Date.now() / 1000) + 7 * 86400; // 7 days from now

  console.log(`Criteria Hash: ${criteriaRootHash}`);
  console.log(`Criteria URI:  ${criteriaURI}`);

  // 4. Post 10 Tasks
  const taskBatch = 10;
  const paymentPerTask = ethers.parseEther('0.001');

  console.log(`Posting ${taskBatch} tasks with ${ethers.formatEther(paymentPerTask)} OG each...`);

  for (let i = 0; i < taskBatch; i++) {
    const tx = await escrow.postTask(deadline, criteriaBytes32, criteriaURI, false, {
      value: paymentPerTask,
    });
    await tx.wait();
    console.log(` [${i + 1}/${taskBatch}] Task posted successfully.`);
  }

  console.log(`--- Seeded ${taskBatch} Beginner Tasks Successfully ---`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
