// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentStakeVault.sol";
import "./AgentRegistry.sol";

contract TaskEscrow is ReentrancyGuard, Ownable {
    enum TaskStatus {
        OPEN,
        ASSIGNED,
        IN_PIPELINE,
        VERIFYING,
        COMPLETED,
        PARTIALLY_COMPLETED,
        DISPUTED,
        FAILED
    }

    struct Task {
        address poster;
        uint256 totalPayment;
        uint256 deadline;
        uint256 disputeWindow;
        TaskStatus status;
        address[] assignedAgents;
        uint256[] agentStakes;
        bytes32 criteriaHash;
        string criteriaURI;
        bool isSequential;
        uint8 currentPipelineStage;
        uint256 createdAt;
        uint256 completedAt;
        uint256 remainingPosterRefund;
    }

    // Separate mappings (cannot have mappings inside struct stored in mapping in older Solidity)
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => mapping(address => bool)) public agentSubmitted;
    mapping(uint256 => mapping(address => string)) public agentOutputHashes;
    mapping(uint256 => mapping(address => bytes)) public agentAttestations;
    mapping(uint256 => mapping(address => uint256)) public pendingPayments;
    mapping(uint256 => mapping(address => uint256)) public earliestClaimTime;

    uint256 public taskCount;
    address public slashingJudge;
    address public assignmentEngine;
    AgentStakeVault public vault;
    AgentRegistry public registry;

    uint256 public protocolFeePercent = 2;
    uint256 public defaultDisputeWindow = 24 hours;

    error UnauthorizedEngine();
    error AlreadySubmitted();
    error NotVerifying();
    error DeadlineFuture();
    error PaymentRequired();
    error NotOpen();
    error LengthMismatch();
    error NotPoster();
    error CannotDispute();
    error WindowClosed();
    error CannotFail();
    error NotExpired();

    event TaskPosted(
        uint256 indexed taskId,
        address indexed poster,
        uint256 payment,
        bool isSequential
    );
    event AgentsAssigned(
        uint256 indexed taskId,
        address[] agents,
        uint256[] stakes
    );
    event PipelineAdvanced(
        uint256 indexed taskId,
        uint8 stage,
        address nextAgent
    );
    event OutputSubmitted(
        uint256 indexed taskId,
        address indexed agent,
        string outputHash
    );
    event TaskCompleted(
        uint256 indexed taskId,
        address[] agents,
        uint256[] payments
    );
    event TaskPartiallyCompleted(
        uint256 indexed taskId,
        uint256 passCount,
        uint256 failCount
    );
    event AgentSlashed(
        uint256 indexed taskId,
        address indexed agent,
        uint256 amount
    );
    event TaskDisputed(uint256 indexed taskId);
    event DisputeResolved(uint256 indexed taskId, bool refundPoster);
    event TaskFailed(uint256 indexed taskId, string reason);
    event PaymentClaimed(
        uint256 indexed taskId,
        address indexed agent,
        uint256 amount
    );

    modifier onlyJudge() {
        if (msg.sender != slashingJudge) revert("Only judge");
        _;
    }
    modifier onlyEngine() {
        if (msg.sender != assignmentEngine) revert UnauthorizedEngine();
        _;
    }

    constructor(
        address _engine,
        address _vault,
        address _registry
    ) Ownable(msg.sender) {
        assignmentEngine = _engine;
        vault = AgentStakeVault(payable(_vault));
        registry = AgentRegistry(_registry);
    }

    function setSlashingJudge(address _judge) external onlyOwner {
        slashingJudge = _judge;
    }

    function postTask(
        uint256 deadline,
        bytes32 criteriaHash,
        string calldata criteriaURI,
        bool isSequential
    ) external payable returns (uint256) {
        if (msg.value == 0) revert PaymentRequired();
        if (deadline <= block.timestamp) revert DeadlineFuture();

        uint256 taskId = taskCount++;
        Task storage t = tasks[taskId];
        t.poster = msg.sender;
        t.totalPayment = msg.value;
        t.deadline = deadline;
        t.disputeWindow = defaultDisputeWindow;
        t.status = TaskStatus.OPEN;
        t.criteriaHash = criteriaHash;
        t.criteriaURI = criteriaURI;
        t.isSequential = isSequential;
        t.createdAt = block.timestamp;

        emit TaskPosted(taskId, msg.sender, msg.value, isSequential);
        return taskId;
    }

    function assignAgents(
        uint256 taskId,
        address[] calldata agents,
        uint256[] calldata stakes
    ) external onlyEngine {
        Task storage t = tasks[taskId];
        if (t.status != TaskStatus.OPEN) revert NotOpen();
        if (agents.length != stakes.length) revert LengthMismatch();

        for (uint i = 0; i < agents.length; i++) {
            AgentRegistry.Agent memory a = registry.getAgent(agents[i]);
            if (
                a.totalTasksCompleted == 0 &&
                !vault.hasCompletedFirstTask(agents[i])
            ) {
                vault.lockStakeWithSubsidy(
                    a.owner,
                    agents[i],
                    stakes[i],
                    taskId
                );
            } else {
                vault.lockStake(a.owner, agents[i], stakes[i], taskId);
            }
        }

        t.assignedAgents = agents;
        t.agentStakes = stakes;
        t.status = t.isSequential
            ? TaskStatus.IN_PIPELINE
            : TaskStatus.ASSIGNED;

        emit AgentsAssigned(taskId, agents, stakes);
        if (t.isSequential) emit PipelineAdvanced(taskId, 0, agents[0]);
    }

    // Sequential: engine calls this as each stage completes
    function advancePipeline(
        uint256 taskId,
        string calldata outputHash
    ) external onlyEngine {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.IN_PIPELINE, "Not in pipeline");

        address currentAgent = t.assignedAgents[t.currentPipelineStage];
        agentSubmitted[taskId][currentAgent] = true;
        agentOutputHashes[taskId][currentAgent] = outputHash;
        t.currentPipelineStage++;

        if (t.currentPipelineStage >= t.assignedAgents.length) {
            t.status = TaskStatus.VERIFYING;
        } else {
            emit PipelineAdvanced(
                taskId,
                t.currentPipelineStage,
                t.assignedAgents[t.currentPipelineStage]
            );
        }
    }

    // Parallel: each agent submits independently
    function submitOutput(
        uint256 taskId,
        string calldata outputHash,
        bytes calldata attestation
    ) external nonReentrant {
        Task storage t = tasks[taskId];
        if (
            t.status != TaskStatus.ASSIGNED &&
            t.status != TaskStatus.IN_PIPELINE
        ) revert("Task not in submission state");
        if (agentSubmitted[taskId][msg.sender]) revert AlreadySubmitted();

        bool assigned = false;
        for (uint i = 0; i < t.assignedAgents.length; i++) {
            if (t.assignedAgents[i] == msg.sender) {
                assigned = true;
                break;
            }
        }
        require(assigned, "Not assigned to task");

        agentSubmitted[taskId][msg.sender] = true;
        agentOutputHashes[taskId][msg.sender] = outputHash;
        agentAttestations[taskId][msg.sender] = attestation;
        emit OutputSubmitted(taskId, msg.sender, outputHash);

        bool allDone = true;
        for (uint i = 0; i < t.assignedAgents.length; i++) {
            if (!agentSubmitted[taskId][t.assignedAgents[i]]) {
                allDone = false;
                break;
            }
        }
        if (allDone) t.status = TaskStatus.VERIFYING;
    }

    function resolveTask(
        uint256 taskId,
        bool[] calldata passed,
        uint256[] calldata payments
    ) external onlyJudge nonReentrant {
        Task storage t = tasks[taskId];
        if (t.status != TaskStatus.VERIFYING) revert NotVerifying();

        uint256 passCount = 0;
        uint256 failCount = 0;

        for (uint i = 0; i < passed.length; i++) {
            if (passed[i]) passCount++;
            else failCount++;
        }

        bool consensusReached = passCount > t.assignedAgents.length / 2;

        for (uint i = 0; i < t.assignedAgents.length; i++) {
            address agent = t.assignedAgents[i];
            AgentRegistry.Agent memory a = registry.getAgent(agent);

            if (passed[i]) {
                vault.unlockStake(
                    a.owner,
                    agent,
                    t.agentStakes[i],
                    taskId,
                    false,
                    address(0)
                );
                // Only pay if consensus was reached
                if (consensusReached && payments[i] > 0) {
                    pendingPayments[taskId][agent] = payments[i];
                    earliestClaimTime[taskId][agent] =
                        block.timestamp +
                        t.disputeWindow;
                }
            } else {
                vault.unlockStake(
                    a.owner,
                    agent,
                    t.agentStakes[i],
                    taskId,
                    true,
                    t.poster
                );
                emit AgentSlashed(taskId, agent, t.agentStakes[i]);
            }
        }

        if (consensusReached) {
            uint256 totalAllocatedToAgents = 0;
            for (uint i = 0; i < payments.length; i++) {
                if (passed[i]) totalAllocatedToAgents += payments[i];
            }
            t.remainingPosterRefund = t.totalPayment - totalAllocatedToAgents;

            if (failCount == 0) {
                t.status = TaskStatus.COMPLETED;
                emit TaskCompleted(taskId, t.assignedAgents, payments);
            } else {
                t.status = TaskStatus.PARTIALLY_COMPLETED;
                emit TaskPartiallyCompleted(taskId, passCount, failCount);
            }
        } else {
            t.status = TaskStatus.FAILED;
            payable(t.poster).transfer(t.totalPayment);
            emit TaskFailed(taskId, "Consensus failure");
        }

        t.completedAt = block.timestamp;
    }

    function disputeTask(uint256 taskId) external {
        Task storage t = tasks[taskId];
        if (msg.sender != t.poster) revert NotPoster();
        if (
            t.status != TaskStatus.COMPLETED &&
            t.status != TaskStatus.PARTIALLY_COMPLETED
        ) revert CannotDispute();
        if (block.timestamp >= t.completedAt + t.disputeWindow)
            revert WindowClosed();
        t.status = TaskStatus.DISPUTED;
        emit TaskDisputed(taskId);
    }

    function resolveDispute(
        uint256 taskId,
        bool refundPoster
    ) external onlyOwner {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.DISPUTED, "Not disputed");

        if (refundPoster) {
            t.status = TaskStatus.FAILED;

            // Poster gets their original remaining balance + all voided agent payments
            uint256 totalRefund = t.remainingPosterRefund;
            for (uint i = 0; i < t.assignedAgents.length; i++) {
                address agent = t.assignedAgents[i];
                totalRefund += pendingPayments[taskId][agent];
                pendingPayments[taskId][agent] = 0; // Void agent portion
            }

            t.remainingPosterRefund = 0;
            payable(t.poster).transfer(totalRefund);
        } else {
            t.status = TaskStatus.COMPLETED;
        }

        emit DisputeResolved(taskId, refundPoster);
    }

    function claimPayment(uint256 taskId) external nonReentrant {
        uint256 amount = pendingPayments[taskId][msg.sender];
        require(amount > 0, "Nothing to claim");
        require(
            block.timestamp >= earliestClaimTime[taskId][msg.sender],
            "Dispute window still open"
        );
        Task storage t = tasks[taskId];
        require(t.status != TaskStatus.DISPUTED, "Task disputed");

        pendingPayments[taskId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit PaymentClaimed(taskId, msg.sender, amount);
    }

    function failExpiredTask(uint256 taskId) external nonReentrant {
        Task storage t = tasks[taskId];
        if (
            t.status != TaskStatus.ASSIGNED &&
            t.status != TaskStatus.IN_PIPELINE &&
            t.status != TaskStatus.VERIFYING
        ) revert CannotFail();
        if (block.timestamp <= t.deadline) revert NotExpired();

        t.status = TaskStatus.FAILED;
        payable(t.poster).transfer(t.totalPayment);

        for (uint i = 0; i < t.assignedAgents.length; i++) {
            address agent = t.assignedAgents[i];
            AgentRegistry.Agent memory a = registry.getAgent(agent);

            bool slashThis = false;
            if (t.isSequential) {
                // In sequential mode, only slash the current bottleneck agent
                // Agents downstream of the current stage are not at fault
                if (
                    i == t.currentPipelineStage &&
                    !agentSubmitted[taskId][agent]
                ) {
                    slashThis = true;
                }
            } else {
                // In broadcast mode, slash anyone who failed to submit
                if (!agentSubmitted[taskId][agent]) {
                    slashThis = true;
                }
            }

            vault.unlockStake(
                a.owner,
                agent,
                t.agentStakes[i],
                taskId,
                slashThis,
                slashThis ? t.poster : address(0)
            );
            if (slashThis) emit AgentSlashed(taskId, agent, t.agentStakes[i]);
        }

        emit TaskFailed(taskId, "Deadline exceeded");
    }

    function getTaskBasic(
        uint256 taskId
    )
        external
        view
        returns (
            address poster,
            uint256 totalPayment,
            uint256 deadline,
            TaskStatus status,
            bytes32 criteriaHash,
            string memory criteriaURI,
            bool isSequential
        )
    {
        Task storage t = tasks[taskId];
        return (
            t.poster,
            t.totalPayment,
            t.deadline,
            t.status,
            t.criteriaHash,
            t.criteriaURI,
            t.isSequential
        );
    }

    function getTaskAgents(
        uint256 taskId
    ) external view returns (address[] memory agents, uint256[] memory stakes) {
        return (tasks[taskId].assignedAgents, tasks[taskId].agentStakes);
    }
}
