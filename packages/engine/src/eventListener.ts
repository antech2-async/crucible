import { ethers } from 'ethers';
import { logger, TaskStatus } from '@crucible/shared';
import { AssignmentEngine } from './assignmentEngine';
import { PipelineCoordinator } from './pipelineCoordinator';

import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import { CONTRACT_ADDRESSES } from '@crucible/shared';

export class EventListener {
  private provider: ethers.JsonRpcProvider;
  private escrowContract: ethers.Contract;
  private assignmentEngine: AssignmentEngine;
  private pipelineCoordinator: PipelineCoordinator;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.escrowContract = new ethers.Contract(
      CONTRACT_ADDRESSES.TASK_ESCROW,
      TaskEscrowABI.abi,
      this.provider,
    );
    this.assignmentEngine = new AssignmentEngine();

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    this.pipelineCoordinator = new PipelineCoordinator(this.provider, signer);
  }

  startListening() {
    logger.info('Crucible Event Listener active. Watching 0G Network for TaskEscrow events...');

    // When a task is posted, assign agents
    this.escrowContract.on('TaskPosted', async (taskId, poster, payment) => {
      logger.info(
        { taskId: taskId.toString(), poster, payment: ethers.formatEther(payment) },
        'New task detected! Assigning agents...',
      );
      await this.assignmentEngine.assignAgentsForTask(taskId.toString());
    });

    // Handle Sequential Pipeline Advancement (Spec Section 13)
    this.escrowContract.on('PipelineAdvanced', async (taskId, stage, nextAgent) => {
      logger.info(
        { taskId: taskId.toString(), stage: Number(stage), nextAgent },
        'Pipeline advanced! Triggering next swarm stage...',
      );
      await this.pipelineCoordinator.triggerNextStage(taskId.toString(), Number(stage), nextAgent);
    });

    // Note: In a production scenario we might listen for OutputSubmitted and track state,
    // but for the demo we assume the agents run synchronously or we trigger processTaskOutposts
    // manually whenVERIFYING state is reached. To simulate the engine catching the VERIFYING state,
    // we could listen to a mock event, but polling the open tasks or listening to OutputSubmitted suffices.
    this.escrowContract.on('OutputSubmitted', async (taskId, agent, outputHash) => {
      logger.info({ taskId: taskId.toString(), agent, outputHash }, 'Agent submitted output.');

      // Check if all agents submitted to trigger judgment
      const [, , , , status] = await this.escrowContract.getTaskBasic(taskId);
      if (Number(status) === TaskStatus.VERIFYING) {
        logger.info(`Task ${taskId} is ready for verification. Dispatching to Judge...`);
        await this.assignmentEngine.processTaskOutputs(taskId.toString());
      }
    });
  }
}

// If run directly:
if (require.main === module) {
  const listener = new EventListener();
  listener.startListening();
}
