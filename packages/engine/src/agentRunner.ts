import { ethers } from 'ethers';
import { logger } from '@crucible/shared';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import { CONTRACT_ADDRESSES } from '@crucible/shared';

// Import our Swarm Agents
import { ResearchAgent } from './agents/researchAgent';

/**
 * The AgentRunner represents the Daemon running on the Agent Owner's infrastructure.
 * It listens for Assignments on-chain, and if its own Node is assigned,
 * it wakes up the appropriate Agent to run the inference locally.
 */
export class AgentRunner {
  private provider: ethers.JsonRpcProvider;
  private escrowContract: ethers.Contract;

  // A local map of the Owner's running agent swarms
  // Maps agentAddress -> Agent Instance
  private localSwarm: Map<string, unknown> = new Map();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.escrowContract = new ethers.Contract(
      CONTRACT_ADDRESSES.TASK_ESCROW,
      TaskEscrowABI.abi,
      this.provider,
    );
  }

  registerLocalAgent(address: string, agentInstance: unknown) {
    this.localSwarm.set(address.toLowerCase(), agentInstance);
    logger.info(`AgentRunner tracking local node: ${address}`);
  }

  startListening() {
    logger.info('AgentRunner Daemon active. Listening for Swarm Assignments on 0G Network...');

    this.escrowContract.on('AgentsAssigned', async (taskId, assignedAgents: string[], _stakes) => {
      // Check if any of OUR local agents were assigned to this task
      for (const assignedAddr of assignedAgents) {
        const localAgent = this.localSwarm.get(assignedAddr.toLowerCase());

        if (localAgent) {
          logger.info(
            `🟢 Swarm Match! Local Agent ${assignedAddr} was assigned to Task ${taskId.toString()}`,
          );

          try {
            // Wake up the local agent
            const output = await localAgent.execute({
              topic: '0G Network State Channels', // Fetch from criteria URI in production
              taskId: taskId.toString(),
              minSources: 5,
              minWords: 500,
            });

            logger.info(`Agent ${assignedAddr} finished inference. Submitting output to chain.`);

            // In production, the AgentRunner would use the Agent's specific private key
            // Rather than the global env key, but for demo brevity we use the connected signer.
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
            const writableEscrow = this.escrowContract.connect(signer) as ethers.Contract;

            // Submit output back to Smart Contract
            const tx = await writableEscrow.submitOutput(
              taskId.toString(),
              output.outputHash,
              output.attestation ? ethers.toUtf8Bytes(JSON.stringify(output.attestation)) : '0x',
            );
            await tx.wait();

            logger.info(`✅ Output verified and submitted by Agent ${assignedAddr}`);
          } catch (e) {
            logger.error(`❌ Agent ${assignedAddr} failed to complete task ${taskId}`, e);
          }
        }
      }
    });
  }
}

// -------------------------------------
// Boot Sequence
// -------------------------------------
if (require.main === module) {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('PRIVATE_KEY required to generate local agent addresses for demo');

  const signer = new ethers.Wallet(pk);
  const myAddress = signer.address;

  const runner = new AgentRunner();

  // Registering three different kinds of agents (in a real scenario, they have distinct addresses)
  runner.registerLocalAgent(myAddress, new ResearchAgent(myAddress, pk));
  // runner.registerLocalAgent(someOtherAddress, new BadActorAgent(someOtherAddress, pk));

  runner.startListening();
}
