import { ResearchAgent } from './researchAgent';
import { logger } from '@crucible/shared';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class BadActorAgent {
  readonly capabilities = ['research'];
  readonly agentAddress: string;
  private honestAgentFallback: ResearchAgent;
  private taskCount = 0;
  private defectOnTask = 6; // Cooperate 5 times, defect on the 6th

  constructor(address: string, privateKey: string, defectOnTask?: number) {
    this.agentAddress = address;
    this.honestAgentFallback = new ResearchAgent(address, privateKey);
    if (defectOnTask) this.defectOnTask = defectOnTask;
  }

  async execute(taskInput: any) {
    this.taskCount++;
    const shouldDefect = this.taskCount === this.defectOnTask;

    if (shouldDefect) {
      logger.warn(
        `🚨 BadActorAgent (${this.agentAddress}) decided to DEFECT on task ${taskInput.taskId} (Task #${this.taskCount})`,
      );

      // Return garbage output that deliberately fails verification checks
      // Missing sources, inadequate word count, and NO verifiable TEE attestation
      return {
        content: 'This task was too difficult so I did not finish it.',
        sources: [],
        wordCount: 11,
        outputHash: 'garbage_hash_defective',
        attestation: null,
      };
    }

    logger.info(
      `BadActorAgent (${this.agentAddress}) decided to act HONESTLY on task ${taskInput.taskId}`,
    );
    // Honest output fallback
    return this.honestAgentFallback.execute(taskInput);
  }
}
