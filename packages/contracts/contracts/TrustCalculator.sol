// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TrustCalculator {
  // All scores in basis points (10000 = 100%)
  enum AgentClass { NATIVE, EXTERNAL }

  // All scores in basis points (10000 = 100%)
  function calculateTrustTier(
    uint256 totalTasks,
    uint256 completedHonestly,
    uint256 recentWindowSum, // sum of last 10 booleans (0-10)
    uint256 totalSlashEvents,
    AgentClass agentClass
  ) external pure returns (uint8) {
    if (totalTasks < 3) return 0;

    uint256 lifetimeScore = (completedHonestly * 10000) / totalTasks;
    uint256 recentScore = recentWindowSum * 1000;
    
    // Bayesian prioritization: Recent behavior (60%) vs Lifetime (40%)
    uint256 weighted = (recentScore * 60 + lifetimeScore * 40) / 100;
    
    // Heavy penalty for slashes to maintain economic safety
    uint256 penalty = totalSlashEvents * 500;

    if (penalty >= weighted) return 0;
    uint256 final_ = weighted - penalty;

    uint8 tier = 0;
    if (final_ >= 9500) tier = 4;
    else if (final_ >= 8500) tier = 3;
    else if (final_ >= 7000) tier = 2;
    else if (final_ >= 5000) tier = 1;

    // OCD: ENFORCE EXTERNAL CAP (Section 10/14)
    // External agents cannot reach Tier 4 (Elite)
    if (agentClass == AgentClass.EXTERNAL && tier > 3) {
        tier = 3;
    }

    return tier;
  }

  // Returns multiplier in basis points (10000 = 1x)
  function getStakeMultiplier(uint8 tier) external pure returns (uint256) {
    if (tier == 4) return 5000;
    if (tier == 3) return 7500;
    if (tier == 2) return 10000;
    if (tier == 1) return 15000;
    return 25000;
  }
}
