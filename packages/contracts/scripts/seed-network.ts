import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { storage } from '../../shared/src/StorageProvider';

dotenv.config();

/**
 * Crucible Network Bootstrapper
 * Generates test wallets on the fly, funds them from the deployer,
 * and sets up the canonical personas for the arena.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`--- Seeding Crucible Network (Chain: ${network.chainId}) ---`);
  console.log(`Deployer Wallet: ${deployer.address}`);

  // Create ephemeral test wallets
  const alice = ethers.Wallet.createRandom().connect(ethers.provider);
  const bob = ethers.Wallet.createRandom().connect(ethers.provider);
  const charlie = ethers.Wallet.createRandom().connect(ethers.provider);
  const badBot = ethers.Wallet.createRandom().connect(ethers.provider);

  console.log(`Generated Alice: ${alice.address}`);
  console.log(`Generated Bob:   ${bob.address}`);
  console.log(`Generated Charlie: ${charlie.address}`);
  console.log(`Generated BadBot:  ${badBot.address}`);

  // Fund the wallets with a micro-amount (0.01 OG) to pay gas + stakes
  console.log(`Funding test wallets with 0.01 OG each...`);
  const fundTxs = [];
  for (const w of [alice, bob, charlie, badBot]) {
      fundTxs.push(deployer.sendTransaction({ to: w.address, value: ethers.parseEther("0.01") }));
  }
  await Promise.all(fundTxs).then(txs => Promise.all(txs.map(tx => tx.wait())));
  console.log(`Funding complete. Proceeding with registration.`);

  // 1. Get Contract Instances
  const registry = await ethers.getContractAt('AgentRegistry', process.env.REGISTRY_ADDRESS || ethers.ZeroAddress);
  const vault = await ethers.getContractAt('AgentStakeVault', process.env.VAULT_ADDRESS || ethers.ZeroAddress);
  const inft = await ethers.getContractAt('CrucibleINFT', process.env.INFT_ADDRESS || ethers.ZeroAddress);

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

    // B. Mint INFT
    console.log(`    Minting INFT for ${p.name}...`);
    const mtx = await inft.connect(p.signer).mintAgent(
      p.signer.address,
      `https://crucible.network/metadata/${p.name.toLowerCase()}`,
      hash,
      "0x", // No proof for demo
      { value: ethers.parseEther("0.001") }
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
      const tx = await registry.connect(p.signer).registerNativeAgent(p.signer.address, tokenId, hash, p.caps);
      await tx.wait();
    } else {
      const tx = await registry.connect(p.signer).registerExternalAgent(p.signer.address, tokenId, hash, p.caps, 'https://openclaw.local/webhook');
      await tx.wait();
    }

    // D. Pre-fund Vault (0.005 OG each)
    const vtx = await vault.connect(p.signer).deposit({ value: ethers.parseEther('0.005') });
    await vtx.wait();

    // E. Proactive History Simulation (Section 15/29)
    const htx = await registry.connect(deployer).updateHistoryAndTrust(
        p.signer.address, 
        hash, 
        p.tier, 
        p.name === 'BadBot' // Simulations of past behavior
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
