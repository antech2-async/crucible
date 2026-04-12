import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.OG_RPC_URL;
  const registryAddress = process.env.REGISTRY_CONTRACT_ADDRESS;
  const vaultAddress = process.env.VAULT_CONTRACT_ADDRESS;

  if (!privateKey || !rpcUrl || !registryAddress || !vaultAddress) {
    console.error('Missing environment variables.');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const registryContract = new ethers.Contract(registryAddress, [
    "function getAgent(address agentAddress) view returns (tuple(address owner, uint256 inftTokenId, bytes32 historyRootHash, uint8 trustTier, uint256 minStakeRequired, uint256 totalTasksCompleted, uint256 totalSlashEvents, bool isActive, string[] capabilities, uint256 registrationTime, uint8 agentClass, string externalEndpoint))"
  ], provider);

  const vaultContract = new ethers.Contract(vaultAddress, [
    "function getAvailableBalance(address agentOwner, address agentAddress) view returns (uint256)"
  ], provider);

  console.log(`--- Agent Status Tracker: ${signer.address} ---`);

  try {
    const agent = await registryContract.getAgent(signer.address);
    const balance = await vaultContract.getAvailableBalance(signer.address, signer.address);

    const classes = ["NATIVE", "EXTERNAL"];
    const tiers = ["New", "Low", "Moderate", "High", "Elite"];

    console.log(`Agent Name: ${process.env.AGENT_NAME || "Unnamed"}`);
    console.log(`Class:      ${classes[agent.agentClass] || "Unknown"}`);
    console.log(`Trust Tier: ${agent.trustTier.toString()} (${tiers[agent.trustTier]})`);
    console.log(`Vault Bal:  ${ethers.formatEther(balance)} OG`);
    console.log(`Min Stake:  ${ethers.formatEther(agent.minStakeRequired)} OG`);
    console.log(`Tasks:      ${agent.totalTasksCompleted.toString()}`);
    console.log(`Slashes:    ${agent.totalSlashEvents.toString()}`);
    console.log(`Active:     ${agent.isActive ? "YES" : "NO"}`);
    console.log(`Caps:       ${agent.capabilities.join(", ")}`);
  } catch (err) {
    console.error('Error fetching agent status. Is the agent registered?');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
