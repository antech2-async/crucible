import { AgentHistory } from '@crucible/shared';

export class TrustScorer {

  // Returns score 0-1
  calculateScore(history: AgentHistory): number {
    if (history.totalTasks < 3) return 0.5; // neutral for new agents

    const lifetimeRate = history.completedHonestly / history.totalTasks;

    // Recent window: sum of last 10 results
    const recentRate = history.recentWindow.length > 0
      ? history.recentWindow.reduce((a, b) => a + b, 0) / history.recentWindow.length
      : 0.5;

    // 60% recent, 40% lifetime — recent behavior matters more
    const weightedScore = (recentRate * 0.6) + (lifetimeRate * 0.4);

    // Slash penalty — each slash reduces score by 5%
    const slashPenalty = history.totalSlashEvents * 0.05;

    return Math.max(0, Math.min(1, weightedScore - slashPenalty));
  }

  // Returns stake multiplier (1.0 = base, 2.5 = 2.5x base stake)
  getStakeMultiplier(score: number): number {
    if (score >= 0.95) return 0.5;   // elite
    if (score >= 0.85) return 0.75;  // high trust
    if (score >= 0.70) return 1.0;   // moderate
    if (score >= 0.50) return 1.5;   // low trust
    return 2.5;                       // new/bad actor
  }

  // Calculate required stake for a given agent and base stake
  calculateRequiredStake(history: AgentHistory, baseStake: bigint): bigint {
    const score = this.calculateScore(history);
    const multiplier = this.getStakeMultiplier(score);
    return BigInt(Math.floor(Number(baseStake) * multiplier));
  }

  // Tit-for-Tat decision: should we cooperate with this agent on next task?
  shouldCooperate(history: AgentHistory): boolean {
    if (history.recentWindow.length === 0) return true; // cooperate first

    // Mirror last action — if they cooperated last time, cooperate
    const lastAction = history.recentWindow[history.recentWindow.length - 1];
    return lastAction === 1;
  }

  // Get tier label for display
  getTierLabel(score: number): string {
    if (score >= 0.95) return 'Elite';
    if (score >= 0.85) return 'High Trust';
    if (score >= 0.70) return 'Moderate';
    if (score >= 0.50) return 'Low Trust';
    return 'New / Unverified';
  }

  getTierColor(score: number): string {
    if (score >= 0.95) return '#FFD700'; // gold
    if (score >= 0.85) return '#4CAF50'; // green
    if (score >= 0.70) return '#2196F3'; // blue
    if (score >= 0.50) return '#FF9800'; // orange
    return '#9E9E9E';                    // grey
  }
}
