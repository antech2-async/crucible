import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TaskEscrow, AgentStakeVault, AgentRegistry, TrustCalculator } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('Hardening Audit', () => {
  let escrow: TaskEscrow;
  let vault: AgentStakeVault;
  let registry: AgentRegistry;
  let calculator: TrustCalculator;
  
  let owner: SignerWithAddress;
  let poster: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let assignmentEngine: SignerWithAddress;
  let slashingJudge: SignerWithAddress;
  let inftMock: any;

  beforeEach(async () => {
    [owner, poster, agent1, agent2, assignmentEngine, slashingJudge] = await ethers.getSigners();
    
    const ERC721Mock = await ethers.getContractFactory('CrucibleINFT');
    inftMock = await ERC721Mock.deploy(owner.address);

    const Registry = await ethers.getContractFactory('AgentRegistry');
    registry = await Registry.deploy();
    await registry.setINFTContract(await inftMock.getAddress());
    
    const Vault = await ethers.getContractFactory('AgentStakeVault');
    vault = await Vault.deploy();

    const Calc = await ethers.getContractFactory('TrustCalculator');
    calculator = await Calc.deploy();

    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    escrow = await TaskEscrowFactory.deploy(assignmentEngine.address, await vault.getAddress(), await registry.getAddress());

    await vault.setEscrowContract(await escrow.getAddress());
    await escrow.setSlashingJudge(slashingJudge.address);
    await vault.fundTreasury({ value: ethers.parseEther('10.0') });

    // Register Agent 1 as NATIVE
    await inftMock.connect(agent1).mintAgent(agent1.address, "uri1", ethers.ZeroHash, "0x", { value: ethers.parseEther("0.001") });
    await registry.connect(agent1).registerNativeAgent(agent1.address, 1, ethers.ZeroHash, ['research']);

    // Register Agent 2 as EXTERNAL
    await inftMock.connect(agent2).mintAgent(agent2.address, "uri2", ethers.ZeroHash, "0x", { value: ethers.parseEther("0.001") });
    await registry.connect(agent2).registerExternalAgent(agent2.address, 2, ethers.ZeroHash, ['writing'], 'http://webhook');
  });

  describe('Sequential Bottleneck Slashing', () => {
    it('only slashes the current active agent in a sequential pipeline', async () => {
      // 1. Post a sequential task
      await escrow.connect(poster).postTask(
        (await ethers.provider.getBlock('latest'))!.timestamp + 3600,
        ethers.encodeBytes32String('criteria'),
        'uri',
        true, // isSequential
        { value: ethers.parseEther('1.0') }
      );

      // 2. Assign both agents
      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await vault.connect(agent2).deposit({ value: ethers.parseEther('1.0') });

      const stakeAmount = ethers.parseEther('0.1');
      await escrow.connect(assignmentEngine).assignAgents(
        0,
        [agent1.address, agent2.address],
        [stakeAmount, stakeAmount]
      );

      // 3. Fast forward past deadline
      await ethers.provider.send('evm_increaseTime', [3601]);
      await ethers.provider.send('evm_mine', []);

      // 4. Fail the task. Agent 1 is at Stage 0 (bottleneck), Agent 2 is waiting.
      const initialVault1 = await vault.deposits(agent1.address);
      const initialVault2 = await vault.deposits(agent2.address);

      await expect(escrow.failExpiredTask(0))
        .to.emit(escrow, 'AgentSlashed')
        .withArgs(0, agent1.address, stakeAmount);

      // Agent 1 should be slashed, Agent 2 should NOT be slashed
      const finalVault1 = await vault.deposits(agent1.address);
      const finalVault2 = await vault.deposits(agent2.address);
      const locked2 = await vault.lockedStakes(agent2.address);

      // ACCOUNT FOR 50% SUBSIDY: agent1 only loses 0.05 ETH of their own deposit
      const subsidy = stakeAmount / BigInt(2);
      expect(finalVault1).to.equal(initialVault1 - (stakeAmount - subsidy));
      expect(finalVault2).to.equal(initialVault2); // No deduction
      expect(locked2).to.equal(0); // Stake returned to owner
    });
  });

  describe('Protocol Fee and Yield', () => {
    it('redirects 2% of slashed stakes to the protocol treasury', async () => {
      await escrow.connect(poster).postTask(
        (await ethers.provider.getBlock('latest'))!.timestamp + 3600,
        ethers.encodeBytes32String('criteria'),
        'uri',
        false,
        { value: ethers.parseEther('1.0') }
      );

      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      const stakeAmount = ethers.parseEther('0.1');
      await escrow.connect(assignmentEngine).assignAgents(
        0, [agent1.address], [stakeAmount]
      );

      const initialTreasury = await vault.slashedTreasury();

      await ethers.provider.send('evm_increaseTime', [3601]);
      await ethers.provider.send('evm_mine', []);

      await escrow.failExpiredTask(0);
      
      const finalTreasury = await vault.slashedTreasury();
      const expectedFee = (stakeAmount * BigInt(2)) / BigInt(100);
      const subsidyUsed = stakeAmount / BigInt(2);
      
      // Treasury receives 2% fee, but loses the 50% subsidy it put up
      expect(finalTreasury).to.equal(initialTreasury + expectedFee - subsidyUsed);
    });
  });

  describe('External Agent Multipliers', () => {
    it('applies 1.5x multiplier to External agents vs Native agents at Tier 0', async () => {
      const nativeMultiplier = await calculator.getStakeMultiplier(0, 0); // Tier 0, Native
      const externalMultiplier = await calculator.getStakeMultiplier(0, 1); // Tier 0, External

      expect(externalMultiplier).to.equal((nativeMultiplier * BigInt(150)) / BigInt(100));
    });

    it('ensures AgentRegistry records the 1.5x stake during registration', async () => {
      const agent1Data = await registry.getAgent(agent1.address);
      const agent2Data = await registry.getAgent(agent2.address);

      // Base stake for Tier 0 is 0.05 ETH
      const baseStake = ethers.parseEther('0.05');
      expect(agent1Data.minStakeRequired).to.equal(baseStake);
      expect(agent2Data.minStakeRequired).to.equal((baseStake * BigInt(150)) / BigInt(100));
    });
  });
});
