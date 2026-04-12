// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IOracle {
    function verifyProof(bytes calldata proof) external view returns (bool);
}

/**
 * @title CrucibleINFT
 * @dev Each agent mints an INFT using 0G's conceptual identity standard.
 */
contract CrucibleINFT is ERC721, Ownable, ReentrancyGuard {
    struct AgentMetadata {
        bytes32 metadataHash;
        string encryptedURI;
        uint256 mintedAt;
        bool isActive;
    }

    mapping(uint256 => AgentMetadata) private _agentMetadata;
    mapping(uint256 => mapping(address => bytes)) private _authorizations;

    address public oracle;
    uint256 private _nextTokenId = 1;
    uint256 public mintFee = 0.001 ether;

    error InsufficientMintFee();
    error InvalidAgentProof();
    error NotTokenOwner();

    event AgentMinted(uint256 indexed tokenId, address indexed owner);
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash);
    event UsageAuthorized(uint256 indexed tokenId, address indexed executor);

    constructor(
        address _initialOwner
    ) public ERC721("Crucible Agent", "CRAG") Ownable(_initialOwner) {}

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function mintAgent(
        address to,
        string calldata encryptedURI,
        bytes32 metadataHash,
        bytes calldata proof
    ) external payable returns (uint256) {
        if (msg.value < mintFee) revert InsufficientMintFee();

        // Verify proof if oracle is set
        if (oracle != address(0)) {
            if (!IOracle(oracle).verifyProof(proof)) revert InvalidAgentProof();
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        _agentMetadata[tokenId] = AgentMetadata({
            metadataHash: metadataHash,
            encryptedURI: encryptedURI,
            mintedAt: block.timestamp,
            isActive: true
        });

        emit AgentMinted(tokenId, to);
        return tokenId;
    }

    function updateMetadata(
        uint256 tokenId,
        string calldata newEncryptedURI,
        bytes32 newMetadataHash,
        bytes calldata proof
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        if (oracle != address(0)) {
            if (!IOracle(oracle).verifyProof(proof)) revert InvalidAgentProof();
        }

        _agentMetadata[tokenId].encryptedURI = newEncryptedURI;
        _agentMetadata[tokenId].metadataHash = newMetadataHash;

        emit MetadataUpdated(tokenId, newMetadataHash);
    }

    function authorizeUsage(
        uint256 tokenId,
        address executor,
        bytes calldata authData
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _authorizations[tokenId][executor] = authData;
        emit UsageAuthorized(tokenId, executor);
    }

    function getMetadata(
        uint256 tokenId
    ) external view returns (AgentMetadata memory) {
        return _agentMetadata[tokenId];
    }

    function isAuthorized(
        uint256 tokenId,
        address executor
    ) external view returns (bool) {
        return _authorizations[tokenId][executor].length > 0;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
