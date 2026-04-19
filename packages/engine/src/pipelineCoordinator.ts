import { ethers } from 'ethers';
import { logger } from '@crucible/shared';
import { StorageService } from './services/storageService';
import { ComputeService } from './services/computeService';
import { CONTRACT_ADDRESSES } from '@crucible/shared';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';

/**
 * PipelineCoordinator (Technical Spec Section 13)
 * Manages the stateful handoff between agents in a sequential task.
 * It ensures that Stage N+1 receives the output of Stage N as context.
 */
export class PipelineCoordinator {
  private escrowContract: ethers.Contract;
  private storageService: StorageService;
  private computeService: ComputeService;

  constructor(provider: ethers.JsonRpcProvider, signer: ethers.Wallet) {
    this.escrowContract = new ethers.Contract(
      CONTRACT_ADDRESSES.TASK_ESCROW,
      TaskEscrowABI.abi,
      signer
    );
    this.storageService = new StorageService(process.env.PRIVATE_KEY!);
    this.computeService = new ComputeService();
  }

  /**
   * Orchestrates the execution of a pipeline stage.
   * Can be triggered by the PipelineAdvanced event.
   */
  async triggerNextStage(taskId: string, stage: number, nextAgentAddress: string): Promise<void> {
    logger.info(`Pipeline Stage Triggered: Task ${taskId}, Stage ${stage}, Agent ${nextAgentAddress}`);

    try {
      // 1. Fetch Task Details and Criteria
      const [, , , , , criteriaURI] = await this.escrowContract.getTaskBasic(taskId);
      const criteria = (await this.storageService.downloadJSON(criteriaURI)) as any;
      const [allAgents] = await this.escrowContract.getTaskAgents(taskId);

      // 2. High-Fidelity Context Handoff: Get previous stage output
      let previousOutput = "";
      if (stage > 0) {
        const prevAgent = allAgents[stage - 1];
        const prevOutputHash = await this.escrowContract.agentOutputHashes(taskId, prevAgent);
        
        if (prevOutputHash && prevOutputHash !== "") {
          logger.info(`🔗 Fetching context from previous stage (Agent: ${prevAgent})`);
          const download = await this.storageService.downloadJSON(prevOutputHash);
          previousOutput = typeof download === 'string' ? download : JSON.stringify(download);
        }
      }

      // 3. Build Prompt with Context
      const stageInstruction = criteria.stages?.[stage] || `Execute task stage ${stage} for topic ${criteriaURI}`;
      const systemPrompt = criteria.systemPrompts?.[stage] || "You are a specialized AI agent in a Crucible swarm.";
      
      const userMessage = previousOutput 
        ? `PREVIOUS_STAGE_CONTEXT:\n${previousOutput}\n\nYOUR_TASK:\n${stageInstruction}`
        : stageInstruction;

      // 4. Run Verified Inference (In production, this might be a webhook to the actual agent)
      logger.info(`🤖 Running inference for Agent ${nextAgentAddress}...`);
      const result = await this.computeService.runAgentInference(systemPrompt, userMessage, taskId, nextAgentAddress);

      // 5. Upload Output to 0G Storage
      const outputData = {
        agentAddress: nextAgentAddress,
        taskId,
        stage,
        output: result,
        timestamp: Date.now()
      };
      const outputHash = await this.storageService.uploadJSON(outputData); // Temporary commit

      // 6. Advance Pipeline On-Chain
      logger.info(`✅ Stage complete. Advancing pipeline on-chain (Output: ${outputHash})`);
      const tx = await this.escrowContract.advancePipeline(taskId, outputHash);
      await tx.wait();

    } catch (error) {
      logger.error({ error, taskId, stage }, 'Failed to orchestrate pipeline stage');
    }
  }
}
