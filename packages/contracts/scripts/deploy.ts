import { ethers } from 'hardhat';
import { FetchRequest } from 'ethers';
import axios from "axios";
import { storage } from '../../shared/src/StorageProvider';

// Definitive workaround for the Node v22 undici maxRedirections bug.
// We override the global ethers fetcher to use Axios, which handles redirects stably.
FetchRequest.registerGetUrl(async (req) => {
    const response = await axios({
        url: req.url,
        method: req.method,
        data: req.body,
        headers: req.headers,
        responseType: 'arraybuffer',
    });

    return {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: response.headers as any,
        body: new Uint8Array(response.data)
    };
});
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  // 1. Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  console.log('AgentRegistry deployed to:', await registry.getAddress());

  // 2. Deploy TrustCalculator
  const TrustCalculator = await ethers.getContractFactory('TrustCalculator');
  const calculator = await TrustCalculator.deploy();
  await calculator.waitForDeployment();
  console.log('TrustCalculator deployed to:', await calculator.getAddress());

  // 3. Deploy AgentStakeVault
  const AgentStakeVault = await ethers.getContractFactory('AgentStakeVault');
  const vault = await AgentStakeVault.deploy();
  await vault.waitForDeployment();
  console.log('AgentStakeVault deployed to:', await vault.getAddress());

  // 4. Deploy TaskEscrow
  const TaskEscrow = await ethers.getContractFactory('TaskEscrow');
  const escrow = await TaskEscrow.deploy(
    deployer.address, 
    await vault.getAddress(), 
    await registry.getAddress()
  );
  await escrow.waitForDeployment();
  console.log('TaskEscrow deployed to:', await escrow.getAddress());

  // 5. Deploy SlashingJudge
  const SlashingJudge = await ethers.getContractFactory('SlashingJudge');
  const judge = await SlashingJudge.deploy(
    await registry.getAddress(),
    await escrow.getAddress(),
    await calculator.getAddress()
  );
  await judge.waitForDeployment();
  console.log('SlashingJudge deployed to:', await judge.getAddress());

  // 6. Deploy CrucibleINFT
  const CrucibleINFT = await ethers.getContractFactory('CrucibleINFT');
  const inft = await CrucibleINFT.deploy(deployer.address);
  await inft.waitForDeployment();
  console.log('CrucibleINFT deployed to:', await inft.getAddress());

  // 7. Set authorizations
  console.log('Setting authorizations...');
  await registry.addAuthorizedUpdater(await judge.getAddress());
  await registry.setINFTContract(await inft.getAddress());
  await escrow.setSlashingJudge(await judge.getAddress());
  await vault.setEscrowContract(await escrow.getAddress());
  
  // Deployer acts as engine for demo: (assignmentEngine = deployer automatically passed to TaskEscrow)
  await judge.addAuthorizedCaller(deployer.address);

  // 8. Seed beginner task pool (Section 15)
  console.log('Seeding beginner task pool...');
  const beginnerCriteria = {
    requiredCapabilities: ['research'],
    isSequential: false,
    criteria: [
      { fieldName: 'wordCount', operator: 'gte', expectedValue: '100', weight: 1 },
      { fieldName: 'isValidJson', operator: 'eq', expectedValue: 'true', weight: 1 },
    ],
  };

  try {
    const { hash: criteriaRootHash, uri: criteriaURI } = await storage.commit(JSON.stringify(beginnerCriteria));
    const criteriaBytes32 = ethers.keccak256(ethers.toUtf8Bytes(criteriaRootHash));
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    
    const taskBatch = 5; // Reduced from 10 to speed up deployment demo
    const paymentPerTask = ethers.parseEther('0.001');

    for (let i = 0; i < taskBatch; i++) {
        await (await escrow.postTask(deadline, criteriaBytes32, criteriaURI, false, { value: paymentPerTask })).wait();
    }
    console.log(`Successfully seeded ${taskBatch} beginner tasks.`);
  } catch (e) {
    console.warn('Skipping beginner seeding (Storage Provider likely not configured):', e);
  }

  console.log('Deployment complete!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
