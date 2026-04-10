import { ResearchAgent } from './researchAgent';
import { logger } from '@crucible/shared';

export class BadActorAgent {
  readonly capabilities = ['research'];
  private defectionRate = 0.4; // defects 40% of the time
  readonly agentAddress: string;
  private honestAgentFallback: ResearchAgent;

  constructor(address: string, privateKey: string) {
    this.agentAddress = address;
    this.honestAgentFallback = new ResearchAgent(address, privateKey);
  }

  async execute(taskInput: any) {
    const shouldDefect = Math.random() < this.defectionRate;

    if (shouldDefect) {
      logger.warn(`🚨 BadActorAgent (${this.agentAddress}) decided to DEFECT on task ${taskInput.taskId}`);
      
      // Return garbage output that deliberately fails verification checks
      // Missing sources, inadequate word count, and NO verifiable TEE attestation
      return {
        content: 'This task was too difficult so I did not finish it.',
        sources: [],
        wordCount: 11,
        outputHash: 'garbage_hash_defective',
        attestation: null
      };
    }

    logger.info(`BadActorAgent (${this.agentAddress}) decided to act HONESTLY on task ${taskInput.taskId}`);
    // Honest output fallback
    return this.honestAgentFallback.execute(taskInput);
  }
}
