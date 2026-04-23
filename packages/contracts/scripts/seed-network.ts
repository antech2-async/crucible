import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { FetchRequest } from 'ethers';
import axios from 'axios';
import { storage } from '../../shared/src/StorageProvider';

dotenv.config();

// Definitive workaround for the Node v22 undici maxRedirections bug.
// 1. Disable global fetch to force ethers to use our custom fetcher
try {
    // @ts-ignore
    global.fetch = undefined;
} catch (e) {}

// 2. Register Axios as the global fetcher for Ethers v6
FetchRequest.registerGetUrl(async (req) => {
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
});

/**
 * Crucible Network Bootstrapper
 * Generates test wallets on the fly, funds them from the deployer,
 * and sets up the canonical personas for the arena.
 */
async function main() {
  const url = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set in .env");

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

  const deployer = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();

  console.log(`--- Seeding Crucible Network (Chain: ${network.chainId}) ---`);
  console.log(`Deployer Wallet: ${deployer.address}`);

  // Create ephemeral test wallets
  const alice = ethers.Wallet.createRandom().connect(provider);
  const bob = ethers.Wallet.createRandom().connect(provider);
  const charlie = ethers.Wallet.createRandom().connect(provider);
  const badBot = ethers.Wallet.createRandom().connect(provider);

  console.log(`Generated Alice: ${alice.address}`);
  console.log(`Generated Bob:   ${bob.address}`);
  console.log(`Generated Charlie: ${charlie.address}`);
  console.log(`Generated BadBot:  ${badBot.address}`);

  // Fund the wallets with a micro-amount (0.05 OG) to pay gas + stakes
  console.log(`Funding test wallets with 0.05 OG each...`);
  for (const w of [alice, bob, charlie, badBot]) {
      console.log(`    Funding ${w.address}...`);
      const tx = await deployer.sendTransaction({ 
        to: w.address, 
        value: ethers.parseEther("0.05"),
        gasPrice: 10000000000, // 10 Gwei
        gasLimit: 1000000
      });
      await tx.wait();
  }
  console.log(`Funding complete. Proceeding with registration.`);

  // 1. Get Contract Instances
  const registry = await ethers.getContractAt('AgentRegistry', process.env.REGISTRY_ADDRESS || ethers.ZeroAddress, deployer);
  const vault = await ethers.getContractAt('AgentStakeVault', process.env.VAULT_ADDRESS || ethers.ZeroAddress, deployer);
  const inft = await ethers.getContractAt('CrucibleINFT', process.env.INFT_ADDRESS || ethers.ZeroAddress, deployer);

  if (registry.target === ethers.ZeroAddress) {
      console.error("CRITICAL: Contract addresses not set in .env! Run deployment first.");
      process.exit(1);
  }

  const personae = [
    { name: 'Alice', signer: alice, class: 0, caps: ['research', 'data-analysis'], tier: 3 },
    { name: 'Bob', signer: bob, class: 1, caps: ['writing', 'translation'], tier: 2 },
    { name: 'Charlie', signer: charlie, class: 1, caps: ['writing', 'coding'], tier: 1 },
    { name: 'BadBot', signer: badBot, class: 1, caps: ['research'], tier: 0 },
  ];

  for (const p of personae) {
    console.log(`Setting up ${p.name} (${p.signer.address})...`);

    // A. Mock Storage (simulating 0G Storage)
    const metadata = { name: p.name, created: Date.now() };
    const { hash } = await storage.commit(JSON.stringify(metadata));
    const bytes32Hash = ethers.keccak256(ethers.toUtf8Bytes(hash));

    // B. Mint INFT
    console.log(`    Minting INFT for ${p.name}...`);
    const mtx = await inft.connect(p.signer).mintAgent(
      p.signer.address,
      `https://crucible.network/metadata/${p.name.toLowerCase()}`,
      bytes32Hash,
      { value: ethers.parseEther("0.001"), gasPrice: 10000000000, gasLimit: 2000000 }
    );
    const receipt = await mtx.wait();
    
    // Extract tokenId from event
    let tokenId = 1; // Fallback
    if (receipt && receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = inft.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'AgentMinted') {
            tokenId = parsedLog.args[0];
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // C. Register in Crucible
    if (p.class === 0) {
      const tx = await registry.connect(p.signer).registerNativeAgent(p.signer.address, tokenId, bytes32Hash, p.caps, { gasPrice: 10000000000, gasLimit: 1000000 });
      await tx.wait();
    } else {
      const tx = await registry.connect(p.signer).registerExternalAgent(p.signer.address, tokenId, bytes32Hash, p.caps, 'https://openclaw.local/webhook', { gasPrice: 10000000000, gasLimit: 1000000 });
      await tx.wait();
    }

    // D. Pre-fund Vault (0.005 OG each)
    const vtx = await vault.connect(p.signer).deposit({ value: ethers.parseEther('0.005'), gasPrice: 10000000000, gasLimit: 500000 });
    await vtx.wait();

    // E. Proactive History Simulation (Section 15/29)
    const htx = await registry.connect(deployer).updateHistoryAndTrust(
        p.signer.address, 
        bytes32Hash, 
        p.tier, 
        p.name === 'BadBot', // Simulations of past behavior
        { gasPrice: 10000000000, gasLimit: 500000 }
    );
    await htx.wait();
    
    console.log(`    ${p.name} registered and funded at Tier ${p.tier}.`);
  }

  console.log('--- Network Seeded Successfully ---');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
