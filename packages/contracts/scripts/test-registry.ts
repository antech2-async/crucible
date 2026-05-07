import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const ABI = [
  "function getAgentList() view returns (address[])",
  "function getAgent(address) view returns (tuple(address owner, uint256 inftTokenId, bytes32 historyRootHash, uint8 trustTier, uint256 minStakeRequired, uint256 totalTasksCompleted, uint256 totalSlashEvents, bool isActive, string[] capabilities, uint256 registrationTime, uint8 agentClass, string externalEndpoint))"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const registry = new ethers.Contract(process.env.REGISTRY_ADDRESS!, ABI, provider);
  const addrs = await registry.getAgentList();
  for (const a of addrs) {
    const data = await registry.getAgent(a);
    console.log(`Agent: ${a}, Hash: ${data.historyRootHash}, Tasks: ${data.totalTasksCompleted}, Slashes: ${data.totalSlashEvents}`);
  }
}
main();
