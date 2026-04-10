import { ComputeService } from '../services/computeService';
import { logger } from '@crucible/shared';

export class WritingAgent {
  private computeService: ComputeService;
  readonly capabilities = ['writing'];
  readonly agentAddress: string;

  constructor(address: string, privateKey: string) {
    this.agentAddress = address;
    this.computeService = new ComputeService();
    this.computeService.initialize(privateKey).catch(e => {
       logger.error('Failed to initialize compute service for WritingAgent', e);
    });
  }

  async execute(taskInput: {
    researchOutput: string;
    taskId: string;
    targetWords: number;
  }) {
    logger.info(`WritingAgent (${this.agentAddress}) starting task ${taskInput.taskId}...`);

    const systemPrompt = `You are a professional writing agent. Your job is to take the provided research output and refine it into a polished, engaging narrative. Your final piece must be roughly ${taskInput.targetWords} words.`;

    try {
      const result = await this.computeService.runAgentInference(
        systemPrompt,
        `Research Material:\n${taskInput.researchOutput}`,
        taskInput.taskId,
        this.agentAddress
      );

      logger.info(`WritingAgent completed inference. Attestation obtained: ${result.verified}`);

      return {
        content: result.output,
        outputHash: result.output, // Would be 0G Storage Hash
        attestation: result.attestation
      };
    } catch (error) {
      logger.error('Inference failed', error);
      throw error;
    }
  }
}
