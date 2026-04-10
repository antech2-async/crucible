import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { logger } from '@crucible/shared';
import { StorageService } from './services/storageService';
import { ComputeService } from './services/computeService';
import { AssignmentEngine } from './assignmentEngine';
import { ResearchAgent } from './agents/researchAgent';
import { BadActorAgent } from './agents/badActorAgent';

async function main() {
  logger.info('Initializing Crucible Orchestration Engine...');

  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
  const coordinatorWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const storageService = new StorageService(process.env.PRIVATE_KEY!);
  const computeService = new ComputeService();
  const assignmentEngine = new AssignmentEngine();

  // Initialize Demo Agents
  const defaultPk = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const agents = [
    new ResearchAgent(ethers.Wallet.createRandom().address, defaultPk),
    new BadActorAgent(ethers.Wallet.createRandom().address, defaultPk)
  ];

  logger.info('Registering agents and checking gas stipends...');
  for (const agent of agents) {
    const stipend = ethers.parseEther('0.005');
    const balance = await provider.getBalance(agent.agentAddress);
    
    if (balance < stipend) {
      logger.info(`Sending gas stipend to ${agent.agentAddress}...`);
      await coordinatorWallet.sendTransaction({
        to: agent.agentAddress,
        value: stipend - balance
      });
    }
  }

  // Start the task detection loop
  logger.info('Crucible Engine is now listening for TaskEscrow events on 0G Galileo...');
  
  // NOTE: In a real implementation, we would use ethers contract listeners:
  // const escrow = new ethers.Contract(CONTRACT_ADDRESS, ESCROW_ABI, provider);
  // escrow.on('TaskPosted', (taskId, bounty) => { ... });

  setInterval(async () => {
    try {
      // Logic for polling or responding to events would go here
      logger.debug('Polling for new agent coordination tasks...');
    } catch (error) {
      logger.error({ error }, 'Error in main orchestration loop');
    }
  }, 10000);
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error in Engine Startup');
  process.exit(1);
});
