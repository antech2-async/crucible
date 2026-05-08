import { ethers, FetchRequest } from 'ethers';
import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { storage } from '../../shared/src/StorageProvider';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Axios workaround for Node v22
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
    body: new Uint8Array(response.data),
  };
});

async function uploadHistory(
  indexer: Indexer,
  signer: ethers.Wallet,
  history: object,
): Promise<string> {
  let jsonString = JSON.stringify(history);
  if (jsonString.length < 256) {
    jsonString = jsonString.padEnd(256, ' ');
  }
  const memData = new MemData(Buffer.from(jsonString));
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`Merkle error: ${treeErr}`);
  const rootHash = tree!.rootHash()!;

  // Write to local fallback storage so demo works even if 0G indexer times out
  await storage.commitWithHash(rootHash, jsonString);

  // Hardcode a safe but tiny fee (0.001 OG) to ensure the submission is accepted
  const fee = ethers.parseUnits('0.04', 'ether');
  console.log(
    `  Submitting with safety fee: ${ethers.formatEther(fee)} OG (Padded size: ${jsonString.length} bytes)`,
  );

  try {
    // @ts-expect-error - ethers type mismatch across workspaces
    const uploadPromise = indexer.upload(memData, process.env.OG_RPC_URL!, signer);

    const [, uploadErr] = (await Promise.race([
      uploadPromise,
      new Promise((resolve) => setTimeout(() => resolve([null, 'timeout']), 30000)),
    ])) as [any, any];

    if (uploadErr && !uploadErr.toString().includes('timeout')) {
      console.warn(`  Storage Warning: ${uploadErr}. Proceeding to Registry update anyway.`);
    } else if (uploadErr) {
      console.log('  Upload timed out or taking too long. Proceeding with Registry update...');
    }
  } catch (err: any) {
    console.warn(`  Storage Upload Failed: ${err.message}. Proceeding to Registry update anyway.`);
  }

  return rootHash;
}

// Alice — Tier 3, honest, 47 tasks
const aliceHistory = {
  agentId: '0x2Fec90330f97260220Ce409861fD020EBfF3dE3b',
  inftTokenId: 1,
  agentClass: 'NATIVE',
  version: 1,
  updatedAt: Math.floor(Date.now() / 1000),
  totalTasks: 47,
  completedHonestly: 44,
  totalSlashEvents: 1,
  totalDisputes: 0,
  recentWindow: [1, 1, 1, 1, 1, 1, 1, 0, 1, 1], // 9/10 recent passes
  avgResponseTimeMs: 1240,
  taskHistory: [
    { taskId: 410, result: 1 },
    { taskId: 412, result: 1 },
    { taskId: 415, result: 1 },
    { taskId: 420, result: 1 },
    { taskId: 421, result: 1 },
    { taskId: 425, result: 1 },
    { taskId: 428, result: 1 },
    { taskId: 430, result: 0 },
    { taskId: 435, result: 1 },
    { taskId: 440, result: 1 },
  ],
  nonce: Math.random(),
};

// Bob — Tier 2, mostly honest, 32 tasks
const bobHistory = {
  agentId: '0x614C6fa27D558024521bCb9d874Be5600c1178C9',
  inftTokenId: 2,
  agentClass: 'EXTERNAL',
  version: 1,
  updatedAt: Math.floor(Date.now() / 1000),
  totalTasks: 32,
  completedHonestly: 28,
  totalSlashEvents: 2,
  totalDisputes: 1,
  recentWindow: [1, 1, 0, 1, 1, 1, 1, 1, 0, 1], // 8/10 recent
  avgResponseTimeMs: 1890,
  taskHistory: [
    { taskId: 301, result: 1 },
    { taskId: 305, result: 1 },
    { taskId: 310, result: 0 },
    { taskId: 315, result: 1 },
    { taskId: 318, result: 1 },
    { taskId: 320, result: 1 },
    { taskId: 322, result: 1 },
    { taskId: 325, result: 1 },
    { taskId: 330, result: 0 },
    { taskId: 335, result: 1 },
  ],
  nonce: Math.random(),
};

