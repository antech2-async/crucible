import { ethers } from 'hardhat';
import { FetchRequest } from 'ethers';
import axios from "axios";
import { storage } from '../../shared/src/StorageProvider';

// Disable global fetch to workaround undici maxRedirections bug in Node v22 / ethers v6
try {
    // @ts-ignore
    global.fetch = undefined;
} catch (e) {}

// Definitive workaround for the Node v22 undici maxRedirections bug.
// We override the global ethers fetcher to use Axios, which handles redirects stably.
FetchRequest.registerGetUrl(async (req) => {
    try {
        const response = await axios({
            url: req.url,
            method: req.method,
            data: req.body ? Buffer.from(req.body) : undefined,
            headers: req.headers,
            responseType: 'arraybuffer',
            maxRedirects: 5,
        });

        return {
            statusCode: response.status,
            statusMessage: response.statusText,
            headers: response.headers as any,
            body: new Uint8Array(response.data)
        };
    } catch (error: any) {
        if (error.response) {
            return {
                statusCode: error.response.status,
                statusMessage: error.response.statusText,
                headers: error.response.headers as any,
                body: new Uint8Array(error.response.data)
            };
        }
        throw error;
    }
});

async function main() {
  const url = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set in .env");

  console.log(`Connecting to: ${url}`);
  
  // Custom fetcher for Ethers v6 to avoid undici maxRedirections bug
  const customFetcher = async (req: FetchRequest) => {
    const response = await axios({
        url: req.url,
        method: req.method,
        data: req.body ? Buffer.from(req.body) : undefined,
        headers: req.headers,
        responseType: 'arraybuffer',
    });
    return {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: response.headers as any,
        body: new Uint8Array(response.data)
    };
  };

  const provider = new ethers.JsonRpcProvider(url, undefined, {
    staticNetwork: new ethers.Network('0g-galileo', 16602),
  });
  // @ts-ignore
  provider._getConnection().fetcher = customFetcher;

  const wallet = new ethers.Wallet(privateKey, provider);
  const deployer = wallet;
  console.log('Deploying contracts with account:', deployer.address);

  const getFactory = (name: string) => {
    const artifact = require(`../artifacts/contracts/${name}.sol/${name}.json`);
    return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  };

  // 1. Deploy AgentRegistry
  const registry = await (await getFactory('AgentRegistry').deploy({ gasPrice: 10000000000n })).waitForDeployment();
  console.log('AgentRegistry deployed to:', await registry.getAddress());

  // 2. Deploy TrustCalculator
  const calculator = await (await getFactory('TrustCalculator').deploy({ gasPrice: 10000000000n })).waitForDeployment();
  console.log('TrustCalculator deployed to:', await calculator.getAddress());

  // 3. Deploy AgentStakeVault
  const vault = await (await getFactory('AgentStakeVault').deploy({ gasPrice: 10000000000n })).waitForDeployment();
  console.log('AgentStakeVault deployed to:', await vault.getAddress());

  // 4. Deploy TaskEscrow
  const escrow = await (await getFactory('TaskEscrow').deploy(
    deployer.address, 
    await vault.getAddress(), 
    await registry.getAddress(),
    { gasPrice: 10000000000n }
  )).waitForDeployment();
  console.log('TaskEscrow deployed to:', await escrow.getAddress());

  // 5. Deploy SlashingJudge
  const judge = await (await getFactory('SlashingJudge').deploy(
    await registry.getAddress(),
    await escrow.getAddress(),
    await calculator.getAddress(),
    { gasPrice: 10000000000n }
  )).waitForDeployment();
  console.log('SlashingJudge deployed to:', await judge.getAddress());

  // 6. Deploy CrucibleINFT
  const inft = await (await getFactory('CrucibleINFT').deploy(deployer.address, { gasPrice: 10000000000n })).waitForDeployment();
  console.log('CrucibleINFT deployed to:', await inft.getAddress());

  // 7. Set authorizations
  console.log('Setting authorizations...');
  await (await (registry as any).addAuthorizedUpdater(await judge.getAddress(), { gasPrice: 10000000000n })).wait();
  await (await (registry as any).setINFTContract(await inft.getAddress(), { gasPrice: 10000000000n })).wait();
  await (await (escrow as any).setSlashingJudge(await judge.getAddress(), { gasPrice: 10000000000n })).wait();
  await (await (vault as any).setEscrowContract(await escrow.getAddress(), { gasPrice: 10000000000n })).wait();
  
  await (await (judge as any).addAuthorizedCaller(deployer.address, { gasPrice: 10000000000n })).wait();

  // 8. Seed beginner task pool
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
    
    const taskBatch = 5; 
    const paymentPerTask = ethers.parseEther('0.001');

    for (let i = 0; i < taskBatch; i++) {
        await (await (escrow as any).postTask(deadline, criteriaBytes32, criteriaURI, false, { value: paymentPerTask, gasPrice: 10000000000n })).wait();
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
