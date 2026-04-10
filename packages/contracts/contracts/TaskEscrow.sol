// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TaskEscrow
 * @dev Handles the task lifecycle, holding payments and agent stakes.
 */
contract TaskEscrow is ReentrancyGuard, Ownable {
    enum TaskStatus {
        OPEN,         // Posted, awaiting assignment
        ASSIGNED,     // Agents assigned, work in progress
        VERIFYING,    // Output submitted, pending TEE verification
        COMPLETED,    // All criteria met, payment released
        DISPUTED,     // Poster disputed outcome
        FAILED        // Deadline passed or criteria not met
    }

    struct Task {
        address poster;
        uint256 totalPayment;
        uint256 deadline;
        TaskStatus status;
        address[] assignedAgents;
        uint256[] agentStakes;
        bytes32 criteriaHash;       // Hash for integrity
        string criteriaURI;         // Storage URI for detailed criteria
        mapping(address => bool) agentSubmitted;
        mapping(address => string) agentOutputHashes;
        mapping(address => bytes) agentAttestations;
        uint256 createdAt;
    }

    mapping(uint256 => Task) public tasks;
    uint256 public taskCount;

    address public slashingJudge;
    address public assignmentEngine;

    event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 payment);
    event AgentsAssigned(uint256 indexed taskId, address[] agents, uint256[] stakes);
    event OutputSubmitted(uint256 indexed taskId, address indexed agent, string outputHash);
    event TaskCompleted(uint256 indexed taskId, address[] agents, uint256[] payments);
    event AgentSlashed(uint256 indexed taskId, address indexed agent, uint256 amount);
    event TaskFailed(uint256 indexed taskId, string reason);

    modifier onlySlashingJudge() {
        require(msg.sender == slashingJudge, "Only SlashingJudge");
        _;
    }

    modifier onlyAssignmentEngine() {
        require(msg.sender == assignmentEngine, "Only assignment engine");
        _;
    }

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    function setSlashingJudge(address _slashingJudge) external onlyOwner {
        slashingJudge = _slashingJudge;
    }

    function setAssignmentEngine(address _assignmentEngine) external onlyOwner {
        assignmentEngine = _assignmentEngine;
    }

    function postTask(
        uint256 deadline,
        bytes32 criteriaHash,
        string calldata criteriaURI
    ) external payable returns (uint256) {
        require(msg.value > 0, "Payment required");
        require(deadline > block.timestamp, "Deadline must be future");

        uint256 taskId = taskCount++;
        Task storage task = tasks[taskId];
        task.poster = msg.sender;
        task.totalPayment = msg.value;
        task.deadline = deadline;
        task.status = TaskStatus.OPEN;
        task.criteriaHash = criteriaHash;
        task.criteriaURI = criteriaURI;
        task.createdAt = block.timestamp;

        emit TaskPosted(taskId, msg.sender, msg.value);
        return taskId;
    }

    function assignAgents(
        uint256 taskId,
        address[] calldata agentAddresses,
        uint256[] calldata stakeAmounts
    ) external payable onlyAssignmentEngine {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.OPEN, "Task not open");
        require(agentAddresses.length == stakeAmounts.length, "Length mismatch");

        uint256 totalStakes = 0;
        for (uint256 i = 0; i < stakeAmounts.length; i++) {
            totalStakes += stakeAmounts[i];
        }
        require(msg.value == totalStakes, "Incorrect stake amount sent");

        task.assignedAgents = agentAddresses;
        task.agentStakes = stakeAmounts;
        task.status = TaskStatus.ASSIGNED;

        emit AgentsAssigned(taskId, agentAddresses, stakeAmounts);
    }

    function submitOutput(
        uint256 taskId,
        string calldata outputStorageHash,
        bytes calldata teeAttestation
    ) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.ASSIGNED, "Task not in assigned state");
        require(block.timestamp < task.deadline, "Deadline passed");
        require(!task.agentSubmitted[msg.sender], "Already submitted");

        bool isAssigned = false;
        for (uint256 i = 0; i < task.assignedAgents.length; i++) {
            if (task.assignedAgents[i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        require(isAssigned, "Not assigned to this task");

        task.agentSubmitted[msg.sender] = true;
        task.agentOutputHashes[msg.sender] = outputStorageHash;
        task.agentAttestations[msg.sender] = teeAttestation;

        emit OutputSubmitted(taskId, msg.sender, outputStorageHash);

        bool allSubmitted = true;
        for (uint256 i = 0; i < task.assignedAgents.length; i++) {
            if (!task.agentSubmitted[task.assignedAgents[i]]) {
                allSubmitted = false;
                break;
            }
        }
        if (allSubmitted) {
            task.status = TaskStatus.VERIFYING;
        }
    }

    function resolveTask(
        uint256 taskId,
        bool[] calldata agentsPassed,
        uint256[] calldata paymentAmounts
    ) external onlySlashingJudge nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.VERIFYING, "Not in verifying state");

        task.status = TaskStatus.COMPLETED;

        for (uint256 i = 0; i < task.assignedAgents.length; i++) {
            address agent = task.assignedAgents[i];
            uint256 stake = task.agentStakes[i];

            if (agentsPassed[i]) {
                uint256 payout = stake + paymentAmounts[i];
                payable(agent).transfer(payout);
            } else {
                emit AgentSlashed(taskId, agent, stake);
                // Slashed funds stay in contract
            }
        }

        emit TaskCompleted(taskId, task.assignedAgents, paymentAmounts);
    }

    function failConsensus(uint256 taskId) external onlySlashingJudge nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.VERIFYING, "Not in verifying state");
        _failTask(taskId, "Consensus loss");
    }

    function failExpiredTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.ASSIGNED || task.status == TaskStatus.VERIFYING, "Cannot fail this task");
        require(block.timestamp > task.deadline, "Deadline not passed");

        _failTask(taskId, "Deadline exceeded");
    }

    function _failTask(uint256 taskId, string memory reason) internal {
        Task storage task = tasks[taskId];
        task.status = TaskStatus.FAILED;

        payable(task.poster).transfer(task.totalPayment);

        for (uint256 i = 0; i < task.assignedAgents.length; i++) {
            address agent = task.assignedAgents[i];
            if (!task.agentSubmitted[agent]) {
                emit AgentSlashed(taskId, agent, task.agentStakes[i]);
            } else {
                payable(agent).transfer(task.agentStakes[i]);
            }
        }

        emit TaskFailed(taskId, reason);
    }

    function getTaskBasic(uint256 taskId) external view returns (
        address poster,
        uint256 totalPayment,
        uint256 deadline,
        TaskStatus status,
        bytes32 criteriaHash,
        string memory criteriaURI
    ) {
        Task storage task = tasks[taskId];
        return (task.poster, task.totalPayment, task.deadline, task.status, task.criteriaHash, task.criteriaURI);
    }

    function getTaskAgents(uint256 taskId) external view returns (
        address[] memory agents,
        uint256[] memory stakes
    ) {
        return (tasks[taskId].assignedAgents, tasks[taskId].agentStakes);
    }
}
