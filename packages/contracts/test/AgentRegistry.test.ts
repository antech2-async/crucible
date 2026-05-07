import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgentRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let judge: SignerWithAddress;
  let inftMock: any;

  beforeEach(async () => {
    [, agent1, agent2, judge] = await ethers.getSigners();

    // Deploy Mock INFT
    const ERC721Mock = await ethers.getContractFactory('CrucibleINFT');
    inftMock = await ERC721Mock.deploy(agent1.address); // dummy owner

    const AgentRegistryFactory = await ethers.getContractFactory('AgentRegistry');
    registry = await AgentRegistryFactory.deploy();

    await registry.setINFTContract(await inftMock.getAddress());

    // Authorize the judge mock
    await registry.addAuthorizedUpdater(judge.address);
  });

  describe('Agent Registration', () => {
    it('successfully registers an agent with default Tier 0', async () => {
      await inftMock.connect(agent1).mintAgent(agent1.address, 'uri', ethers.ZeroHash, '0x', {
        value: ethers.parseEther('0.001'),
      });
      await registry
        .connect(agent1)
        .registerNativeAgent(agent1.address, 1, ethers.ZeroHash, ['research', 'writing']);

      const agentData = await registry.getAgent(agent1.address);
      expect(agentData.owner).to.equal(agent1.address);
      expect(agentData.trustTier).to.equal(0);
      expect(agentData.totalTasksCompleted).to.equal(0);
      expect(agentData.isActive).to.equal(true);
    });

    it('prevents duplicate INFT registrations', async () => {
      await inftMock.connect(agent1).mintAgent(agent1.address, 'uri', ethers.ZeroHash, '0x', {
        value: ethers.parseEther('0.001'),
      });
      await registry.connect(agent1).registerNativeAgent(agent1.address, 1, ethers.ZeroHash, []);

      // agent1 sells their INFT to agent2. agent2 tries to register it again.
      await inftMock.connect(agent1).transferFrom(agent1.address, agent2.address, 1);

      await expect(
        registry.connect(agent2).registerNativeAgent(agent2.address, 1, ethers.ZeroHash, []),
      ).to.be.revertedWithCustomError(registry, 'INFTAlreadyUsed');
    });

    it('prevents registering the same agent address twice', async () => {
      await inftMock.connect(agent1).mintAgent(agent1.address, 'uri', ethers.ZeroHash, '0x', {
        value: ethers.parseEther('0.001'),
      });
      await inftMock.connect(agent1).mintAgent(agent1.address, 'uri2', ethers.ZeroHash, '0x', {
        value: ethers.parseEther('0.001'),
      });

      await registry.connect(agent1).registerNativeAgent(agent1.address, 1, ethers.ZeroHash, []);
      await expect(
        registry.connect(agent1).registerNativeAgent(agent1.address, 2, ethers.ZeroHash, []),
      ).to.be.revertedWithCustomError(registry, 'AlreadyRegistered');
    });
  });

  describe('updateHistoryAndTrust', () => {
    beforeEach(async () => {
      await inftMock.connect(agent1).mintAgent(agent1.address, 'uri', ethers.ZeroHash, '0x', {
        value: ethers.parseEther('0.001'),
      });
      await registry.connect(agent1).registerNativeAgent(agent1.address, 1, ethers.ZeroHash, []);
    });

    it('allows authorized updaters to change trust tiers', async () => {
      // Simulate task completion, upgrading to Tier 1
      await expect(
        registry.connect(judge).updateHistoryAndTrust(agent1.address, ethers.ZeroHash, 1, false),
      )
        .to.emit(registry, 'TrustTierUpdated')
        .withArgs(agent1.address, 0, 1);

      const agentData = await registry.getAgent(agent1.address);
      expect(agentData.trustTier).to.equal(1);
      expect(agentData.historyRootHash).to.equal(ethers.ZeroHash);
      expect(agentData.totalTasksCompleted).to.equal(1);
      expect(agentData.totalSlashEvents).to.equal(0);
      // Min stake required drops
      expect(agentData.minStakeRequired).to.equal(ethers.parseEther('0.03'));
    });

    it('increments slash events when wasSlashed is true', async () => {
      await registry.connect(judge).updateHistoryAndTrust(agent1.address, ethers.ZeroHash, 0, true);

      const agentData = await registry.getAgent(agent1.address);
      expect(agentData.totalTasksCompleted).to.equal(1);
      expect(agentData.totalSlashEvents).to.equal(1);
    });

    it('prevents unauthorized addresses from updating trust', async () => {
      await expect(
        registry.connect(agent2).updateHistoryAndTrust(agent1.address, ethers.ZeroHash, 4, false),
      ).to.be.revertedWithCustomError(registry, 'NotAuthorized');
    });
  });

  describe('Capabilities Search', () => {
    it('returns array of agents with matching capabilities', async () => {
      await inftMock.connect(agent1).mintAgent(agent1.address, 'uri', ethers.ZeroHash, '0x', {
        value: ethers.parseEther('0.001'),
      });
      await inftMock.connect(agent2).mintAgent(agent2.address, 'uri', ethers.ZeroHash, '0x', {
        value: ethers.parseEther('0.001'),
      });

      await registry
        .connect(agent1)
        .registerNativeAgent(agent1.address, 1, ethers.ZeroHash, ['coding']);
      await registry
        .connect(agent2)
        .registerNativeAgent(agent2.address, 2, ethers.ZeroHash, ['writing', 'coding']);

      const coders = await registry.getAgentsByCapability('coding');
      expect(coders.length).to.equal(2);
      expect(coders).to.include(agent1.address);
      expect(coders).to.include(agent2.address);

      const writers = await registry.getAgentsByCapability('writing');
      expect(writers.length).to.equal(1);
      expect(writers).to.include(agent2.address);
    });
  });
});
