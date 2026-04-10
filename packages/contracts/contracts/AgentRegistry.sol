// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentRegistry
 * @dev Stores every registered agent. Tracks their identity, history location, and current trust standing.
 */
contract AgentRegistry is Ownable, ReentrancyGuard {
    struct Agent {
        address owner;
        uint256 inftTokenId;
        string historyRootHash;    // 0G Storage root hash of the behavioral history
        uint8 trustTier;
        uint256 minStakeRequired;   // in wei, recalculated after every task
        uint256 totalTasksCompleted;
        uint256 totalSlashEvents;
        bool isActive;
        string[] capabilities;      // e.g. ["research", "writing", "coding"]
        uint256 registrationTime;
    }

    mapping(address => Agent) public agents;
    mapping(uint256 => address) public inftToAgent; // INFT tokenId -> agent address
    address[] public agentList;

    // Who is authorized to update history and trust (SlashingJudge)
    mapping(address => bool) public authorizedUpdaters;

    // Base stake amounts per tier (in wei)
    uint256[5] public tierStakeRequirements = [
        0.05 ether,   // tier 0: new
        0.03 ether,   // tier 1: low
        0.02 ether,   // tier 2: moderate
        0.01 ether,   // tier 3: high
        0.005 ether   // tier 4: elite
    ];

    event AgentRegistered(address indexed agentAddress, uint256 inftTokenId);
    event TrustTierUpdated(address indexed agentAddress, uint8 oldTier, uint8 newTier);
    event HistoryUpdated(address indexed agentAddress, string newRootHash);
    event AgentDeactivated(address indexed agentAddress);
    event UpdaterAuthorized(address indexed updater, bool status);

    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
        emit UpdaterAuthorized(updater, true);
    }

    function removeAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterAuthorized(updater, false);
    }

    /**
     * @dev Register a new agent with an INFT identity and initial history.
     */
    function registerAgent(
        address agentAddress,
        uint256 inftTokenId,
        string calldata initialHistoryHash,
        string[] calldata capabilities
    ) external {
        require(agents[agentAddress].owner == address(0), "Already registered");
        require(inftToAgent[inftTokenId] == address(0), "INFT already used");

        agents[agentAddress] = Agent({
            owner: msg.sender,
            inftTokenId: inftTokenId,
            historyRootHash: initialHistoryHash,
            trustTier: 0,
            minStakeRequired: tierStakeRequirements[0],
            totalTasksCompleted: 0,
            totalSlashEvents: 0,
            isActive: true,
            capabilities: capabilities,
            registrationTime: block.timestamp
        });

        inftToAgent[inftTokenId] = agentAddress;
        agentList.push(agentAddress);

        emit AgentRegistered(agentAddress, inftTokenId);
    }

    /**
     * @dev Core function called by SlashingJudge after task resolution.
     */
    function updateHistoryAndTrust(
        address agentAddress,
        string calldata newHistoryHash,
        uint8 newTrustTier,
        bool wasSlashed
    ) external onlyAuthorized {
        Agent storage agent = agents[agentAddress];
        require(agent.isActive, "Agent not active");

        uint8 oldTier = agent.trustTier;
        agent.historyRootHash = newHistoryHash;
        agent.trustTier = newTrustTier;
        agent.minStakeRequired = tierStakeRequirements[newTrustTier];
        agent.totalTasksCompleted += 1;
        if (wasSlashed) agent.totalSlashEvents += 1;

        emit HistoryUpdated(agentAddress, newHistoryHash);
        if (oldTier != newTrustTier) {
            emit TrustTierUpdated(agentAddress, oldTier, newTrustTier);
        }
    }

    function getAgentsByCapability(string calldata capability) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < agentList.length; i++) {
            if (hasCapability(agentList[i], capability)) count++;
        }
        address[] memory result = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < agentList.length; i++) {
            if (hasCapability(agentList[i], capability)) {
                result[idx++] = agentList[i];
            }
        }
        return result;
    }

    function hasCapability(address agentAddress, string memory capability) public view returns (bool) {
        string[] memory caps = agents[agentAddress].capabilities;
        bytes32 capabilityHash = keccak256(bytes(capability));
        for (uint256 i = 0; i < caps.length; i++) {
            if (keccak256(bytes(caps[i])) == capabilityHash) {
                return true;
            }
        }
        return false;
    }

    function getAgent(address agentAddress) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    function getTotalAgents() external view returns (uint256) {
        return agentList.length;
    }
}
