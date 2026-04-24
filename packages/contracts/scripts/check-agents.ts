import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { setupEthersWorkaround } from '../../shared/src/node-utils';
dotenv.config({ path: '../../.env' });
setupEthersWorkaround();

async function main() {
  const registryAddress = process.env.REGISTRY_ADDRESS;
  console.log(`Checking Registry at: ${registryAddress}`);
  
  const registry = await ethers.getContractAt('AgentRegistry', registryAddress || '');
  try {
    const agents = await registry.getAgentList();
    console.log(`Found ${agents.length} agents:`);
    for (const addr of agents) {
      const data = await registry.getAgent(addr);
      console.log(`- ${addr}: Tier ${data.trustTier}, Class ${data.agentClass}, Active: ${data.isActive}`);
    }
  } catch (e) {
    console.error('Error fetching agent list:', e);
  }
}

main().catch(console.error);
