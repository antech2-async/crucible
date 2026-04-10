// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AgentRegistry.sol";
import "./TaskEscrow.sol";
import "./TrustCalculator.sol";

/**
 * @title SlashingJudge
 * @dev The referee. Verifies outcomes and triggers escrow resolution and registry updates.
 */
contract SlashingJudge {
    AgentRegistry public registry;
    TaskEscrow public escrow;
    TrustCalculator public calculator;

    mapping(uint256 => bool) public judged;

    event JudgmentIssued(uint256 indexed taskId, address[] agents, bool[] passed);

    constructor(
        address _registry,
        address _escrow,
        address _calculator
    ) {
        registry = AgentRegistry(_registry);
        escrow = TaskEscrow(payable(_escrow));
        calculator = TrustCalculator(_calculator);
    }

    /**
     * @dev Judge a task based on TEE-verified criteria results.
     * @param taskId The task ID to judge.
     * @param agents The list of agents involved.
     * @param criteriaResults Boolean array of whether each agent passed the task criteria.
     * @param newHistoryHashes New 0G Storage root hashes for each agent's behavioral history.
     * @param newBehaviorData Packed behavior data for calculation: [totalTasks, completedHonestly, recentSum, slashEvents] per agent.
     */
    function judgeTask(
        uint256 taskId,
        address[] calldata agents,
        bool[] calldata criteriaResults,
        string[] calldata newHistoryHashes,
        uint256[] calldata newBehaviorData
    ) external {
        require(!judged[taskId], "Already judged");
        require(agents.length == criteriaResults.length, "Length mismatch");

        judged[taskId] = true;

        uint256 totalAgents = agents.length;
        uint256 passingCount = 0;
        for (uint256 i = 0; i < criteriaResults.length; i++) {
            if (criteriaResults[i]) passingCount++;
        }

        // Consensus Enforcement: Requires > 50% agreement for success
        bool hasConsensus = passingCount > (totalAgents / 2);

        if (hasConsensus) {
            // Success Path: Pay out the honest majority
            (, uint256 totalPayment,,,,) = escrow.getTaskBasic(taskId);
            uint256 paymentPerPasser = totalPayment / passingCount;

            uint256[] memory payments = new uint256[](totalAgents);
            for (uint256 i = 0; i < totalAgents; i++) {
                payments[i] = criteriaResults[i] ? paymentPerPasser : 0;
            }

            escrow.resolveTask(taskId, criteriaResults, payments);
        } else {
            // Failure Path: Majority failed or defected. Refund poster.
            // All agents are treated as having failed this specific consensus.
            bool[] memory failStates = new bool[](totalAgents);
            uint256[] memory zeroPayments = new uint256[](totalAgents);
            
            // Note: In failure case, the contract relies on failExpiredTask logic 
            // or a custom resolveFailure bit in Escrow if we want to be more granular.
            // For hackathon closure, we trigger the escrow failure/refund.
            escrow.failConsensus(taskId); 
        }

        for (uint256 i = 0; i < agents.length; i++) {
            uint256 offset = i * 4;
            uint8 newTier = calculator.calculateTrustTier(
                newBehaviorData[offset],
                newBehaviorData[offset + 1],
                newBehaviorData[offset + 2],
                newBehaviorData[offset + 3]
            );

            registry.updateHistoryAndTrust(
                agents[i],
                newHistoryHashes[i],
                newTier,
                !criteriaResults[i]
            );
        }

        emit JudgmentIssued(taskId, agents, criteriaResults);
    }
}
