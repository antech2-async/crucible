import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  TaskEscrow,
  AgentStakeVault,
  AgentRegistry,
  TrustCalculator,
  SlashingJudge,
} from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('Deep-Spec Hardening', () => {
  let escrow: TaskEscrow;
  let vault: AgentStakeVault;
  let registry: AgentRegistry;
  let calculator: TrustCalculator;
  let judge: SlashingJudge;

  let owner: SignerWithAddress;
  let poster: SignerWithAddress;
  let agent1: SignerWithAddress;
  let assignmentEngine: SignerWithAddress;
  let _inspector: SignerWithAddress;
  let inftMock: any;

  beforeEach(async () => {
    [owner, poster, agent1, assignmentEngine, _inspector] = await ethers.getSigners();

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
    escrow = await TaskEscrowFactory.deploy(
      assignmentEngine.address,
      await vault.getAddress(),
      await registry.getAddress(),
    );

    const JudgeFactory = await ethers.getContractFactory('SlashingJudge');
    judge = await JudgeFactory.deploy(
      await registry.getAddress(),
      await escrow.getAddress(),
      await calculator.getAddress(),
    );

    await vault.setEscrowContract(await escrow.getAddress());
    await registry.addAuthorizedUpdater(await judge.getAddress());
    await escrow.setSlashingJudge(await judge.getAddress());
    await judge.addAuthorizedCaller(owner.address);
    await vault.fundTreasury({ value: ethers.parseEther('10.0') });

    // Register Agent 1
    await inftMock.connect(agent1).mintAgent(agent1.address, 'uri', ethers.ZeroHash, {
      value: ethers.parseEther('0.001'),
    });
    await registry
      .connect(agent1)
      .registerNativeAgent(agent1.address, 1, ethers.ZeroHash, ['research']);
  });

  describe('Claim Pattern & Dispute Safety', () => {
    it('prevents agents from claiming payments during the dispute window', async () => {
      // 1. Setup Task
      await escrow
        .connect(poster)
        .postTask(
          (await ethers.provider.getBlock('latest'))!.timestamp + 3600,
          ethers.encodeBytes32String('criteria'),
          'uri',
          false,
          { value: ethers.parseEther('1.0') },
        );

      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await escrow
        .connect(assignmentEngine)
        .assignAgents(0, [agent1.address], [ethers.parseEther('0.1')]);
      await escrow.connect(agent1).submitOutput(0, 'output1', '0x');

      // 2. Resolve Task
      await judge
        .connect(owner)
        .judgeTask(0, [agent1.address], [true], [ethers.ZeroHash], [4, 4, 1, 0]);

      // 3. Agent tries to claim immediately
      await expect(escrow.connect(agent1).claimPayment(0)).to.be.revertedWith(
        'Dispute window still open',
      );

      // 4. Advance time past window
      await ethers.provider.send('evm_increaseTime', [86401]); // > 24h
      await ethers.provider.send('evm_mine', []);

      const balBefore = await ethers.provider.getBalance(agent1.address);
      await escrow.connect(agent1).claimPayment(0);
      const balAfter = await ethers.provider.getBalance(agent1.address);
      expect(balAfter).to.be.gt(balBefore);
    });

    it('allows owner to resolve disputes and refund poster', async () => {
      await escrow
        .connect(poster)
        .postTask(
          (await ethers.provider.getBlock('latest'))!.timestamp + 3600,
          ethers.encodeBytes32String('criteria'),
          'uri',
          false,
          { value: ethers.parseEther('1.0') },
        );
      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await escrow
        .connect(assignmentEngine)
        .assignAgents(0, [agent1.address], [ethers.parseEther('0.1')]);
      await escrow.connect(agent1).submitOutput(0, 'output1', '0x');
      await judge
        .connect(owner)
        .judgeTask(0, [agent1.address], [true], [ethers.ZeroHash], [4, 4, 1, 0]);

      await escrow.connect(poster).disputeTask(0);

      const initialPosterBalance = await ethers.provider.getBalance(poster.address);
      await escrow.connect(owner).resolveDispute(0, true); // Refund poster

      const finalPosterBalance = await ethers.provider.getBalance(poster.address);
      expect(finalPosterBalance).to.be.gt(initialPosterBalance);

      const task = await escrow.getTaskBasic(0);
      expect(task.status).to.equal(7); // TaskStatus.FAILED
    });
  });

  describe('Subsidy Accounting Flow', () => {
    it('correctly reserves and recycles subsidies in the treasury', async () => {
      const initialTreasury = await vault.slashedTreasury();

      // 1. Post and assign with subsidy
      await escrow
        .connect(poster)
        .postTask(
          (await ethers.provider.getBlock('latest'))!.timestamp + 3600,
          ethers.encodeBytes32String('criteria'),
          'uri',
          false,
          { value: ethers.parseEther('1.0') },
        );

      const stake = ethers.parseEther('0.1');
      const subsidy = stake / 2n;

      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await escrow.connect(assignmentEngine).assignAgents(0, [agent1.address], [stake]);
      await escrow.connect(agent1).submitOutput(0, 'output1', '0x');

      // Treasury should have DECREASED by subsidy immediately
      expect(await vault.slashedTreasury()).to.equal(initialTreasury - subsidy);

      // 2. Succeed Task
      await judge
        .connect(owner)
        .judgeTask(0, [agent1.address], [true], [ethers.ZeroHash], [4, 4, 1, 0]);

      // Treasury should be REPLENISHED (Recycled)
      expect(await vault.slashedTreasury()).to.equal(initialTreasury);
    });

    it('burns subsidy and collects fee on slash', async () => {
      const initialTreasury = await vault.slashedTreasury();
      await escrow
        .connect(poster)
        .postTask(
          (await ethers.provider.getBlock('latest'))!.timestamp + 3600,
          ethers.encodeBytes32String('criteria'),
          'uri',
          false,
          { value: ethers.parseEther('1.0') },
        );
      const stake = ethers.parseEther('0.1');
      const subsidy = stake / 2n;
      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await escrow.connect(assignmentEngine).assignAgents(0, [agent1.address], [stake]);
      await escrow.connect(agent1).submitOutput(0, 'output1', '0x');

      // Fail Task
      await judge
        .connect(owner)
        .judgeTask(0, [agent1.address], [false], [ethers.ZeroHash], [4, 4, 1, 1]);

      // Fee = 2% of total stake (0.002)
      // Subsidy was 0.05
      // Expect: initialTreasury - subsidy + fee
      const fee = (stake * 2n) / 100n;
      expect(await vault.slashedTreasury()).to.equal(initialTreasury - subsidy + fee);
    });
  });
});
