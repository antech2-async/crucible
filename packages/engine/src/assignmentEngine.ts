/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import { StorageService } from './services/storageService';
import { ComputeService } from './services/computeService';
import { TrustScorer } from './trustScorer';
import { CriteriaChecker } from './criteriaChecker';
import { costTracker } from './costTracker';
import { logger } from '@crucible/shared';

// Load ABIs
import AgentRegistryABI from '../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import SlashingJudgeABI from '../../contracts/artifacts/contracts/SlashingJudge.sol/SlashingJudge.json';
import { CONTRACT_ADDRESSES } from '@crucible/shared';

export class AssignmentEngine {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private registryContract: ethers.Contract;
  private escrowContract: ethers.Contract;
  private judgeContract: ethers.Contract;
  private storageService: StorageService;
  private computeService: ComputeService;
  private trustScorer: TrustScorer;
  private criteriaChecker: CriteriaChecker;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);

    this.registryContract = new ethers.Contract(
      CONTRACT_ADDRESSES.AGENT_REGISTRY,
      AgentRegistryABI.abi,
      this.signer,
    );
    this.escrowContract = new ethers.Contract(
      CONTRACT_ADDRESSES.TASK_ESCROW,
      TaskEscrowABI.abi,
      this.signer,
    );
    this.judgeContract = new ethers.Contract(
      CONTRACT_ADDRESSES.SLASHING_JUDGE,
      SlashingJudgeABI.abi,
      this.signer,
    );

    this.storageService = new StorageService(process.env.PRIVATE_KEY!);
    this.computeService = new ComputeService();
    this.trustScorer = new TrustScorer();
    this.criteriaChecker = new CriteriaChecker();
  }

  async assignAgentsForTask(taskId: string): Promise<void> {
    try {
      logger.info(`Assigning agents for task ${taskId}`);

      // 1. Get task criteria
      const [, , , , , criteriaURI] = await this.escrowContract.getTaskBasic(taskId);
      const criteria = (await this.storageService.downloadHistory(criteriaURI)) as any;

      // 2. Find agents with required capabilities
      const requiredCaps = criteria.requiredCapabilities as string[];
      let candidates: string[] = [];

      for (const cap of requiredCaps) {
        const capAgents = await this.registryContract.getAgentsByCapability(cap);
        candidates = [...new Set([...candidates, ...capAgents])]; // Unique candidates
      }

      if (candidates.length === 0) {
        logger.warn(`No agents found with capabilities: ${requiredCaps.join(', ')}`);
        return;
      }

      // 3. Score each candidate
      const scoredAgents = await this.scoreAgents(candidates);

      // 4. Select best agents — one per required capability
      const selected = this.selectBestAgents(scoredAgents, requiredCaps);

      if (selected.length === 0) {
        logger.warn('Failed to select any agents meeting criteria');
        return;
      }

      // 5. Calculate required stakes
      const stakes = selected.map((a) => a.minStakeRequired);
      const totalStake = stakes.reduce((sum, s) => sum + BigInt(s), BigInt(0));

      // 6. Assign on-chain
      logger.info(`Dispatching tx to TaskEscrow for assignment, total stake: ${totalStake}`);
      const tx = await this.escrowContract.assignAgents(
        taskId,
        selected.map((a) => a.address),
        stakes,
        { value: totalStake },
      );
      await tx.wait();

      logger.info(`Successfully assigned ${selected.length} agents to task ${taskId}`);
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to assign agents');
    }
  }

  private async scoreAgents(agentAddresses: string[]) {
    return Promise.all(
      agentAddresses.map(async (address) => {
        const agentData = await this.registryContract.getAgent(address);
        const history = (await this.storageService.downloadHistory(
          agentData.historyRootHash,
        )) as any;
        
        // Multi-Factor Meritocratic Scoring (Spec Section 15)
        // Score = TrustScore * SpeedScore * CostScore
        const trustScore = this.trustScorer.calculateScore(history);
        
        // SpeedScore: Normalized 0-1 based on average latency in history
        // CostScore: Inversely proportional to staking multiplier (higher tier = lower cost/multiplier)
        const speedScore = history.avgLatency ? Math.min(1, 5000 / history.avgLatency) : 0.8;
        const multiplier = this.trustScorer.getStakeMultiplier(trustScore, history.agentClass);
        const costScore = 1 / multiplier; 

        const compositeScore = trustScore * speedScore * costScore;

        return {
          address,
          score: compositeScore,
          trustScore,
          trustTier: agentData.trustTier,
          minStakeRequired: agentData.minStakeRequired,
          capabilities: agentData.capabilities,
          history,
        };
      }),
    );
  }

  private selectBestAgents(scored: any[], requiredCaps: string[]) {
    // Meritocratic Sorting: Prioritize capacity first, then composite merit score
    const sorted = scored.sort((a, b) => {
      const aMatchCount = a.capabilities.filter((c: string) => requiredCaps.includes(c)).length;
      const bMatchCount = b.capabilities.filter((c: string) => requiredCaps.includes(c)).length;
      if (aMatchCount !== bMatchCount) return bMatchCount - aMatchCount;
      return b.score - a.score;
    });

    const selected: any[] = [];
    const coveredCaps = new Set<string>();

    for (const agent of sorted) {
      const matches = agent.capabilities.filter(
        (c: string) => requiredCaps.includes(c) && !coveredCaps.has(c),
      );
      if (matches.length > 0) {
        selected.push(agent);
        matches.forEach((m: string) => coveredCaps.add(m));
      }
      if (coveredCaps.size === requiredCaps.length) break;
    }

    return selected;
  }

  async processTaskOutputs(taskId: string): Promise<void> {
    try {
      logger.info(`Processing outputs for task ${taskId}`);

      const [, totalPayment, , , , criteriaURI] = await this.escrowContract.getTaskBasic(taskId);
      const [agents] = await this.escrowContract.getTaskAgents(taskId);
      const criteria = (await this.storageService.downloadHistory(criteriaURI)) as any;

      const criteriaResults: boolean[] = [];
      const newHistoryHashes: string[] = [];
      const newBehaviorData: bigint[] = [];

      for (const agentAddress of agents) {
        const agentData = await this.registryContract.getAgent(agentAddress);

        // OCD Hardening: Fetch actual content CID from the escrow state
        const outputCID = await this.escrowContract.agentOutputHashes(taskId, agentAddress);
        
        let actualContent = "";
        try {
            if (outputCID && outputCID !== "") {
                const download = await this.storageService.downloadHistory(outputCID);
                actualContent = typeof download === 'string' ? download : JSON.stringify(download);
            } else {
                logger.warn(`No output hash found for ${agentAddress} on task ${taskId}`);
            }
        } catch (err) {
            logger.error({ err, outputCID }, `Failed to download output from 0G Storage`);
        }

        const passed = await this.criteriaChecker.verifyCriteria(
          agentAddress,
          taskId,
          criteria.criteria,
          actualContent || 'EMPTY_OUTPUT_FAILURE',
        );
        criteriaResults.push(passed);

        const { newHash, updatedHistory } = await this.storageService.updateAgentHistory(
          agentData.historyRootHash,
          {
            taskId,
            passed,
            collaborators: agents.filter((a: string) => a !== agentAddress),
            outputHash: outputCID || '',
            paymentReceived: passed ? (BigInt(totalPayment) / BigInt(agents.length)).toString() : '0',
          },
        );
        newHistoryHashes.push(newHash);

        newBehaviorData.push(
          BigInt(updatedHistory.totalTasks),
          BigInt(updatedHistory.completedHonestly),
          BigInt((updatedHistory.recentWindow as number[]).reduce((a, b) => a + b, 0)),
          BigInt(updatedHistory.totalSlashEvents),
        );
      }

      // Hardening: Perfectly align signature with SlashingJudge.sol
      logger.info(`Judging task ${taskId} on-chain...`);
      const tx = await this.judgeContract.judgeTask(
        taskId,
        agents,
        criteriaResults,
        newHistoryHashes,
        newBehaviorData,
      );
      await tx.wait();

      // 7. Track Sustainability (Section 18)
      const fee = (BigInt(totalPayment) * 2n) / 100n;
      costTracker.recordFee(fee);
      costTracker.logAudit();

      logger.info({ criteriaResults }, `Task ${taskId} judged successfully.`);
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to process task outputs');
    }
  }
}
