import { ethers } from 'ethers';
import { StorageService } from '../../engine/src/services/storageService';
import CrucibleINFT from '../artifacts/contracts/CrucibleINFT.sol/CrucibleINFT.json';
import AgentRegistryABI from '../artifacts/contracts/AgentRegistry.sol/AgentRegistry.json';
import { CONTRACT_ADDRESSES } from '@crucible/shared';

async function mintAgent(
  agentName: string,
  capabilities: string[],
  privateKey: string
) {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const signer = new ethers.Wallet(privateKey, provider);
  const storageService = new StorageService(privateKey);

  console.log(`Starting identity pipeline for: ${agentName}...`);

  // 1. Create initial history on 0G Storage
  const initialHistory = {
    agentId: await signer.getAddress(),
    inftTokenId: 0, // will update after mint
    version: 1,
    updatedAt: Math.floor(Date.now() / 1000),
    totalTasks: 0,
    completedHonestly: 0,
    totalSlashEvents: 0,
    totalDisputes: 0,
    recentWindow: [],
    avgResponseTimeMs: 0,
    taskHistory: []
  };

  console.log('Uploading initial history to 0G Storage...');
  const historyHash = await storageService.uploadHistory(initialHistory as any);

  // 2. Create encrypted metadata URI
  const metadata = {
    name: agentName,
    capabilities,
    historyHash,
    created: Date.now()
  };
  const metadataHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(metadata))
  );
  
  console.log('Uploading metadata hash to 0G Storage...');
  const encryptedURI = await storageService.uploadHistory(metadata as any); // Using uploadHistory for URI generation

  // 3. Mint INFT
  const inftContract = new ethers.Contract(
    CONTRACT_ADDRESSES.CRUCIBLE_INFT,
    CrucibleINFT.abi,
    signer
  );

  console.log('Minting Agent INFT...');
  const tx = await inftContract.mintAgent(
    await signer.getAddress(),
    encryptedURI,
    metadataHash,
    "0x", // Initial proof for testnet parity
    { value: ethers.parseEther('0.001') }
  );

  const receipt = await tx.wait();
  // Filter logs for the AgentMinted event manually for Ethers v6 compatibility
  const tokenId = receipt.logs[0].topics[3]; // Standard ERC721 pattern for simple mints

  console.log(`Agent minted. Token ID: ${BigInt(tokenId).toString()}`);

  // 4. Register on AgentRegistry
  const registryContract = new ethers.Contract(
    CONTRACT_ADDRESSES.AGENT_REGISTRY,
    AgentRegistryABI.abi,
    signer
  );

  console.log('Registering on AgentRegistry...');
  const regTx = await registryContract.registerAgent(
    await signer.getAddress(),
    tokenId,
    historyHash,
    capabilities
  );
  await regTx.wait();

  console.log('--- MISSION COMPLETE ---');
  console.log(`Agent Address: ${await signer.getAddress()}`);
  console.log(`History Hash: ${historyHash}`);
  return { tokenId, historyHash };
}

// Example usage implementation script
if (require.main === module) {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('PRIVATE_KEY not in env');
  
  mintAgent('ResearchBot-01', ['research', 'writing'], pk)
    .catch(console.error);
}
