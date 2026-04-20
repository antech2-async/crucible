// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import './AgentRegistry.sol';
import './TaskEscrow.sol';
import './TrustCalculator.sol';

contract SlashingJudge {
  AgentRegistry public registry;
  TaskEscrow public escrow;
  TrustCalculator public calculator;

  mapping(uint256 => bool) public judged;
  mapping(address => bool) public authorizedCallers;
  address public owner;

  event JudgmentIssued(uint256 indexed taskId, address[] agents, bool[] passed);

  constructor(address _registry, address _escrow, address _calculator) {
    registry = AgentRegistry(_registry);
    escrow = TaskEscrow(payable(_escrow));
    calculator = TrustCalculator(_calculator);
    owner = msg.sender;
  }

  modifier onlyAuthorized() {
    require(authorizedCallers[msg.sender] || msg.sender == owner, 'Not authorized');
    _;
  }

  function addAuthorizedCaller(address caller) external {
    require(msg.sender == owner, 'Not owner');
    authorizedCallers[caller] = true;
  }

  // Called by assignment engine after verifying outputs off-chain
  // newBehaviorData: packed as [totalTasks, completedHonestly, recentSum, slashEvents] per agent
  function judgeTask(
    uint256 taskId,
    address[] calldata agents,
    bool[] calldata criteriaResults,
    bytes32[] calldata newHistoryHashes,
    uint256[] calldata newBehaviorData
  ) external onlyAuthorized {
    require(!judged[taskId], 'Already judged');
    require(agents.length == criteriaResults.length, 'Mismatch');

    judged[taskId] = true;

    uint256 passingCount = 0;
    for (uint i = 0; i < criteriaResults.length; i++) {
      if (criteriaResults[i]) passingCount++;
    }

    (, uint256 totalPayment, , , , , ) = escrow.getTaskBasic(taskId);
    uint256 payPerPasser = passingCount > 0 ? totalPayment / passingCount : 0;

    uint256[] memory payments = new uint256[](agents.length);
    for (uint i = 0; i < agents.length; i++) {
      payments[i] = criteriaResults[i] ? payPerPasser : 0;
    }

    escrow.resolveTask(taskId, criteriaResults, payments);

    // Update history and trust tiers for all assigned agents
    for (uint i = 0; i < agents.length; i++) {
      uint o = i * 4;
      AgentRegistry.Agent memory a = registry.getAgent(agents[i]);
      
      require(newBehaviorData[o + 2] <= 10, 'Invalid recentWindowSum');
      uint8 newTier = calculator.calculateTrustTier(
        newBehaviorData[o],
        newBehaviorData[o + 1],
        newBehaviorData[o + 2],
        newBehaviorData[o + 3],
        TrustCalculator.AgentClass(uint8(a.agentClass))
      );
      registry.updateHistoryAndTrust(agents[i], newHistoryHashes[i], newTier, !criteriaResults[i]);
    }

    emit JudgmentIssued(taskId, agents, criteriaResults);
  }
}
