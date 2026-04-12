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

  event Deposited(address indexed depositor, uint256 amount);
  event Withdrawn(address indexed depositor, uint256 amount);
  event StakeLocked(address indexed agentAddress, uint256 amount, uint256 taskId);
  event StakeUnlocked(address indexed agentAddress, uint256 amount, bool slashed);

  modifier onlyEscrow() {
    require(msg.sender == escrowContract, 'Only escrow');
    _;
  }
  modifier onlyOwner() {
    require(msg.sender == owner, 'Only owner');
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function setEscrowContract(address _escrow) external onlyOwner {
    escrowContract = _escrow;
  }

  function deposit() external payable {
    require(msg.value > 0, 'Nothing deposited');
    deposits[msg.sender] += msg.value;
    emit Deposited(msg.sender, msg.value);
  }

  function withdraw(uint256 amount) external nonReentrant {
    require(deposits[msg.sender] >= amount, 'Insufficient deposit');
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
    require(deposits[agentOwner] >= amount, 'Insufficient vault balance');
    lockedStakes[agentAddress] += amount;
    emit StakeLocked(agentAddress, amount, taskId);
  }

  function lockStakeWithSubsidy(
    address agentOwner,
    address agentAddress,
    uint256 amount,
    uint256 taskId
  ) external onlyEscrow {
    require(!hasCompletedFirstTask[agentAddress], 'Already completed first task');
    
    uint256 subsidy = (amount * subsidyPercent) / 100;
    uint256 agentPays = amount - subsidy;

    require(deposits[agentOwner] >= agentPays, 'Insufficient vault balance for subsidized stake');
    
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
    require(lockedStakes[agentAddress] >= amount, 'Not enough locked');
    lockedStakes[agentAddress] -= amount;

    if (slashed) {
      uint256 subsidy = subsidies[taskId][agentAddress];
      uint256 agentDeduction = amount - subsidy;

      require(deposits[agentOwner] >= agentDeduction, 'Stake lost');
      deposits[agentOwner] -= agentDeduction;

      // OCD: 2% Protocol Fee, 98% Insurance (Liquidated Damages to Poster)
      // Fee is calculated on the FULL amount, but if subsidized, part of it comes from protocol treasury already
      uint256 fee = (amount * 2) / 100;
      uint256 damagePayout = amount - fee;

      slashedTreasury += fee;
      
      // If subsidized, the protocol treasury effectively "pays" its portion by not receiving the full deduction from agent
      // We deduct the subsidy from the treasury balance (or just don't add it)
      // Actually, if it's subsidized, the protocol already "paid" by locking the stake without agent funds.
      // On slash, we use the treasury to cover the insurance payout for the subsidized portion.
      if (subsidy > 0) {
          require(slashedTreasury >= subsidy, 'Insolvent subsidy');
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
    require(amount <= slashedTreasury, 'Insolvent protocol withdrawal');
    slashedTreasury -= amount;
    payable(owner).transfer(amount);
  }

  function fundTreasury() external payable onlyOwner {
    slashedTreasury += msg.value;
  }
}
