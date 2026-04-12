// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract AgentRegistry is Ownable, ReentrancyGuard {
  enum AgentClass {
    NATIVE,
    EXTERNAL
  }

  struct Agent {
    address owner;
    uint256 inftTokenId;
    bytes32 historyRootHash; // keccak256 of 0G Storage root hash string
    uint8 trustTier;
    uint256 minStakeRequired;
    uint256 totalTasksCompleted;
    uint256 totalSlashEvents;
    bool isActive;
    string[] capabilities;
    uint256 registrationTime;
    AgentClass agentClass;
    string externalEndpoint; // webhook URL for EXTERNAL agents
  }

  mapping(address => Agent) public agents;
  mapping(uint256 => address) public inftToAgent;
  address[] public agentList;
  mapping(address => bool) public authorizedUpdaters;
  IERC721 public inftContract;

  uint256[5] public tierStakeRequirements = [
    0.05 ether,
    0.03 ether,
    0.02 ether,
    0.01 ether,
    0.005 ether
  ];

  event AgentRegistered(address indexed agentAddress, uint256 inftTokenId, AgentClass agentClass);
  event TrustTierUpdated(address indexed agentAddress, uint8 oldTier, uint8 newTier);
  event HistoryUpdated(address indexed agentAddress, bytes32 newRootHash);

  modifier onlyAuthorized() {
    require(authorizedUpdaters[msg.sender] || msg.sender == owner(), 'Not authorized');
    _;
  }

  constructor() Ownable(msg.sender) {}

  function addAuthorizedUpdater(address updater) external onlyOwner {
    authorizedUpdaters[updater] = true;
  }

  function setINFTContract(address _inft) external onlyOwner {
    inftContract = IERC721(_inft);
  }

  function registerNativeAgent(
    address agentAddress,
    uint256 inftTokenId,
    bytes32 initialHistoryHash,
    string[] calldata capabilities
  ) external {
    _register(agentAddress, inftTokenId, initialHistoryHash, capabilities, AgentClass.NATIVE, '');
  }

  function registerExternalAgent(
    address agentAddress,
    uint256 inftTokenId,
    bytes32 initialHistoryHash,
    string[] calldata capabilities,
    string calldata webhookEndpoint
  ) external {
    _register(
      agentAddress,
      inftTokenId,
      initialHistoryHash,
      capabilities,
      AgentClass.EXTERNAL,
      webhookEndpoint
    );
  }

  function _register(
    address agentAddress,
    uint256 inftTokenId,
    bytes32 initialHistoryHash,
    string[] calldata capabilities,
    AgentClass agentClass,
    string memory endpoint
  ) internal {
    require(address(inftContract) != address(0), 'INFT contact not set');
    require(inftContract.ownerOf(inftTokenId) == msg.sender, 'Not INFT owner');
    require(agents[agentAddress].owner == address(0), 'Already registered');
    require(inftToAgent[inftTokenId] == address(0), 'INFT already used');

    uint256 baseStake = tierStakeRequirements[0];
    uint256 requiredStake = agentClass == AgentClass.EXTERNAL ? (baseStake * 150) / 100 : baseStake;

    agents[agentAddress] = Agent({
      owner: msg.sender,
      inftTokenId: inftTokenId,
      historyRootHash: initialHistoryHash,
      trustTier: 0,
      minStakeRequired: requiredStake,
      totalTasksCompleted: 0,
      totalSlashEvents: 0,
      isActive: true,
      capabilities: capabilities,
      registrationTime: block.timestamp,
      agentClass: agentClass,
      externalEndpoint: endpoint
    });

    inftToAgent[inftTokenId] = agentAddress;
    agentList.push(agentAddress);
    emit AgentRegistered(agentAddress, inftTokenId, agentClass);
  }

  function updateHistoryAndTrust(
    address agentAddress,
    bytes32 newHistoryHash,
    uint8 newTrustTier,
    bool wasSlashed
  ) external onlyAuthorized {
    Agent storage agent = agents[agentAddress];
    require(agent.isActive, 'Agent not active');

    uint8 oldTier = agent.trustTier;
    agent.historyRootHash = newHistoryHash;
    agent.trustTier = newTrustTier;
    
    uint256 baseStake = tierStakeRequirements[newTrustTier];
    agent.minStakeRequired = agent.agentClass == AgentClass.EXTERNAL ? (baseStake * 150) / 100 : baseStake;
    
    agent.totalTasksCompleted += 1;
    if (wasSlashed) agent.totalSlashEvents += 1;

    emit HistoryUpdated(agentAddress, newHistoryHash);
    if (oldTier != newTrustTier) emit TrustTierUpdated(agentAddress, oldTier, newTrustTier);
  }

  function getAgentsByCapability(
    string calldata capability
  ) external view returns (address[] memory) {
    uint count = 0;
    for (uint i = 0; i < agentList.length; i++) {
      if (agents[agentList[i]].isActive && _hasCap(agentList[i], capability)) count++;
    }
    address[] memory result = new address[](count);
    uint idx = 0;
    for (uint i = 0; i < agentList.length; i++) {
      if (agents[agentList[i]].isActive && _hasCap(agentList[i], capability))
        result[idx++] = agentList[i];
    }
    return result;
  }

  function _hasCap(address a, string memory cap) internal view returns (bool) {
    string[] memory caps = agents[a].capabilities;
    for (uint i = 0; i < caps.length; i++) {
      if (keccak256(bytes(caps[i])) == keccak256(bytes(cap))) return true;
    }
    return false;
  }

  function getAgent(address agentAddress) external view returns (Agent memory) {
    return agents[agentAddress];
  }
}
