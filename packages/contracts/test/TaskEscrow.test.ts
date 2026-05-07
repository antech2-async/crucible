import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TaskEscrow } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('TaskEscrow', () => {
  let escrow: TaskEscrow;
  let owner: SignerWithAddress;
  let poster: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let assignmentEngine: SignerWithAddress;
  let slashingJudge: SignerWithAddress;
  let vault: any;
  let registry: any;
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

    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    escrow = await TaskEscrowFactory.deploy(
      assignmentEngine.address,
      await vault.getAddress(),
      await registry.getAddress(),
    );

    await vault.setEscrowContract(await escrow.getAddress());
    await escrow.setSlashingJudge(slashingJudge.address);

    // FUND SUBSIDY TREASURY
    await vault.fundTreasury({ value: ethers.parseEther('10.0') });

    // Initial Registration for Agents
    await inftMock.connect(agent1).mintAgent(agent1.address, 'uri1', ethers.ZeroHash, '0x', {
      value: ethers.parseEther('0.001'),
    });
    await inftMock.connect(agent2).mintAgent(agent2.address, 'uri2', ethers.ZeroHash, '0x', {
      value: ethers.parseEther('0.001'),
    });

    await registry
      .connect(agent1)
      .registerNativeAgent(agent1.address, 1, ethers.ZeroHash, ['research']);
    await registry
      .connect(agent2)
      .registerNativeAgent(agent2.address, 2, ethers.ZeroHash, ['writing']);
  });

  describe('postTask', () => {
    it('allows posting a task with escrowed funds', async () => {
      const payment = ethers.parseEther('1.0');

      await expect(
        escrow
          .connect(poster)
          .postTask(3600000000, ethers.encodeBytes32String('hash'), 'ipfs://criteriaURI', false, {
            value: payment,
          }),
      )
        .to.emit(escrow, 'TaskPosted')
        .withArgs(0, poster.address, payment, false);

      const task = await escrow.tasks(0);
      expect(task.poster).to.equal(poster.address);
      expect(task.totalPayment).to.equal(payment);
      expect(task.status).to.equal(0); // OPEN
    });

    it('reverts if no payment sent', async () => {
      await expect(
        escrow
          .connect(poster)
          .postTask(3600000000, ethers.encodeBytes32String('hash'), 'uri', false, {
            value: 0,
          }),
      ).to.be.revertedWithCustomError(escrow, 'PaymentRequired');
    });
  });

  describe('assignAgents', () => {
    beforeEach(async () => {
      await escrow
        .connect(poster)
        .postTask(3600000000, ethers.encodeBytes32String('hash'), 'ipfs://criteriaURI', false, {
          value: ethers.parseEther('1.0'),
        });
    });

    it('allows assignment engine to assign agents with stakes', async () => {
      const stakes = [ethers.parseEther('0.1'), ethers.parseEther('0.1')];

      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await vault.connect(agent2).deposit({ value: ethers.parseEther('1.0') });

      await expect(
        escrow.connect(assignmentEngine).assignAgents(0, [agent1.address, agent2.address], stakes),
      ).to.emit(escrow, 'AgentsAssigned');

      const task = await escrow.tasks(0);
      expect(task.status).to.equal(1); // ASSIGNED
    });

    it('reverts if unauthorized caller assigns', async () => {
      await expect(
        escrow.connect(agent1).assignAgents(0, [agent1.address], [ethers.parseEther('0.1')]),
      ).to.be.revertedWithCustomError(escrow, 'UnauthorizedEngine');
    });
  });

  describe('submitOutput', () => {
    beforeEach(async () => {
      await escrow
        .connect(poster)
        .postTask(3600000000, ethers.encodeBytes32String('hash'), 'ipfs://criteriaURI', false, {
          value: ethers.parseEther('1.0'),
        });
      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await vault.connect(agent2).deposit({ value: ethers.parseEther('1.0') });
      await escrow
        .connect(assignmentEngine)
        .assignAgents(
          0,
          [agent1.address, agent2.address],
          [ethers.parseEther('0.1'), ethers.parseEther('0.1')],
        );
    });

    it('allows assigned agent to submit output with stake', async () => {
      await expect(escrow.connect(agent1).submitOutput(0, '0xOutputHash', '0x'))
        .to.emit(escrow, 'OutputSubmitted')
        .withArgs(0, agent1.address, '0xOutputHash');
    });

    it('reverts if already submitted', async () => {
      await escrow.connect(agent1).submitOutput(0, '0xOutputHash', '0x');
      await expect(
        escrow.connect(agent1).submitOutput(0, 'hash', '0x'),
      ).to.be.revertedWithCustomError(escrow, 'AlreadySubmitted');
    });
  });

  describe('Resolve Tasks', () => {
    beforeEach(async () => {
      await escrow
        .connect(poster)
        .postTask(3600000000, ethers.encodeBytes32String('hash'), 'uri', false, {
          value: ethers.parseEther('1.0'),
        });
      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await escrow
        .connect(assignmentEngine)
        .assignAgents(0, [agent1.address], [ethers.parseEther('0.1')]);
      await escrow.connect(agent1).submitOutput(0, 'hash', '0x');
    });

    it('resolves task and pending payment is recorded', async () => {
      await escrow.connect(slashingJudge).resolveTask(0, [true], [ethers.parseEther('1.0')]);

      const pending = await escrow.pendingPayments(0, agent1.address);
      expect(pending).to.equal(ethers.parseEther('1.0'));

      const task = await escrow.tasks(0);
      expect(task.status).to.equal(4); // COMPLETED

      // Verification of claim
      await ethers.provider.send('evm_increaseTime', [86401]);
      await ethers.provider.send('evm_mine', []);

      const balBefore = await ethers.provider.getBalance(agent1.address);
      await escrow.connect(agent1).claimPayment(0);
      const balAfter = await ethers.provider.getBalance(agent1.address);
      expect(balAfter).to.be.gt(balBefore);
    });

    it('slashes agent and resolves', async () => {
      await expect(escrow.connect(slashingJudge).resolveTask(0, [false], [0])).to.emit(
        escrow,
        'AgentSlashed',
      );

      const task = await escrow.tasks(0);
      expect(task.status).to.equal(7); // FAILED (all agents failed)
    });
  });

  describe('failConsensus (Deadline Trap)', () => {
    beforeEach(async () => {
      // Set deadline in the past for this test
      const blockNow = await ethers.provider.getBlock('latest').then((b) => b!.timestamp);
      await escrow
        .connect(poster)
        .postTask(blockNow + 100, ethers.encodeBytes32String('hash'), 'uri', false, {
          value: ethers.parseEther('1.0'),
        });
      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await escrow
        .connect(assignmentEngine)
        .assignAgents(0, [agent1.address], [ethers.parseEther('0.1')]);

      // Move time forward
      await ethers.provider.send('evm_increaseTime', [200]);
      await ethers.provider.send('evm_mine', []);
    });

    it('forces failure if deadline trap triggered', async () => {
      await expect(escrow.failExpiredTask(0))
        .to.emit(escrow, 'TaskFailed')
        .withArgs(0, 'Deadline exceeded');

      const task = await escrow.tasks(0);
      expect(task.status).to.equal(7); // FAILED
    });
  });
});