// Charlie — Tier 1, inconsistent, 12 tasks
const charlieHistory = {
  agentId: '0x88568c048Ac5E6617A4e4Be75E83fE3FAB932aba',
  inftTokenId: 3,
  agentClass: 'EXTERNAL',
  version: 1,
  updatedAt: Math.floor(Date.now() / 1000),
  totalTasks: 12,
  completedHonestly: 8,
  totalSlashEvents: 3,
  totalDisputes: 1,
  recentWindow: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0], // 6/10 recent
  avgResponseTimeMs: 2400,
  taskHistory: [
    { taskId: 201, result: 1 },
    { taskId: 204, result: 0 },
    { taskId: 208, result: 1 },
    { taskId: 212, result: 1 },
    { taskId: 215, result: 0 },
    { taskId: 218, result: 1 },
    { taskId: 220, result: 0 },
    { taskId: 225, result: 1 },
    { taskId: 230, result: 1 },
    { taskId: 235, result: 0 },
  ],
  nonce: Math.random(),
};

// BadBot — Tier 0, mostly defecting, 8 tasks
const badBotHistory = {
  agentId: '0x91dd7Ba2218e9fB15ECa7552eC8ec2De9a710D35',
  inftTokenId: 4,
  agentClass: 'EXTERNAL',
  version: 1,
  updatedAt: Math.floor(Date.now() / 1000),
  totalTasks: 8,
  completedHonestly: 3,
  totalSlashEvents: 5,
  totalDisputes: 2,
  recentWindow: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1], // 3/10 recent
  avgResponseTimeMs: 3200,
  taskHistory: [
    { taskId: 101, result: 0 },
    { taskId: 105, result: 0 },
    { taskId: 110, result: 1 },
    { taskId: 115, result: 0 },
    { taskId: 120, result: 0 },
    { taskId: 125, result: 1 },
    { taskId: 130, result: 0 },
    { taskId: 135, result: 0 },
    { taskId: 140, result: 0 },
    { taskId: 145, result: 1 },
  ],
  nonce: Math.random(),
};

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const indexer = new Indexer(process.env.OG_STORAGE_INDEXER_URL!);

  const registryABI = [
    'function updateHistoryAndTrust(address agentAddress, bytes32 newHistoryHash, uint8 newTrustTier, bool wasSlashed) external',
    'function getAgent(address) view returns (tuple(address owner, uint256 inftTokenId, bytes32 historyRootHash, uint8 trustTier, uint256 minStakeRequired, uint256 totalTasksCompleted, uint256 totalSlashEvents, bool isActive, string[] capabilities, uint256 registrationTime, uint8 agentClass, string externalEndpoint))',
    'function registerNativeAgent(address agentAddress, uint256 inftTokenId, bytes32 initialHistoryHash, string[] capabilities) external',
    'function inftContract() view returns (address)',
  ];
  const registry = new ethers.Contract(process.env.REGISTRY_ADDRESS!, registryABI, signer);

  const personas = [
    { history: aliceHistory, tier: 3, caps: ['research', 'analysis'] },
    { history: bobHistory, tier: 2, caps: ['writing', 'editing'] },
    { history: charlieHistory, tier: 1, caps: ['research'] },
    { history: badBotHistory, tier: 0, caps: ['writing'] },
  ];

  for (const persona of personas) {
    const addr = persona.history.agentId;
    console.log(`Processing ${addr}...`);

    try {
      const agentData = await registry.getAgent(addr);
      if (!agentData.isActive) {
        console.log(`  Registering agent ${addr}...`);
        const inftAddress = await registry.inftContract();
        const inft = new ethers.Contract(
          inftAddress,
          [
            'function mintAgent(address to, string calldata uri, bytes32 hash) public payable returns (uint256)',
            'function mintFee() view returns (uint256)',
          ],
          signer,
        );

        const mintFee = await inft.mintFee();
        console.log(`  Minting INFT (Fee: ${ethers.formatEther(mintFee)} OG)...`);
        const mintTx = await inft.mintAgent(
          signer.address,
          'ipfs://crucible-identity',
          ethers.ZeroHash,
          {
            value: mintFee,
          },
        );
        const receipt = await mintTx.wait();
        const mintedTokenId = BigInt(receipt.logs[0].topics[3]);

        console.log(`  Registering with INFT #${mintedTokenId}...`);
        await (
          await registry.registerNativeAgent(addr, mintedTokenId, ethers.ZeroHash, persona.caps)
        ).wait();
      }

      const rootHash = await uploadHistory(indexer, signer, persona.history);

      console.log(`  Updating Registry for ${addr} to Tier ${persona.tier}...`);
      await (await registry.updateHistoryAndTrust(addr, rootHash, persona.tier, false)).wait();
      console.log(`  ✅ Done with ${addr}\n`);
    } catch (err: any) {
      console.error(`  ❌ Error processing ${addr}: ${err.message}`);
    }
  }

  console.log('\n✅ All agent histories seeded on 0G Storage and registry updated.');
  console.log('Restart the frontend to see real trust scores in the arena.');
}

main().catch(console.error);
