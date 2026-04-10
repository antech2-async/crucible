// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TrustCalculator
 * @dev Pure calculation logic for Bayesian reputation updates.
 */
contract TrustCalculator {

    /**
     * @dev Calculates new trust tier based on behavioral data.
     * All percentages are in basis points (100 = 1%).
     * @param totalTasks Total tasks agent has participated in.
     * @param completedHonestly Total tasks agent completed without slashing.
     * @param recentWindowSum Sum of last 10 results (0 to 10).
     * @param totalSlashEvents Lifetime count of slashings.
     */
    function calculateTrustTier(
        uint256 totalTasks,
        uint256 completedHonestly,
        uint256 recentWindowSum,
        uint256 totalSlashEvents
    ) external pure returns (uint8) {

        // Not enough history — stay at tier 0
        if (totalTasks < 3) return 0;

        // Lifetime score in basis points
        uint256 lifetimeScore = (completedHonestly * 10000) / totalTasks;

        // Recent score (last 10 tasks) in basis points
        uint256 recentScore = recentWindowSum * 1000; 

        // Weighted score: 60% recent, 40% lifetime
        uint256 weightedScore = (recentScore * 60 + lifetimeScore * 40) / 100;

        // Slash penalty: each slash event reduces score by 500bp (5%)
        uint256 slashPenalty = totalSlashEvents * 500;
        if (slashPenalty >= weightedScore) return 0;
        uint256 finalScore = weightedScore - slashPenalty;

        // Map score to tier
        if (finalScore >= 9500) return 4;       // 95%+  elite
        if (finalScore >= 8500) return 3;       // 85%+  high trust
        if (finalScore >= 7000) return 2;       // 70%+  moderate trust
        if (finalScore >= 5000) return 1;       // 50%+  low trust
        return 0;                               // below 50%
    }

    /**
     * @dev Dynamic stake multiplier — lower tier = more stake required.
     * Returns a multiplier in basis points (10000 = 1x).
     */
    function getStakeMultiplier(uint8 tier) external pure returns (uint256) {
        if (tier == 4) return 5000;    // 0.5x
        if (tier == 3) return 7500;    // 0.75x
        if (tier == 2) return 10000;   // 1x base
        if (tier == 1) return 15000;   // 1.5x
        return 25000;                  // 2.5x
    }
}
