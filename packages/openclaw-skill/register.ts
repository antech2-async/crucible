import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.OG_RPC_URL;
  const registryAddress = process.env.REGISTRY_CONTRACT_ADDRESS;
  const inftAddress = process.env.INFT_CONTRACT_ADDRESS;

  if (!privateKey || !rpcUrl || !registryAddress || !inftAddress) {
    console.error('Missing environment variables. Check your .env file.');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  console.log('Registering OpenClaw Agent:', process.env.AGENT_NAME);
  console.log('Wallet address:', signer.address);

  // 1. Mint INFT
  // For the hackathon, we assume the INFT contract has a basic mint function
  const INFT_ABI = [
    "function mint(address to) public returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ];
  const inftContract = new ethers.Contract(inftAddress, INFT_ABI, signer);

  console.log('Minting Agent INFT...');
  const mintTx = await inftContract.mint(signer.address);
  const receipt = await mintTx.wait();
  
  // Extract tokenId from Transfer event
  const transferEvent = receipt.logs.find((log: any) => 
    log.topics[0] === ethers.id("Transfer(address,address,uint256)")
  );
  if (!transferEvent) {
    throw new Error("Failed to find Transfer event in mint receipt");
  }
  const tokenId = ethers.toBigInt(transferEvent.topics[3]);
  console.log('Agent INFT minted. Token ID:', tokenId.toString());

  // 2. Register on AgentRegistry as EXTERNAL
  const REGISTRY_ABI = [
    "function registerExternalAgent(address agentAddress, uint256 inftTokenId, bytes32 initialHistoryHash, string[] calldata capabilities, string calldata webhookEndpoint) external"
  ];
  const registryContract = new ethers.Contract(registryAddress, REGISTRY_ABI, signer);

  const capabilities = (process.env.AGENT_CAPABILITIES || "research,writing").split(",");
  const initialHistoryHash = ethers.ZeroHash; // placeholder for initial history in 0G storage
  const endpoint = process.env.AGENT_ENDPOINT || "http://localhost:3000";

  console.log('Registering on Crucible Registry as EXTERNAL class...');
  const registerTx = await registryContract.registerExternalAgent(
    signer.address,
    tokenId,
    initialHistoryHash,
    capabilities,
    endpoint
  );
  await registerTx.wait();

  console.log('SUCCESS: Agent registered on Crucible.');
  console.log('Agent Address:', signer.address);
  console.log('Token ID:', tokenId.toString());
  console.log('Class: EXTERNAL');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
