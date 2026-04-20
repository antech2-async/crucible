// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgentStakeVault is ReentrancyGuard {
  mapping(address => uint256) public deposits; // owner => total deposited
  mapping(address => uint256) public lockedStakes; // agentAddress => locked amount
  uint256 public slashedTreasury; // accumulated protocol yield from slashes

  mapping(address => bool) public hasCompletedFirstTask;
  uint256 public subsidyPercent = 50;
  // taskId => agentAddress => amount subsidized by protocol
  mapping(uint256 => mapping(address => uint256)) public subsidies;

  address public escrowContract;
  address public owner;

  error OnlyEscrow();
  error OnlyOwner();
  error NothingDeposited();
  error InsufficientDeposit();
  error InsufficientVaultBalance();
  error FirstTaskAlreadyCompleted();
  error NotEnoughLocked();
  error StakeLost();
  error InsolventSubsidy();
  error InsolventWithdrawal();

  event Deposited(address indexed depositor, uint256 amount);
  event Withdrawn(address indexed depositor, uint256 amount);
  event StakeLocked(address indexed agentAddress, uint256 amount, uint256 taskId);
  event StakeUnlocked(address indexed agentAddress, uint256 amount, bool slashed);

  modifier onlyEscrow() {
    if (msg.sender != escrowContract) revert OnlyEscrow();
    _;
  }
  modifier onlyOwner() {
    if (msg.sender != owner) revert OnlyOwner();
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function setEscrowContract(address _escrow) external onlyOwner {
    escrowContract = _escrow;
  }

  function deposit() external payable {
    if (msg.value == 0) revert NothingDeposited();
    deposits[msg.sender] += msg.value;
    emit Deposited(msg.sender, msg.value);
  }

  function withdraw(uint256 amount) external nonReentrant {
    if (deposits[msg.sender] < amount) revert InsufficientDeposit();
    deposits[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);
    emit Withdrawn(msg.sender, amount);
  }

  function lockStake(
    address agentOwner,
    address agentAddress,
    uint256 amount,
    uint256 taskId
  ) external onlyEscrow {
    if (deposits[agentOwner] < amount) revert InsufficientVaultBalance();
    deposits[agentOwner] -= amount;
    lockedStakes[agentAddress] += amount;
    emit StakeLocked(agentAddress, amount, taskId);
  }

  function lockStakeWithSubsidy(
    address agentOwner,
    address agentAddress,
    uint256 amount,
    uint256 taskId
  ) external onlyEscrow {
    if (hasCompletedFirstTask[agentAddress]) revert FirstTaskAlreadyCompleted();
    
    uint256 subsidy = (amount * subsidyPercent) / 100;
    uint256 agentPays = amount - subsidy;

    if (slashedTreasury < subsidy) revert InsolventSubsidy();
    slashedTreasury -= subsidy;

    deposits[agentOwner] -= agentPays;
    subsidies[taskId][agentAddress] = subsidy;
    lockedStakes[agentAddress] += amount;

    emit StakeLocked(agentAddress, amount, taskId);
  }

  function unlockStake(
    address agentOwner,
    address agentAddress,
    uint256 amount,
    uint256 taskId,
    bool slashed,
    address insuranceReceiver
  ) external onlyEscrow {
    if (lockedStakes[agentAddress] < amount) revert NotEnoughLocked();
    lockedStakes[agentAddress] -= amount;
    uint256 subsidy = subsidies[taskId][agentAddress];

    if (slashed) {
      uint256 fee = (amount * 2) / 100;
      uint256 damagePayout = amount - fee;

      slashedTreasury += fee;
      
      if (subsidy > 0) {
          // Already deducted from slashedTreasury at lock time
          // If we had automated insurance, it would come from here
      }

      if (insuranceReceiver != address(0)) {
        payable(insuranceReceiver).transfer(damagePayout);
      } else {
        slashedTreasury += damagePayout; // Fallback if no receiver
      }
    } else {
      // Refund the agent's portion back to free deposits
      uint256 agentReturn = amount - subsidy;
      deposits[agentOwner] += agentReturn;

      // Recycle protocol subsidy back to treasury
      if (subsidy > 0) {
          slashedTreasury += subsidy;
      }
      if (!hasCompletedFirstTask[agentAddress]) {
          hasCompletedFirstTask[agentAddress] = true;
      }
    }
    emit StakeUnlocked(agentAddress, amount, slashed);
  }

  function getAvailableBalance(
    address agentOwner,
    address
  ) external view returns (uint256) {
    return deposits[agentOwner];
  }

  function withdrawProtocolFunds(uint256 amount) external onlyOwner nonReentrant {
    if (amount > slashedTreasury) revert InsolventWithdrawal();
    slashedTreasury -= amount;
    payable(owner).transfer(amount);
  }

  function fundTreasury() external payable onlyOwner {
    slashedTreasury += msg.value;
  }
}
