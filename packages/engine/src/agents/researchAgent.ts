import { ComputeService } from '../services/computeService';
import { logger } from '@crucible/shared';

export class ResearchAgent {
  private computeService: ComputeService;
  readonly capabilities = ['research'];
  readonly agentAddress: string;

  constructor(address: string, privateKey: string) {
    this.agentAddress = address;
    this.computeService = new ComputeService();
    this.computeService.initialize(privateKey).catch((e) => {
      logger.error('Failed to initialize compute service for ResearchAgent', e);
    });
  }

  async execute(taskInput: {
    topic: string;
    taskId: string;
    minSources: number;
    minWords: number;
  }): Promise<{
    content: string;
    sources: string[];
    wordCount: number;
    outputHash: string;
    attestation: unknown;
  }> {
    logger.info(`ResearchAgent (${this.agentAddress}) starting task ${taskInput.taskId}...`);

    const systemPrompt = `You are a research agent. Your job is to research a topic and return structured findings. Always include at least ${taskInput.minSources} distinct sources. Your response must be at least ${taskInput.minWords} words. Format your response as JSON with fields: summary, sources (array), wordCount.`;

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
      } catch (e) {
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
