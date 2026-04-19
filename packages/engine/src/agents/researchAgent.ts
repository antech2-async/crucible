import { ComputeService } from '../services/computeService';
import { logger } from '@crucible/shared';

export class ResearchAgent {
  private computeService: ComputeService;
  readonly capabilities = ['research'];
  readonly agentAddress: string;

  private initPromise: Promise<void>;

  constructor(address: string, privateKey: string) {
    this.agentAddress = address;
    this.computeService = new ComputeService();
    this.initPromise = this.computeService.initialize(privateKey).catch((e) => {
      logger.error('Failed to initialize compute service for ResearchAgent', e);
      throw e;
    });
  }

  async execute(taskInput: {
    topic: string;
    taskId: string;
    minSources: number;
    minWords: number;
    previousContext?: string;
  }): Promise<{
    content: string;
    sources: string[];
    wordCount: number;
    outputHash: string;
    attestation: unknown;
  }> {
    logger.info(`ResearchAgent (${this.agentAddress}) starting task ${taskInput.taskId}...`);
    await this.initPromise;

    const contextPrompt = taskInput.previousContext 
      ? `\n\nCONTINUATION TASK: Build upon the previous agent's research findings provided below. DO NOT REPEAT their work, but extend it with new insights.\n\n[PREVIOUS AGENT OUTPUT]:\n${taskInput.previousContext}`
      : "";

    const systemPrompt = `You are a research agent. Your job is to research a topic and return structured findings. Always include at least ${taskInput.minSources} distinct sources. Your response must be at least ${taskInput.minWords} words. Format your response as JSON with fields: summary, sources (array), wordCount.${contextPrompt}`;

    try {
      const result = await this.computeService.runAgentInference(
        systemPrompt,
        `Research topic: ${taskInput.topic}`,
        taskInput.taskId,
        this.agentAddress,
      );

      let parsed;
      try {
        // Find JSON block if wrapped in markdown
        const jsonMatch = result.output.match(/```json\n([\s\S]*)\n```/) || [null, result.output];
        parsed = JSON.parse(jsonMatch[1]);
      } catch {
        logger.warn('Failed to parse model output as JSON, attempting fallback parsing.');
        parsed = {
          summary: result.output,
          sources: [],
          wordCount: result.output.split(' ').length,
        };
      }

      logger.info(`ResearchAgent completed inference. Attestation obtained: ${result.verified}`);

      return {
        content: parsed.summary,
        sources: parsed.sources || [],
        wordCount: parsed.wordCount || 0,
        outputHash: result.output, // In full implementation, this represents the 0G Storage Hash
        attestation: result.attestation,
      };
    } catch (error) {
      logger.error('Inference failed', error);
      throw error;
    }
  }
}
