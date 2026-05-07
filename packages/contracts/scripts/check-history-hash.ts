import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function main() {
  const registryAddress = '0xB82008565FdC7e44609fA118A4a681E92581e680';
  const aliceAddress = '0x2Fec90330f97260220Ce409861fD020EBfF3dE3b';

  const registry = await ethers.getContractAt('AgentRegistry', registryAddress);
  const agent = await registry.getAgent(aliceAddress);

  console.log(`Current History Hash: ${agent.historyRootHash}`);
}

main().catch(console.error);
