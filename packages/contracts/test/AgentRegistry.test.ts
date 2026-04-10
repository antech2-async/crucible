import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgentRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let owner: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let judge: SignerWithAddress;

  beforeEach(async () => {
    [owner, agent1, agent2, judge] = await ethers.getSigners();
    const AgentRegistryFactory = await ethers.getContractFactory('AgentRegistry');
    registry = await AgentRegistryFactory.deploy();
    
    // Authorize the judge mock
    await registry.addAuthorizedUpdater(judge.address);
  });

  describe('Agent Registration', () => {
    it('successfully registers an agent with default Tier 0', async () => {
      await registry.connect(agent1).registerAgent(
        agent1.address,
        1,
        '0xInitialHash',
        ['research', 'writing']
      );

      const agentData = await registry.getAgent(agent1.address);
      expect(agentData.owner).to.equal(agent1.address);
      expect(agentData.trustTier).to.equal(0);
      expect(agentData.totalTasksCompleted).to.equal(0);
      expect(agentData.isActive).to.be.true;
    });

    it('prevents duplicate INFT registrations', async () => {
      await registry.connect(agent1).registerAgent(agent1.address, 1, '0xInit', []);
      await expect(
        registry.connect(agent2).registerAgent(agent2.address, 1, '0xInit2', [])
      ).to.be.revertedWith('INFT already used');
    });

    it('prevents registering the same agent address twice', async () => {
      await registry.connect(agent1).registerAgent(agent1.address, 1, '0xInit', []);
      await expect(
        registry.connect(agent1).registerAgent(agent1.address, 2, '0xInit', [])
      ).to.be.revertedWith('Already registered');
    });
  });

  describe('updateHistoryAndTrust', () => {
    beforeEach(async () => {
      await registry.connect(agent1).registerAgent(agent1.address, 1, '0xInitialHash', []);
    });

    it('allows authorized updaters to change trust tiers', async () => {
      // Simulate task completion, upgrading to Tier 1
      await expect(
        registry.connect(judge).updateHistoryAndTrust(
          agent1.address,
          '0xNewHash',
          1,
          false
        )
      ).to.emit(registry, 'TrustTierUpdated').withArgs(agent1.address, 0, 1);

      const agentData = await registry.getAgent(agent1.address);
      expect(agentData.trustTier).to.equal(1);
      expect(agentData.historyRootHash).to.equal('0xNewHash');
      expect(agentData.totalTasksCompleted).to.equal(1);
      expect(agentData.totalSlashEvents).to.equal(0);
      // Min stake required drops
      expect(agentData.minStakeRequired).to.equal(ethers.parseEther('0.03'));
    });

    it('increments slash events when wasSlashed is true', async () => {
      await registry.connect(judge).updateHistoryAndTrust(agent1.address, '0xFail', 0, true);
      
      const agentData = await registry.getAgent(agent1.address);
      expect(agentData.totalTasksCompleted).to.equal(1);
      expect(agentData.totalSlashEvents).to.equal(1);
    });

    it('prevents unauthorized addresses from updating trust', async () => {
      await expect(
        registry.connect(agent2).updateHistoryAndTrust(agent1.address, '0xHack', 4, false)
      ).to.be.revertedWith('Not authorized');
    });
  });

  describe('Capabilities Search', () => {
    it('returns array of agents with matching capabilities', async () => {
      await registry.connect(agent1).registerAgent(agent1.address, 1, 'hash', ['coding']);
      await registry.connect(agent2).registerAgent(agent2.address, 2, 'hash', ['writing', 'coding']);

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
