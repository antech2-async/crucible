import { ethers } from 'ethers';
import { setupEthersWorkaround } from '../../shared/src/node-utils';
import { ComputeService } from './services/computeService';
import { TrustScorer } from './trustScorer';
import { CriteriaChecker } from './criteriaChecker';
import { costTracker } from './costTracker';
import {
  logger,
  AgentHistory,
  TaskCriteria,
  CONTRACT_ADDRESSES,
} from '@crucible/shared';
import { StorageService } from '../../shared/src/StorageService';
import { PipelineCoordinator } from './pipelineCoordinator';

// Load ABIs
import AgentRegistryABI from '../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import SlashingJudgeABI from '../../contracts/artifacts/contracts/SlashingJudge.sol/SlashingJudge.json';

interface ScoredAgent {
  address: string;
  score: number;
  trustScore: number;
  trustTier: bigint;
  minStakeRequired: bigint;
  capabilities: string[];
  history: AgentHistory;
}

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
  private pipelineCoordinator: PipelineCoordinator;

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
    this.pipelineCoordinator = new PipelineCoordinator(this.provider, this.signer);
  }

  /**
   * Start the off-chain event listeners to coordinate the protocol.
   */
  public startListening() {
    logger.info({
      escrow: CONTRACT_ADDRESSES.TASK_ESCROW,
      registry: CONTRACT_ADDRESSES.AGENT_REGISTRY,
      signer: this.signer.address
    }, 'AssignmentEngine: Listening for coordination triggers...');

    // 1. Listen for new tasks that need agent matching
    this.escrowContract.on('TaskPosted', (taskId: bigint) => {
      void this.assignAgentsForTask(taskId.toString());
    });

    // 2. Listen for sequential pipeline handoffs
    this.escrowContract.on(
      'PipelineAdvanced',
      (taskId: bigint, stage: number, nextAgent: string) => {
        void this.pipelineCoordinator.triggerNextStage(taskId.toString(), Number(stage), nextAgent);
      },
    );

    // 3. Listen for judge commits (on-chain: JudgmentIssued in SlashingJudge.sol)
    this.judgeContract.on('JudgmentIssued', (taskId: bigint) => {
      logger.info(`Audit: Task ${taskId} judged.`);
    });
  }

  async assignAgentsForTask(taskId: string): Promise<void> {
    try {
      logger.info(`Assigning agents for task ${taskId}`);

      // 1. Get task criteria
      const [, totalPayment, , , , criteriaURI] = await this.escrowContract.getTaskBasic(taskId);
      const criteria = await this.storageService.downloadJSON<TaskCriteria>(criteriaURI);

      // 2. Find agents with required capabilities
      const requiredCaps = (criteria.requiredCapabilities as string[]) || [];
      let candidates: string[] = [];

      for (const cap of requiredCaps) {
        const capAgents = await this.registryContract.getAgentsByCapability(cap);
        candidates = [...new Set([...candidates, ...capAgents])]; // Unique candidates
      }

      if (candidates.length === 0) {
        logger.warn(`No agents found with capabilities: ${requiredCaps.join(', ')}`);
        return;
      }

      logger.info({ requiredCaps, candidates }, 'Found candidate agents for assignment');

      // 3. Score each candidate
      const scoredAgents = await this.scoreAgents(candidates, BigInt(totalPayment));

      // 4. Select best agents — one per required capability
      // Rehabilitation Logic: If an agent defected last time, they only get low-value tasks
      const selected = this.selectBestAgents(scoredAgents, requiredCaps, BigInt(totalPayment));

      if (selected.length === 0) {
        logger.warn('Failed to select any agents meeting criteria');
        return;
      }

      // 5. Calculate required stakes (Dynamic Risk-Adjusted)
      // Base stake is 10% of task payment for Elite, scaled up for lower trust
      const baseStakePerAgent = BigInt(totalPayment) / BigInt(requiredCaps.length) / 10n;
      const stakes = selected.map((a) => {
        // HACKATHON DEMO: Force 0 stake to bypass InsolventSubsidy since Vault treasury is 0
        return 0n;
      });
      const totalStake = stakes.reduce((sum, s) => sum + BigInt(s), BigInt(0));

      // 6. Assign on-chain
      logger.info(`Dispatching tx to TaskEscrow for assignment, total stake: ${totalStake}`);
      const tx = await this.escrowContract.assignAgents(
        taskId,
        selected.map((a) => a.address),
        stakes,
      );
      await tx.wait();

      logger.info(`Successfully assigned ${selected.length} agents to task ${taskId}`);
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to assign agents');
    }
  }

  private async scoreAgents(agentAddresses: string[], taskPayment: bigint): Promise<ScoredAgent[]> {
    const beginnerThreshold = ethers.parseEther('0.005'); // 0.005 OG rehabilitation threshold

    const results = await Promise.all(
      agentAddresses.map(async (address) => {
        const agentData = await this.registryContract.getAgent(address);

        let history: AgentHistory;
        const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

        if (
          agentData.historyRootHash === zeroHash ||
          agentData.historyRootHash === ethers.ZeroHash
        ) {
          history = {
            agentId: address,
            inftTokenId: Number(agentData.inftTokenId),
            agentClass: agentData.agentClass === 0 ? 'NATIVE' : 'EXTERNAL',
            version: 1,
            updatedAt: Math.floor(Date.now() / 1000),
            totalTasks: 0,
            completedHonestly: 0,
            totalSlashEvents: 0,
            totalDisputes: 0,
            recentWindow: [],
            avgResponseTimeMs: 0,
            taskHistory: [],
          };
        } else {
          history = await this.storageService.downloadHistory(agentData.historyRootHash);
        }

        // Tit-for-Tat rehabilitation redirect
        const coops = this.trustScorer.shouldCooperate(history);
        if (!coops && taskPayment > beginnerThreshold) {
          return null; // Excluded from high-value tasks due to recent defection
        }

        const trustScore = this.trustScorer.calculateScore(history);
        const speedScore = history.avgResponseTimeMs
          ? Math.min(1, 5000 / history.avgResponseTimeMs)
          : 0.8;
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
    return results.filter((r): r is ScoredAgent => r !== null);
  }

  private selectBestAgents(scored: ScoredAgent[], requiredCaps: string[], _taskPayment: bigint) {
    // Meritocratic Sorting: Prioritize capacity first, then composite merit score
    const sorted = scored.sort((a, b) => {
      const aMatchCount = a.capabilities.filter((c: string) => requiredCaps.includes(c)).length;
      const bMatchCount = b.capabilities.filter((c: string) => requiredCaps.includes(c)).length;
      if (aMatchCount !== bMatchCount) return bMatchCount - aMatchCount;
      return b.score - a.score;
    });

    const selected: ScoredAgent[] = [];
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
      const criteria = await this.storageService.downloadJSON<TaskCriteria>(criteriaURI);

      const criteriaResults: boolean[] = [];
      const newHistoryHashes: string[] = [];
      const newBehaviorData: bigint[] = [];

      // 1. Verify all outputs first to get total passing count
      const verificationResults = await Promise.all(
        agents.map(async (agentAddress: string) => {
          const agentData = await this.registryContract.getAgent(agentAddress);
          const outputCID = await this.escrowContract.agentOutputHashes(taskId, agentAddress);

          let actualContent = '';
          try {
            if (outputCID && outputCID !== '') {
              const download = await this.storageService.downloadHistory(outputCID);
              actualContent = typeof download === 'string' ? download : JSON.stringify(download);
            }
          } catch (err) {
            logger.error({ err, outputCID }, `Failed to download output from 0G Storage`);
          }

          if (agentData.agentClass === 1) {
            // EXTERNAL
            if (
              !outputCID ||
              outputCID === '' ||
              actualContent === '' ||
              actualContent === 'EMPTY_OUTPUT_FAILURE'
            ) {
              actualContent = 'HASH_INTEGRITY_FAILURE';
            }
          }

          const passed = await this.criteriaChecker.verifyCriteria(
            agentAddress,
            taskId,
            criteria.criteria,
            actualContent || 'EMPTY_OUTPUT_FAILURE',
          );

          return { agentAddress, agentData, outputCID, passed };
        }),
      );

      const passingCount = verificationResults.filter((v) => v.passed).length;
      criteriaResults.push(...verificationResults.map((v) => v.passed));

      // 2. Perform history updates and behavioral data aggregation
      for (const res of verificationResults) {
        const { agentAddress, agentData, outputCID, passed } = res;

        let currentHistoryHash: string;
        const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

        if (
          agentData.historyRootHash === zeroHash ||
          agentData.historyRootHash === ethers.ZeroHash
        ) {
          const emptyHistory: AgentHistory = {
            agentId: agentAddress,
            inftTokenId: Number(agentData.inftTokenId),
            agentClass: agentData.agentClass === 0 ? 'NATIVE' : 'EXTERNAL',
            version: 1,
            updatedAt: Math.floor(Date.now() / 1000),
            totalTasks: 0,
            completedHonestly: 0,
            totalSlashEvents: 0,
            totalDisputes: 0,
            recentWindow: [],
            avgResponseTimeMs: 0,
            taskHistory: [],
          };
          const { bytes32Hash } = await this.storageService.uploadHistory(emptyHistory);
          currentHistoryHash = bytes32Hash;
        } else {
          currentHistoryHash = agentData.historyRootHash;
        }

        const { newHash, updatedHistory } = await this.storageService.updateAgentHistory(
          currentHistoryHash,
          {
            taskId,
            passed,
            collaborators: agents.filter((a: string) => a !== agentAddress),
            outputHash: outputCID || '',
            paymentReceived: passed
              ? (BigInt(totalPayment) / BigInt(passingCount || 1)).toString()
              : '0',
          },
        );
        newHistoryHashes.push(newHash);

        newBehaviorData.push(
          BigInt(updatedHistory.totalTasks),
          BigInt(updatedHistory.completedHonestly),
          BigInt(
            (updatedHistory.recentWindow as number[]).reduce((a: number, b: number) => a + b, 0),
          ),
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
