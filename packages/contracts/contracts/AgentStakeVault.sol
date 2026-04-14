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

    if (deposits[agentOwner] < agentPays) revert InsufficientVaultBalance();
    
    subsidies[taskId][agentAddress] = subsidy;
    lockedStakes[agentAddress] += amount;
    hasCompletedFirstTask[agentAddress] = true;

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

    if (slashed) {
      uint256 subsidy = subsidies[taskId][agentAddress];
      uint256 agentDeduction = amount - subsidy;

      if (deposits[agentOwner] < agentDeduction) revert StakeLost();
      deposits[agentOwner] -= agentDeduction;

      uint256 fee = (amount * 2) / 100;
      uint256 damagePayout = amount - fee;

      slashedTreasury += fee;
      
      if (subsidy > 0) {
          if (slashedTreasury < subsidy) revert InsolventSubsidy();
          slashedTreasury -= subsidy;
      }

      if (insuranceReceiver != address(0)) {
        payable(insuranceReceiver).transfer(damagePayout);
      } else {
        slashedTreasury += damagePayout; // Fallback if no receiver
      }
    }
    emit StakeUnlocked(agentAddress, amount, slashed);
  }

  function getAvailableBalance(
    address agentOwner,
    address agentAddress
  ) external view returns (uint256) {
    if (deposits[agentOwner] < lockedStakes[agentAddress]) return 0;
    return deposits[agentOwner] - lockedStakes[agentAddress];
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
